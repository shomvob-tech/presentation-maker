/**
 * Storage and shape for the combined HRIS + biometric device proposal — the
 * fourth document type, alongside the HRIS proposal (presentation-session.ts),
 * the SLA (sla-session.ts) and the device quotation (device-session.ts).
 *
 * This flow is a superset of the other two proposals rather than a third
 * format: the cover, module overview and letterhead chrome are the HRIS
 * ones, the hardware line items are the device ones, and the commercial
 * section is the only genuinely new page — one table carrying both.
 *
 * Page order is Cover / Letter / Solution (1-2 pages) / Commercial / Terms,
 * so the Solution section still starts on page 3 and
 * MODULE_SECTION_START_PAGE + moduleSectionPageCount() give the pages after
 * it, exactly as in the HRIS flow.
 *
 * The client logo lives under its own key rather than inside
 * `CombinedProposalDetails`, matching the other two proposal flows. A logo
 * data URL runs to tens of kilobytes and the builder sends this object to the
 * usage log as `payload_json`, where /api/track silently drops any body over
 * 32k characters.
 */

import type { DeviceLineItem } from "./device-session";

export const COMBINED_DETAILS_KEY = "shomvob-combined-details";
export const COMBINED_LOGO_KEY = "shomvob-combined-logo";

export type CombinedProposalDetails = {
  /** Cover (page 1). */
  clientName: string;
  documentTitle: string;
  /** "YYYY-MM-DD" from <input type="date">. */
  preparedDate: string;

  /** Letter (page 2). Name and title are both optional — a quotation often
   * goes to a company rather than to a person the rep can name. */
  recipientName?: string;
  recipientTitle?: string;
  /** Letter "To," company — defaults to the client name when left blank. */
  letterAddresseeName?: string;
  /** Powers "Following our meeting on [X]"; defaults to the proposal date. */
  meetingDateReference?: string;
  keyBenefits: string[];

  /** Cover prepared-by. All four blank means CoverPage falls back to
   * "Shomvob Technologies Limited". */
  preparedByName?: string;
  preparedByTitle?: string;
  preparedByPhone?: string;
  preparedByEmail?: string;

  /**
   * Solution (page 3, sometimes 4). `problemStatementText` is an HTML string
   * from Richtexteditor (Tiptap), not plain text — render it with
   * dangerouslySetInnerHTML, never as a plain string.
   */
  problemStatementHeading?: string;
  problemStatementText?: string;
  /** Module ids from lib/module-highlights.ts. */
  selectedModules: string[];
  /** Days the proposal remains valid; defaults to 30. */
  validityDays?: number;

  /** Commercial — the recurring half of the table. */
  employeeCount: number;
  mrcFee: number;
  /** Omit to drop the field-tracking row. Charged per employee, per month. */
  fieldTrackingFee?: number;

  /** Commercial — the one-time half of the table. */
  rolloutCharge?: number;
  lineItems: DeviceLineItem[];
  /**
   * Stated as a terms clause, not a table row — the HRIS proposal has always
   * handled VAT that way, and adding it to a table that already separates
   * recurring from one-time would mean two more total lines for no gain.
   * 0 drops the clause and prints an "excluding VAT & AIT" note instead.
   */
  vatPercent: number;

  /** Terms (last page) — the four values that move between quotations. */
  warrantyPeriod: string;
  paymentTerms: string;
  deliveryCity: string;
  deliveryLeadTime: string;
};

export const DEFAULT_COMBINED_DOCUMENT_TITLE =
  "Workforce Management & Attendance Hardware";

export const DEFAULT_COMBINED_VALIDITY_DAYS = 30;

function isLineItem(value: unknown): value is DeviceLineItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.description === "string" &&
    item.description.trim().length > 0 &&
    typeof item.brand === "string" &&
    typeof item.modelNo === "string" &&
    typeof item.uom === "string" &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0 &&
    typeof item.unitPrice === "number" &&
    Number.isFinite(item.unitPrice) &&
    item.unitPrice >= 0
  );
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isOptionalText(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isOptionalNonNegative(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0)
  );
}

export function isCombinedProposalDetails(
  value: unknown,
): value is CombinedProposalDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as Record<string, unknown>;

  return (
    typeof details.clientName === "string" &&
    details.clientName.trim().length > 0 &&
    typeof details.documentTitle === "string" &&
    typeof details.preparedDate === "string" &&
    isOptionalText(details.recipientName) &&
    isOptionalText(details.recipientTitle) &&
    isOptionalText(details.letterAddresseeName) &&
    isOptionalText(details.meetingDateReference) &&
    isStringList(details.keyBenefits) &&
    isOptionalText(details.preparedByName) &&
    isOptionalText(details.preparedByTitle) &&
    isOptionalText(details.preparedByPhone) &&
    isOptionalText(details.preparedByEmail) &&
    isOptionalText(details.problemStatementHeading) &&
    isOptionalText(details.problemStatementText) &&
    isStringList(details.selectedModules) &&
    isOptionalNonNegative(details.validityDays) &&
    typeof details.employeeCount === "number" &&
    Number.isFinite(details.employeeCount) &&
    details.employeeCount > 0 &&
    typeof details.mrcFee === "number" &&
    Number.isFinite(details.mrcFee) &&
    details.mrcFee > 0 &&
    isOptionalNonNegative(details.fieldTrackingFee) &&
    isOptionalNonNegative(details.rolloutCharge) &&
    Array.isArray(details.lineItems) &&
    details.lineItems.length > 0 &&
    details.lineItems.every(isLineItem) &&
    typeof details.vatPercent === "number" &&
    Number.isFinite(details.vatPercent) &&
    details.vatPercent >= 0 &&
    typeof details.warrantyPeriod === "string" &&
    typeof details.paymentTerms === "string" &&
    typeof details.deliveryCity === "string" &&
    typeof details.deliveryLeadTime === "string"
  );
}

export function saveCombinedDetails(details: CombinedProposalDetails): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMBINED_DETAILS_KEY, JSON.stringify(details));
}

export function loadCombinedDetails(): CombinedProposalDetails | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(COMBINED_DETAILS_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isCombinedProposalDetails(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCombinedLogo(logoDataUrl: string | undefined): void {
  if (typeof window === "undefined") return;

  if (logoDataUrl) localStorage.setItem(COMBINED_LOGO_KEY, logoDataUrl);
  else localStorage.removeItem(COMBINED_LOGO_KEY);
}

export function loadCombinedLogo(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COMBINED_LOGO_KEY);
}

/**
 * Same result as the other flows' sanitizers, written as a codepoint filter
 * rather than a regex with control-character escapes — those escapes have a
 * habit of being written into this file as the raw bytes they denote, which
 * compiles fine and then makes git treat the source as binary.
 */
function sanitizeFileName(value: string): string {
  const forbidden = new Set(["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);

  const cleaned = [...value.trim()]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 32 && !forbidden.has(char);
    })
    .join("");

  const sanitized = cleaned.replace(/\s+/g, "-").replace(/\.+$/g, "");
  return sanitized || "Client";
}

export function buildSuggestedCombinedPdfFileName(clientName: string): string {
  return `Shomvob-HR-${sanitizeFileName(clientName)}-HRIS-Device-Proposal.pdf`;
}
