/**
 * Request body for POST /api/v1/hris/proposals: validation, and turning it
 * into the exact `ProposalDetails` the builder form would have saved.
 *
 * The field names here are a contract with HRIS. `ProposalDetails` is an
 * internal form shape that can change; this file is the one place the two
 * are mapped, so a form refactor never silently breaks HRIS.
 *
 * Unknown fields are rejected rather than ignored: a typo like
 * `employeesCount` would otherwise produce a proposal with a missing value and
 * no error anywhere.
 */

import { toDhakaTimestamp } from "@/lib/audit/events";
import {
  hasProblemStatementContent,
  SELECTABLE_MODULES,
} from "@/lib/module-page-layout";
import type { ProposalDetails } from "@/lib/presentation-session";
import {
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_RECIPIENT_TITLE,
  DEFAULT_SELECTED_MODULE_IDS,
  DEFAULT_VALIDITY_DAYS,
} from "@/lib/proposal-defaults";

export type HrisProposalInput = {
  companyId: string;
  clientName: string;
  requestedBy?: string;
  logoDataUrl?: string;
  details: ProposalDetails;
};

export type FieldError = { field: string; message: string };

export type ParseResult =
  | { ok: true; value: HrisProposalInput }
  | { ok: false; errors: FieldError[] };

/** Becomes a storage path segment, so it must never contain `/` or `..`. */
const COMPANY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOGO_PATTERN =
  /^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

/** ~1 MB of image once base64's 4/3 overhead is taken off. */
const MAX_LOGO_CHARS = 1_400_000;
const MAX_TEXT_CHARS = 200;
const MAX_PROBLEM_STATEMENT_CHARS = 20_000;

const SELECTABLE_MODULE_IDS = new Set(SELECTABLE_MODULES.map((module) => module.id));

const KNOWN_FIELDS = new Set([
  "companyId",
  "clientName",
  "requestedBy",
  "logo",
  "documentTitle",
  "recipientTitle",
  "preparedDate",
  "employeeCount",
  "mrcFee",
  "rolloutCharge",
  "fieldTrackingFee",
  "letterAddresseeName",
  "meetingDateReference",
  "validityDays",
  "selectedModules",
  "problemStatementHeading",
  "problemStatementText",
  "preparedByName",
  "preparedByTitle",
  "preparedByPhone",
  "preparedByEmail",
]);

type Body = Record<string, unknown>;

function isBlank(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

function readString(
  body: Body,
  field: string,
  errors: FieldError[],
  { required = false, max = MAX_TEXT_CHARS } = {},
): string | undefined {
  const value = body[field];

  if (isBlank(value)) {
    if (required) errors.push({ field, message: "Required." });
    return undefined;
  }
  if (typeof value !== "string") {
    errors.push({ field, message: "Must be a string." });
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length > max) {
    errors.push({ field, message: `Must be at most ${max} characters.` });
    return undefined;
  }
  return trimmed;
}

/** Accepts a JSON number or a numeric string — HRIS form values are often strings. */
function readNumber(
  body: Body,
  field: string,
  errors: FieldError[],
  { required = false, integer = false } = {},
): number | undefined {
  const value = body[field];

  if (isBlank(value)) {
    if (required) errors.push({ field, message: "Required." });
    return undefined;
  }

  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
    errors.push({ field, message: "Must be a number greater than 0." });
    return undefined;
  }
  if (integer && !Number.isInteger(n)) {
    errors.push({ field, message: "Must be a whole number." });
    return undefined;
  }
  return n;
}

function readDate(body: Body, field: string, errors: FieldError[]): string | undefined {
  const value = readString(body, field, errors);
  if (value === undefined) return undefined;

  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    !DATE_PATTERN.test(value) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    errors.push({ field, message: "Must be a date in YYYY-MM-DD format." });
    return undefined;
  }
  return value;
}

function readCompanyId(body: Body, errors: FieldError[]): string | undefined {
  const value = body.companyId;

  if (isBlank(value)) {
    errors.push({ field: "companyId", message: "Required." });
    return undefined;
  }

  // HRIS ids may be UUIDs or integers; both are stored as text.
  const id = typeof value === "number" ? String(value) : value;
  if (typeof id !== "string" || !COMPANY_ID_PATTERN.test(id.trim())) {
    errors.push({
      field: "companyId",
      message: "Must be 1-64 characters of letters, digits, '-' or '_'.",
    });
    return undefined;
  }
  return id.trim();
}

