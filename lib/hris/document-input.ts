/**
 * Request body for POST /api/v1/documents (diagram step 2): validation, and
 * turning it into the exact `ProposalDetails` that gets rendered.
 *
 * A separate contract from the legacy synchronous route
 * (lib/hris/proposal-input.ts), which stays frozen. The scalar readers are
 * shared so both validate text, numbers, dates and logos identically.
 *
 * Differences from the legacy body:
 * - `tenantId` + `quotationId` identify the document (no `companyId`).
 * - `selectedModules` holds HRM module ids (lib/hris/hrm-modules.ts) and is
 *   required.
 * - `fieldTrackingFee` is gone: employee tracking is now priced inside `mrcFee`.
 * - `problemStatementText` must pass the HTML allowlist.
 * Unknown fields are rejected, so a typo never yields a silently wrong PDF.
 */

import { toDhakaTimestamp } from "@/lib/audit/events";
import { hasProblemStatementContent } from "@/lib/module-page-layout";
import type { ProposalDetails } from "@/lib/presentation-session";
import {
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_RECIPIENT_TITLE,
  DEFAULT_VALIDITY_DAYS,
} from "@/lib/proposal-defaults";
import { expandHrmModules, validateHrmModules, type HrmModuleId } from "./hrm-modules";
import { validateProblemStatementHtml } from "./problem-statement";
import {
  isBlank,
  MAX_PROBLEM_STATEMENT_CHARS,
  readDate,
  readLogo,
  readNumber,
  readString,
  type Body,
  type FieldError,
} from "./proposal-input";

export type HrisDocType = "proposal";

export type DocumentRequest = {
  docType: HrisDocType;
  tenantId: string;
  quotationId: string;
  clientName: string;
  requestedBy?: string;
  logoDataUrl?: string;
  /** Canonical HRM ids, in package order. */
  hrmModules: HrmModuleId[];
  /** What renders; `selectedModules` holds the expanded builder ids. */
  details: ProposalDetails;
};

export type DocumentParseResult =
  | { ok: true; value: DocumentRequest }
  | { ok: false; errors: FieldError[] };

/** Both ids become storage path segments, so never `/` or `..`. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const KNOWN_FIELDS = new Set([
  "docType",
  "tenantId",
  "quotationId",
  "clientName",
  "requestedBy",
  "logo",
  "documentTitle",
  "recipientTitle",
  "preparedDate",
  "employeeCount",
  "mrcFee",
  "rolloutCharge",
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

/** HRIS ids may be UUIDs or integers; both are stored as text. */
function readId(body: Body, field: string, errors: FieldError[]): string | undefined {
  const value = body[field];
  if (isBlank(value)) {
    errors.push({ field, message: "Required." });
    return undefined;
  }

  const id = typeof value === "number" && Number.isInteger(value) ? String(value) : value;
  if (typeof id !== "string" || !ID_PATTERN.test(id.trim())) {
    errors.push({ field, message: "Must be 1-64 characters of letters, digits, '-' or '_'." });
    return undefined;
  }
  return id.trim();
}

function readDocType(body: Body, errors: FieldError[]): HrisDocType | undefined {
  if (body.docType === undefined || body.docType === null) return "proposal";
  if (body.docType === "proposal") return "proposal";
  errors.push({ field: "docType", message: 'Must be "proposal".' });
  return undefined;
}

