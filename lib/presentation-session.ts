import type { ClientDetailsInput, ModuleRecommendationResult } from "./module-recommendation";

export const PRESENTATION_SESSION_KEY = "presentation-wizard-session";
export const PREVIEW_LOGO_KEY = "presentation-preview-logo";
export const PREVIEW_CLIENT_NAME_KEY = "presentation-preview-client-name";
export const PROPOSAL_DETAILS_KEY = "presentation-proposal-details";
export const DEFAULT_CLIENT_NAME = "300 Ltd";

/** Cover, letter, and commercial fields that aren't part of module matching. */
export type ProposalDetails = {
  documentTitle: string;
  preparedDate: string;
  recipientTitle: string;
  employeeCount: number;
  mrcFee: number;
  rolloutCharge: number;
  fieldTrackingFee?: number;
  /** Letter "To," name — defaults to client name when omitted at save time. */
  letterAddresseeName?: string;
  /** Meeting date referenced in the COO letter body (YYYY-MM-DD). */
  meetingDateReference?: string;
  /** Days the proposal remains valid; defaults to 30. */
  validityDays?: number;
  contactName?: string;
  contactTeam?: string;
  contactEmail?: string;
  contactPhone?: string;
};

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

export function savePreviewClientName(clientName: string | undefined) {
  if (typeof window === "undefined") return;

  if (clientName?.trim()) {
    localStorage.setItem(PREVIEW_CLIENT_NAME_KEY, clientName.trim());
  } else {
    localStorage.removeItem(PREVIEW_CLIENT_NAME_KEY);
  }
}

export function saveProposalDetails(details: ProposalDetails) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROPOSAL_DETAILS_KEY, JSON.stringify(details));
}

export function loadProposalDetails(): ProposalDetails | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(PROPOSAL_DETAILS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ProposalDetails;
  } catch {
    return null;
  }
}

/** Read counterpart for proposal-builder callers (same as loadProposalDetails). */
export function getProposalDetails(): ProposalDetails | null {
  return loadProposalDetails();
}

/**
 * Merges `partial` into the currently stored proposal details and saves.
 * Intended for a future /validate step to edit fields without a full form resubmit.
 */
export function updateProposalDetails(partial: Partial<ProposalDetails>) {
  if (typeof window === "undefined") return;

  const current = loadProposalDetails() ?? ({} as ProposalDetails);
  saveProposalDetails({ ...current, ...partial });
}

// TODO: getProposalRenderData() — merge clientDetails + recommendation +
// proposalDetails into one object shaped for page-by-page proposal rendering
// once those components exist.

export function loadClientName(): string {
  if (typeof window === "undefined") return DEFAULT_CLIENT_NAME;

  const rawSession = sessionStorage.getItem(PRESENTATION_SESSION_KEY);
  if (rawSession) {
    try {
      const session = JSON.parse(rawSession) as PresentationWizardSession;
      const name = session.clientDetails?.clientName?.trim();
      if (name) return name;
    } catch {
      // Fall through to preview name or default.
    }
  }

  const previewName = localStorage.getItem(PREVIEW_CLIENT_NAME_KEY)?.trim();
  if (previewName) return previewName;

  return DEFAULT_CLIENT_NAME;
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
