export const SLA_DETAILS_KEY = "shomvob-sla-details";

/** One person signing the agreement — rendered as a signature line in Article 13. */
export type SlaSignatory = {
  name: string;
  title: string;
};

/** Shomvob's default first signatory. Editable and removable in the builder. */
export const DEFAULT_SHOMVOB_SIGNATORY: SlaSignatory = {
  name: "Hasib Rahman",
  title: "Co-founder & COO",
};

export type SlaDetails = {
  clientName: string;
  clientAddress: string;
  agreementDate: string;
  selectedFeatures: string[];
  employeeCount: number;
  monthlyFee: number;
  oneTimeFee: number;
  vatPercent: number;
  includeEmployeeTracking: boolean;
  trackingFeePerEmployee?: number;
  /** At least one each — the number of representatives per side is up to the rep. */
  clientSignatories: SlaSignatory[];
  shomvobSignatories: SlaSignatory[];
};

function isSignatoryList(value: unknown): value is SlaSignatory[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (entry) =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as SlaSignatory).name === "string" &&
        typeof (entry as SlaSignatory).title === "string",
    )
  );
}

export function isSlaDetails(value: unknown): value is SlaDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as Record<string, unknown>;

  return (
    typeof details.clientName === "string" &&
    typeof details.clientAddress === "string" &&
    typeof details.agreementDate === "string" &&
    Array.isArray(details.selectedFeatures) &&
    details.selectedFeatures.every((feature) => typeof feature === "string") &&
    typeof details.employeeCount === "number" &&
    Number.isFinite(details.employeeCount) &&
    details.employeeCount > 0 &&
    typeof details.monthlyFee === "number" &&
    Number.isFinite(details.monthlyFee) &&
    details.monthlyFee > 0 &&
    typeof details.oneTimeFee === "number" &&
    Number.isFinite(details.oneTimeFee) &&
    details.oneTimeFee >= 0 &&
    typeof details.vatPercent === "number" &&
    Number.isFinite(details.vatPercent) &&
    details.vatPercent >= 0 &&
    typeof details.includeEmployeeTracking === "boolean" &&
    (!details.includeEmployeeTracking ||
      (typeof details.trackingFeePerEmployee === "number" &&
        Number.isFinite(details.trackingFeePerEmployee) &&
        details.trackingFeePerEmployee > 0)) &&
    isSignatoryList(details.clientSignatories) &&
    isSignatoryList(details.shomvobSignatories)
  );
}

/**
 * Signatories used to be six flat fields (client CEO, client HR head, Shomvob
 * POC) with Hasib Rahman hardcoded into the document. Anything saved by that
 * version is reshaped here so an in-progress draft survives the update.
 */
function migrateLegacySignatories(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  if ("clientSignatories" in raw || "shomvobSignatories" in raw) return raw;

  const text = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";
  const pair = (name: unknown, title: unknown): SlaSignatory[] => {
    const entry = { name: text(name), title: text(title) };
    return entry.name || entry.title ? [entry] : [];
  };

  return {
    ...raw,
    clientSignatories: [
      ...pair(raw.clientCeoName, raw.clientCeoTitle),
      ...pair(raw.clientHrHeadName, raw.clientHrHeadTitle),
    ],
    shomvobSignatories: [
      DEFAULT_SHOMVOB_SIGNATORY,
      ...pair(raw.shomvobPocName, raw.shomvobPocTitle),
    ],
  };
}

export function saveSlaDetails(details: SlaDetails): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SLA_DETAILS_KEY, JSON.stringify(details));
}

export function loadSlaDetails(): SlaDetails | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SLA_DETAILS_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const migrated = migrateLegacySignatories(parsed as Record<string, unknown>);
    return isSlaDetails(migrated) ? migrated : null;
  } catch {
    return null;
  }
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\.+$/g, "");

  return sanitized || "Client";
}

export function buildSuggestedSlaPdfFileName(clientName: string): string {
  return `Shomvob-HR-${sanitizeFileName(clientName)}-SLA.pdf`;
}
