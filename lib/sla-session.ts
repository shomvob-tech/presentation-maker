export const SLA_DETAILS_KEY = "shomvob-sla-details";

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
  clientCeoName: string;
  clientCeoTitle: string;
  clientHrHeadName: string;
  clientHrHeadTitle: string;
  shomvobPocName: string;
  shomvobPocTitle: string;
};

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
    typeof details.clientCeoName === "string" &&
    typeof details.clientCeoTitle === "string" &&
    typeof details.clientHrHeadName === "string" &&
    typeof details.clientHrHeadTitle === "string" &&
    typeof details.shomvobPocName === "string" &&
    typeof details.shomvobPocTitle === "string"
  );
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
    return isSlaDetails(parsed) ? parsed : null;
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
