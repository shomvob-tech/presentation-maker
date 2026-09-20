/**
 * Storage and shape for the biometric device proposal — the third document
 * type, alongside the HRIS proposal (presentation-session.ts) and the SLA
 * (sla-session.ts).
 *
 * Source of truth for the format:
 * public/resources/Proposal_For_Fingerprint_Device.pdf — four fixed pages,
 * cover / letter / quotation / terms, with no variable-length section. That
 * is why nothing here has a module-page-layout.ts counterpart: the terms page
 * is always page 4.
 *
 * The client logo lives under its own key rather than inside
 * `DeviceProposalDetails`, matching the HRIS proposal. That is not tidiness —
 * a logo data URL runs to tens of kilobytes, and the builder sends the details
 * object to the usage log as `payload_json`, where /api/track drops any body
 * over 32k characters. An inlined logo would silently cost us every
 * `previewed` event.
 */

export const DEVICE_DETAILS_KEY = "shomvob-device-details";
export const DEVICE_LOGO_KEY = "shomvob-device-logo";

/** One row of the quotation table. `id` is a stable React key, not persisted meaning. */
export type DeviceLineItem = {
  id: string;
  description: string;
  brand: string;
  modelNo: string;
  uom: string;
  quantity: number;
  unitPrice: number;
};

export type DeviceProposalDetails = {
  clientName: string;
  documentTitle: string;
  /** "YYYY-MM-DD" from <input type="date">. */
  preparedDate: string;

  /** Letter (page 2). The device letter addresses a named person, unlike the
   * HRIS letter, which opens on the recipient's title. */
  recipientName: string;
  recipientTitle: string;
  /** Letter "To," company — defaults to the client name when left blank. */
  letterAddresseeName?: string;
  keyBenefits: string[];

  /** Cover (page 1). All four blank means CoverPage falls back to
   * "Shomvob Technologies Limited" — see the note on DEFAULT_PREPARED_BY. */
  preparedByName?: string;
  preparedByTitle?: string;
  preparedByPhone?: string;
  preparedByEmail?: string;

  /** Quotation (page 3). */
  lineItems: DeviceLineItem[];
  /** 0 reproduces the source quotation: an "Excluding VAT & AIT" note and a
   * grand total equal to the sub-total. */
  vatPercent: number;

  /** Terms (page 4) — the four clauses that genuinely move between
   * quotations. The other three are static in DeviceTerms.tsx. */
  warrantyPeriod: string;
  paymentTerms: string;
  deliveryCity: string;
  deliveryLeadTime: string;
};

export const DEFAULT_DEVICE_DOCUMENT_TITLE = "Biometric Attendance Device";

/**
 * The benefits list from the source proposal, verbatim. Editable in the
 * builder — a client quoting a single door device does not need all six.
 */
export const DEFAULT_KEY_BENEFITS: string[] = [
  "Real-time and accurate attendance records",
  "Prevention of proxy attendance and time theft",
  "Seamless integration with HR and Payroll",
  "Reduced manual work for HR teams",
  "Faster and more accurate payroll processing",
  "Improved transparency and employee accountability",
];

export const DEFAULT_WARRANTY_PERIOD = "One Year";
export const DEFAULT_PAYMENT_TERMS =
  "Cash on delivery. Payment can be made by Cash, Cross Cheque, or Bank Payment.";
export const DEFAULT_DELIVERY_CITY = "Dhaka";
export const DEFAULT_DELIVERY_LEAD_TIME = "03-05 working days";

/**
 * Deliberately no default prepared-by contact, even though the source PDF
 * carries one. Baking one rep's phone number and email into the form would
 * put their contact details on every other rep's cover page — the HRIS
 * proposal leaves the same four fields blank for the same reason.
 */

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

export function isDeviceProposalDetails(
  value: unknown,
): value is DeviceProposalDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as Record<string, unknown>;

  return (
    typeof details.clientName === "string" &&
    details.clientName.trim().length > 0 &&
    typeof details.documentTitle === "string" &&
    typeof details.preparedDate === "string" &&
    typeof details.recipientName === "string" &&
    typeof details.recipientTitle === "string" &&
    isOptionalText(details.letterAddresseeName) &&
    isStringList(details.keyBenefits) &&
    isOptionalText(details.preparedByName) &&
    isOptionalText(details.preparedByTitle) &&
    isOptionalText(details.preparedByPhone) &&
    isOptionalText(details.preparedByEmail) &&
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

export function saveDeviceDetails(details: DeviceProposalDetails): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_DETAILS_KEY, JSON.stringify(details));
}

export function loadDeviceDetails(): DeviceProposalDetails | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(DEVICE_DETAILS_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isDeviceProposalDetails(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDeviceLogo(logoDataUrl: string | undefined): void {
  if (typeof window === "undefined") return;

  if (logoDataUrl) localStorage.setItem(DEVICE_LOGO_KEY, logoDataUrl);
  else localStorage.removeItem(DEVICE_LOGO_KEY);
}

export function loadDeviceLogo(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DEVICE_LOGO_KEY);
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\.+$/g, "");

  return sanitized || "Client";
}

export function buildSuggestedDevicePdfFileName(clientName: string): string {
  return `Shomvob-HR-${sanitizeFileName(clientName)}-Device-Proposal.pdf`;
}
