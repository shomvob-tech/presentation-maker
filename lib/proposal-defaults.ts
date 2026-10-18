/**
 * Defaults for the HRIS proposal, shared by the builder form
 * (app/components/Clientdetails2.tsx) and the HRIS API
 * (lib/hris/proposal-input.ts). Both fill in exactly these when a field is
 * left blank, so a proposal made either way renders the same.
 */

/** Mirrors the default set in CoverPage.tsx — keep these in sync. */
export const DEFAULT_DOCUMENT_TITLE = "Workforce Management Ecosystem";
export const DEFAULT_RECIPIENT_TITLE = "Managing Director";

/** Preselected by default for every new proposal — the four modules most
 * proposals end up including anyway. Reps can untick any of them. */
export const DEFAULT_SELECTED_MODULE_IDS = ["attendance", "leave", "payroll", "roster"];

/** Days the proposal remains valid when nothing else is given. */
export const DEFAULT_VALIDITY_DAYS = 30;
