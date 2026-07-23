import type { PresentationContent } from "./presentation-content";

export const PRESENTATION_CONTENT_SESSION_KEY =
  "presentation-wizard-content";
export const PREVIEW_CONTENT_KEY = "presentation-preview-content";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSlidePointSlot(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    typeof value.description === "string"
  );
}

function isModuleSlideContent(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (typeof value.moduleId !== "string") return false;
  if (typeof value.slotCount !== "number") return false;
  if (!Array.isArray(value.points)) return false;
  return value.points.every(isSlidePointSlot);
}

/** Runtime guard for JSON loaded from storage or PDF injection. */
export function isPresentationContent(
  value: unknown,
): value is PresentationContent {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.selectedModuleIds)) return false;
  if (typeof value.requirements !== "string") return false;
  if (typeof value.notes !== "string") return false;
  if (!isRecord(value.modules)) return false;

  return Object.values(value.modules).every(isModuleSlideContent);
}

export function parsePresentationContent(
  raw: string | null | undefined,
): PresentationContent | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isPresentationContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePresentationContent(content: PresentationContent) {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(content);
  sessionStorage.setItem(PRESENTATION_CONTENT_SESSION_KEY, serialized);
  localStorage.setItem(PREVIEW_CONTENT_KEY, serialized);
}

export function savePreviewPresentationContent(content: PresentationContent) {
  savePresentationContent(content);
}

export function clearPreviewPresentationContent() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(PRESENTATION_CONTENT_SESSION_KEY);
  localStorage.removeItem(PREVIEW_CONTENT_KEY);
}

export function loadPresentationContentFromSession(): PresentationContent | null {
  if (typeof window === "undefined") return null;
  return parsePresentationContent(
    sessionStorage.getItem(PRESENTATION_CONTENT_SESSION_KEY),
  );
}

export function loadPreviewPresentationContent(): PresentationContent | null {
  if (typeof window === "undefined") return null;
  return parsePresentationContent(localStorage.getItem(PREVIEW_CONTENT_KEY));
}

/** Prefer wizard session storage, then cross-tab preview storage. */
export function loadPresentationContent(): PresentationContent | null {
  return (
    loadPresentationContentFromSession() ?? loadPreviewPresentationContent()
  );
}