export function parseDocumentRequest(raw: unknown): DocumentParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: [{ field: "(body)", message: "Body must be a JSON object." }] };
  }

  const body = raw as Body;
  const errors: FieldError[] = Object.keys(body)
    .filter((key) => !KNOWN_FIELDS.has(key))
    .map((field) => ({ field, message: "Unknown field." }));

  const docType = readDocType(body, errors);
  const tenantId = readId(body, "tenantId", errors);
  const quotationId = readId(body, "quotationId", errors);
  const clientName = readString(body, "clientName", errors, { required: true });
  const requestedBy = readString(body, "requestedBy", errors);
  const logoDataUrl = readLogo(body, errors);

  const employeeCount = readNumber(body, "employeeCount", errors, { required: true, integer: true });
  const mrcFee = readNumber(body, "mrcFee", errors, { required: true });
  const rolloutCharge = readNumber(body, "rolloutCharge", errors);
  const validityDays = readNumber(body, "validityDays", errors, { integer: true });

  const documentTitle = readString(body, "documentTitle", errors);
  const recipientTitle = readString(body, "recipientTitle", errors);
  const letterAddresseeName = readString(body, "letterAddresseeName", errors);
  const preparedDate = readDate(body, "preparedDate", errors);
  const meetingDateReference = readDate(body, "meetingDateReference", errors);

  const modules = validateHrmModules(body.selectedModules);
  if (!modules.ok) errors.push({ field: "selectedModules", message: modules.message });

  const problemStatementHeading = readString(body, "problemStatementHeading", errors);
  const problemStatementText = readString(body, "problemStatementText", errors, {
    max: MAX_PROBLEM_STATEMENT_CHARS,
  });
  if (problemStatementText !== undefined) {
    const html = validateProblemStatementHtml(problemStatementText);
    if (!html.ok) errors.push({ field: "problemStatementText", message: html.message });
  }

  const preparedByName = readString(body, "preparedByName", errors);
  const preparedByTitle = readString(body, "preparedByTitle", errors);
  const preparedByPhone = readString(body, "preparedByPhone", errors);
  const preparedByEmail = readString(body, "preparedByEmail", errors);

  if (
    errors.length > 0 ||
    !modules.ok ||
    docType === undefined ||
    tenantId === undefined ||
    quotationId === undefined ||
    clientName === undefined ||
    employeeCount === undefined ||
    mrcFee === undefined
  ) {
    return { ok: false, errors };
  }

  // Same fallbacks as the builder form. "Today" is Dhaka's date and is fixed
  // here, at enqueue, so a retried render never changes the PDF.
  const today = toDhakaTimestamp(new Date()).slice(0, 10);
  const problemStatementPresent = hasProblemStatementContent(problemStatementText);

  return {
    ok: true,
    value: {
      docType,
      tenantId,
      quotationId,
      clientName,
      requestedBy,
      logoDataUrl,
      hrmModules: modules.value,
      details: {
        documentTitle: documentTitle ?? DEFAULT_DOCUMENT_TITLE,
        preparedDate: preparedDate ?? today,
        recipientTitle: recipientTitle ?? DEFAULT_RECIPIENT_TITLE,
        employeeCount,
        mrcFee,
        rolloutCharge,
        letterAddresseeName: letterAddresseeName ?? clientName,
        meetingDateReference: meetingDateReference ?? today,
        validityDays: validityDays ?? DEFAULT_VALIDITY_DAYS,
        problemStatementHeading: problemStatementPresent ? problemStatementHeading : undefined,
        problemStatementText: problemStatementPresent ? problemStatementText : undefined,
        selectedModules: expandHrmModules(modules.value),
        preparedByName,
        preparedByTitle,
        preparedByPhone,
        preparedByEmail,
      },
    },
  };
}

/** The job row's `input` column. Versioned so a stored job always re-renders. */
export type StoredJobInput = { schema: 1; details: ProposalDetails };

export function toStoredInput(details: ProposalDetails): StoredJobInput {
  // JSON round trip drops undefined keys, exactly as the row will store them.
  return { schema: 1, details: JSON.parse(JSON.stringify(details)) as ProposalDetails };
}

/** Reads a job's stored input back; null if it isn't a shape this code can render. */
export function parseStoredInput(input: unknown): ProposalDetails | null {
  if (!input || typeof input !== "object") return null;
  const { schema, details } = input as Record<string, unknown>;
  if (schema !== 1 || !details || typeof details !== "object") return null;

  const d = details as Record<string, unknown>;
  const valid =
    typeof d.documentTitle === "string" &&
    typeof d.preparedDate === "string" &&
    typeof d.recipientTitle === "string" &&
    typeof d.employeeCount === "number" &&
    typeof d.mrcFee === "number" &&
    Array.isArray(d.selectedModules);
  return valid ? (details as ProposalDetails) : null;
}
