import type { ClientDetailsInput, ModuleRecommendationResult } from "./module-recommendation";

export const PRESENTATION_SESSION_KEY = "presentation-wizard-session";
export const PREVIEW_LOGO_KEY = "presentation-preview-logo";

export function savePreviewLogo(logoDataUrl: string | undefined) {
  if (typeof window === "undefined") return;

  if (logoDataUrl) {
    localStorage.setItem(PREVIEW_LOGO_KEY, logoDataUrl);
  } else {
    localStorage.removeItem(PREVIEW_LOGO_KEY);
  }
}

export function loadPreviewLogo(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PREVIEW_LOGO_KEY);
}

export type PresentationWizardSession = {
  clientDetails: ClientDetailsInput;
  recommendation: ModuleRecommendationResult;
  logoDataUrl?: string;
  logoFileName?: string;
};

export function savePresentationSession(session: PresentationWizardSession) {
  sessionStorage.setItem(PRESENTATION_SESSION_KEY, JSON.stringify(session));
}

export function loadPresentationSession(): PresentationWizardSession | null {
  const raw = sessionStorage.getItem(PRESENTATION_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PresentationWizardSession;
  } catch {
    return null;
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read logo file."));
    reader.readAsDataURL(file);
  });
}
