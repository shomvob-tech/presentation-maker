export type ClientEmailTemplateInput = {
  clientName: string;
  clientEmail: string;
};

function sanitizeFileName(name: string): string {
  const sanitized = name
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return sanitized.slice(0, 60) || "Client";
}

export function buildSuggestedPdfFileName(clientName: string): string {
  return `Shomvob-HR-${sanitizeFileName(clientName)}-Presentation.pdf`;
}

export function buildClientEmailSubject(clientName: string): string {
  return `Following up on our conversation — Shomvob HR & ${clientName.trim()}`;
}

export function buildClientEmailBody(input: ClientEmailTemplateInput): string {
  const clientName = input.clientName.trim();

  return [
    `Dear ${clientName} team,`,
    "",
    "Thank you for taking the time to speak with us. We valued the conversation and wanted to follow up with a short summary you can keep for your records.",
    "",
    "We have prepared a tailored overview reflecting this discussion and attached it here for your reference.",
    "",
    "If you would like to pick up the conversation when it suits you, simply reply to this email.",
    "",
    "Warm regards,",
    "The Shomvob HR Team",
  ].join("\n");
}

export function buildClientMailtoUrl(input: ClientEmailTemplateInput): string {
  const recipient = input.clientEmail.trim();
  const subject = encodeURIComponent(buildClientEmailSubject(input.clientName));
  const body = encodeURIComponent(buildClientEmailBody(input));

  // encodeURIComponent uses %20 for spaces. URLSearchParams uses +, which
  // many mail clients show literally instead of as spaces.
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}
