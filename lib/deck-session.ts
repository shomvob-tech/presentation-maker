/**
 * Storage and shape for the presentation deck — the 16:9 pitch deck, beside
 * the A4 documents (HRIS proposal, SLA, device and combined proposals).
 *
 * Named "deck" rather than "presentation" because lib/presentation-session.ts
 * already exists: it belongs to the parked first wizard and still carries the
 * HRIS proposal's keys, so it cannot be reused here.
 *
 * The client logo lives under its own key, for the reason given in
 * device-session.ts: the builder sends the details to the usage log as
 * `payload_json`, and an inlined data URL would push the row past the 32k body
 * limit on /api/track.
 */

import { DECK_MODULE_IDS } from "./deck-catalog";

export const DECK_DETAILS_KEY = "shomvob-deck-details";
export const DECK_LOGO_KEY = "shomvob-deck-logo";

export type PresentationDeckDetails = {
  clientName: string;
  /** Ids from DECK_MODULES, at least one. Order is irrelevant — the catalog
   * decides slide order. */
  moduleIds: string[];
};

export function isPresentationDeckDetails(
  value: unknown,
): value is PresentationDeckDetails {
  if (!value || typeof value !== "object") return false;
  const details = value as Record<string, unknown>;

  return (
    typeof details.clientName === "string" &&
    details.clientName.trim().length > 0 &&
    Array.isArray(details.moduleIds) &&
    details.moduleIds.length > 0 &&
    details.moduleIds.every(
      (id) => typeof id === "string" && DECK_MODULE_IDS.includes(id),
    )
  );
}

export function saveDeckDetails(details: PresentationDeckDetails): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DECK_DETAILS_KEY, JSON.stringify(details));
}

export function loadDeckDetails(): PresentationDeckDetails | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(DECK_DETAILS_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPresentationDeckDetails(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDeckLogo(logoDataUrl: string | undefined): void {
  if (typeof window === "undefined") return;

  if (logoDataUrl) localStorage.setItem(DECK_LOGO_KEY, logoDataUrl);
  else localStorage.removeItem(DECK_LOGO_KEY);
}

export function loadDeckLogo(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(DECK_LOGO_KEY);
}

function sanitizeFileName(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/\.+$/g, "");

  return sanitized || "Client";
}

export function buildSuggestedDeckPdfFileName(clientName: string): string {
  return `Shomvob-HR-${sanitizeFileName(clientName)}-Presentation.pdf`;
}