function readLogo(body: Body, errors: FieldError[]): string | undefined {
  const value = body.logo;
  if (isBlank(value)) return undefined;

  if (typeof value !== "string" || !LOGO_PATTERN.test(value)) {
    errors.push({
      field: "logo",
      message: "Must be a base64 data URL (png, jpeg, webp, gif or svg).",
    });
    return undefined;
  }
  if (value.length > MAX_LOGO_CHARS) {
    errors.push({ field: "logo", message: "Must be 1 MB or smaller." });
    return undefined;
  }
  return value;
}

function readModules(body: Body, errors: FieldError[]): string[] | undefined {
  const value = body.selectedModules;
  if (value === undefined || value === null) return undefined;

  if (!Array.isArray(value) || value.some((id) => typeof id !== "string")) {
    errors.push({ field: "selectedModules", message: "Must be an array of module ids." });
    return undefined;
  }

  const unknown = value.filter((id) => !SELECTABLE_MODULE_IDS.has(id));
  if (unknown.length > 0) {
    errors.push({
      field: "selectedModules",
      message:
        `Unknown module id(s): ${unknown.join(", ")}. ` +
        `Valid ids: ${[...SELECTABLE_MODULE_IDS].join(", ")}.`,
    });
    return undefined;
  }

  return [...new Set(value as string[])];
}

export function parseHrisProposalInput(raw: unknown): ParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [{ field: "(body)", message: "Body must be a JSON object." }],
    };
  }

  const body = raw as Body;
  const errors: FieldError[] = Object.keys(body)
    .filter((key) => !KNOWN_FIELDS.has(key))
    .map((field) => ({ field, message: "Unknown field." }));

  const companyId = readCompanyId(body, errors);
  const clientName = readString(body, "clientName", errors, { required: true });
  const requestedBy = readString(body, "requestedBy", errors);
  const logoDataUrl = readLogo(body, errors);

  const employeeCount = readNumber(body, "employeeCount", errors, {
    required: true,
    integer: true,
  });
  const mrcFee = readNumber(body, "mrcFee", errors, { required: true });
  const rolloutCharge = readNumber(body, "rolloutCharge", errors);
  const fieldTrackingFee = readNumber(body, "fieldTrackingFee", errors);
  const validityDays = readNumber(body, "validityDays", errors, { integer: true });

  const documentTitle = readString(body, "documentTitle", errors);
  const recipientTitle = readString(body, "recipientTitle", errors);
  const letterAddresseeName = readString(body, "letterAddresseeName", errors);
  const preparedDate = readDate(body, "preparedDate", errors);
  const meetingDateReference = readDate(body, "meetingDateReference", errors);
  const selectedModules = readModules(body, errors);

  const problemStatementHeading = readString(body, "problemStatementHeading", errors);
  const problemStatementText = readString(body, "problemStatementText", errors, {
    max: MAX_PROBLEM_STATEMENT_CHARS,
  });

  const preparedByName = readString(body, "preparedByName", errors);
  const preparedByTitle = readString(body, "preparedByTitle", errors);
  const preparedByPhone = readString(body, "preparedByPhone", errors);
  const preparedByEmail = readString(body, "preparedByEmail", errors);

  if (
    errors.length > 0 ||
    companyId === undefined ||
    clientName === undefined ||
    employeeCount === undefined ||
    mrcFee === undefined
  ) {
    return { ok: false, errors };
  }

  // Same fallbacks as Clientdetails2's persistProposalSession, with "today"
  // pinned to Dhaka rather than the server's clock.
  const today = toDhakaTimestamp(new Date()).slice(0, 10);
  const problemStatementPresent = hasProblemStatementContent(problemStatementText);

  return {
    ok: true,
    value: {
      companyId,
      clientName,
      requestedBy,
      logoDataUrl,
      details: {
        documentTitle: documentTitle ?? DEFAULT_DOCUMENT_TITLE,
        preparedDate: preparedDate ?? today,
        recipientTitle: recipientTitle ?? DEFAULT_RECIPIENT_TITLE,
        employeeCount,
        mrcFee,
        rolloutCharge,
        fieldTrackingFee,
        letterAddresseeName: letterAddresseeName ?? clientName,
        meetingDateReference: meetingDateReference ?? today,
        validityDays: validityDays ?? DEFAULT_VALIDITY_DAYS,
        problemStatementHeading: problemStatementPresent
          ? problemStatementHeading
          : undefined,
        problemStatementText: problemStatementPresent
          ? problemStatementText
          : undefined,
        selectedModules: selectedModules ?? [...DEFAULT_SELECTED_MODULE_IDS],
        preparedByName,
        preparedByTitle,
        preparedByPhone,
        preparedByEmail,
      },
    },
  };
}
