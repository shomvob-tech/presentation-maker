/** Default trial invite password — pre-filled in the form, editable per proposal. */
export const TRIAL_ACCOUNT_PASSWORD = "demo@1234";

export type ClientEmailTemplateInput = {
  clientName: string;
  clientEmail: string;
  /**
   * Explicit template switch from the proposal-builder form.
   * `true`  → trial-account invite (requires the trial fields below).
   * `false` → proposal-only follow-up (niceties, no credentials).
   * omitted → inferred from whether the trial fields are filled, so older
   *           callers (e.g. ValidateOptionsForm) keep their current behaviour.
   */
  includeTrialAccountDetails?: boolean;
  /** When set with the other trial fields, builds the trial-account invite. */
  trialPortalUrl?: string;
  trialUsername?: string;
  trialPassword?: string;
  /** "YYYY-MM-DD" from <input type="date"> — reformatted in the body. */
  trialStartDate?: string;
  trialEndDate?: string;
  senderName?: string;
  senderTitle?: string;
  senderPhone?: string;
  senderEmail?: string;
};

function sanitizeFileName(name: string): string {
  const sanitized = name
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return sanitized.slice(0, 60) || "Client";
}

/** "YYYY-MM-DD" → "DD-MM-YYYY" for the trial-period line. */
function formatTrialDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}-${month}-${year}`;
}

function trialFieldsAreFilled(input: ClientEmailTemplateInput): boolean {
  return Boolean(
    input.trialPortalUrl?.trim() &&
      input.trialUsername?.trim() &&
      input.trialStartDate &&
      input.trialEndDate,
  );
}

function isTrialInvite(input: ClientEmailTemplateInput): boolean {
  if (input.includeTrialAccountDetails === false) return false;
  if (input.includeTrialAccountDetails === true) return true;
  return trialFieldsAreFilled(input);
}

function isProposalOnly(input: ClientEmailTemplateInput): boolean {
  return input.includeTrialAccountDetails === false;
}

const DEFAULT_SENDER_NAME = "Shomvob Technologies Ltd.";
const DEFAULT_SENDER_PHONE = "09638-885588";

type ResolvedSender = {
  senderName: string;
  senderTitle: string;
  senderPhone: string;
  senderEmail: string;
  isCompanyDefault: boolean;
};

function resolveSender(input: ClientEmailTemplateInput): ResolvedSender {
  const senderName = input.senderName?.trim() ?? "";
  const senderTitle = input.senderTitle?.trim() ?? "";
  const senderPhone = input.senderPhone?.trim() ?? "";
  const senderEmail = input.senderEmail?.trim() ?? "";

  if (!senderName && !senderTitle && !senderPhone && !senderEmail) {
    return {
      senderName: DEFAULT_SENDER_NAME,
      senderTitle: "",
      senderPhone: DEFAULT_SENDER_PHONE,
      senderEmail: "",
      isCompanyDefault: true,
    };
  }

  return {
    senderName,
    senderTitle,
    senderPhone,
    senderEmail,
    isCompanyDefault: false,
  };
}

function formatSenderSignOffPlain(sender: ResolvedSender): string[] {
  if (sender.isCompanyDefault) {
    return [sender.senderName, sender.senderPhone];
  }

  const lines = [
    sender.senderName,
    sender.senderTitle,
    "Shomvob Technologies Limited",
  ].filter(Boolean);

  if (sender.senderPhone) lines.push(`📞 ${sender.senderPhone}`);
  if (sender.senderEmail) lines.push(`📧 ${sender.senderEmail}`);
  return lines;
}

function formatSenderSignOffHtml(sender: ResolvedSender): string {
  if (sender.isCompanyDefault) {
    return `<p style="margin:0;"><strong>${escapeHtml(sender.senderName)}</strong><br>${escapeHtml(sender.senderPhone)}</p>`;
  }

  const lines: string[] = [];
  if (sender.senderName) lines.push(`<strong>${escapeHtml(sender.senderName)}</strong>`);
  if (sender.senderTitle) lines.push(escapeHtml(sender.senderTitle));
  lines.push("Shomvob Technologies Limited");
  if (sender.senderPhone) lines.push(`📞 ${escapeHtml(sender.senderPhone)}`);
  if (sender.senderEmail) {
    lines.push(
      `📧 <a href="mailto:${escapeHtml(sender.senderEmail)}">${escapeHtml(sender.senderEmail)}</a>`,
    );
  }
  return `<p style="margin:0;">${lines.join("<br>")}</p>`;
}

/** Shared so the plain-text and HTML builders can't drift apart on values. */
function resolveTrialFields(input: ClientEmailTemplateInput) {
  return {
    portalUrl: input.trialPortalUrl!.trim(),
    username: input.trialUsername!.trim(),
    password: input.trialPassword?.trim() || TRIAL_ACCOUNT_PASSWORD,
    start: formatTrialDate(input.trialStartDate!),
    end: formatTrialDate(input.trialEndDate!),
    ...resolveSender(input),
  };
}

export function buildSuggestedPdfFileName(clientName: string): string {
  return `Shomvob-HR-${sanitizeFileName(clientName)}-Presentation.pdf`;
}

export function buildSuggestedProposalPdfFileName(clientName: string): string {
  return `Shomvob-HR-${sanitizeFileName(clientName)}-Proposal.pdf`;
}

export function buildClientEmailSubject(input: ClientEmailTemplateInput | string): string {
  if (typeof input === "string") {
    return `Following up on our conversation — Shomvob HR & ${input.trim()}`;
  }

  const clientName = input.clientName.trim();

  if (isTrialInvite(input)) {
    return `Your Shomvob HR Trial Account is Ready — ${clientName}`;
  }

  if (isProposalOnly(input)) {
    return `Shomvob HR Proposal for ${clientName}`;
  }

  return `Following up on our conversation — Shomvob HR & ${clientName}`;
}

/**
 * Plain-text body — this is what actually goes into a `mailto:` link. Mail
 * clients render mailto bodies as plain text, full stop: no bold, no real
 * bullet list, no link color, regardless of what characters are in the
 * string. The "•" bullets and blank-line spacing below are the ceiling of
 * what's achievable here — for the fully-formatted look, see
 * buildClientEmailHtml + the clipboard-copy flow instead.
 */
export function buildClientEmailBody(input: ClientEmailTemplateInput): string {
  const clientName = input.clientName.trim();

  if (isTrialInvite(input)) {
    const { portalUrl, username, password, start, end, ...sender } =
      resolveTrialFields(input);

    return [
      "Dear Concern,",
      "",
      "Greetings!",
      "",
      "We are pleased to inform you that your Trial Account has been successfully created and is now ready to use.",
      "",
      "Please find your trial account details below:",
      "",
      `• Portal: ${portalUrl}`,
      `• Username: ${username}`,
      `• Password: ${password}`,
      `• Trial Period: [${start}] to [${end}]`,
      "",
      "During the trial period, you will have the opportunity to explore the system's features and evaluate how it can support your daily operations. Our team will be available to assist you with account setup, training, and any questions you may have throughout the trial.",
      "",
      "If you require any assistance or would like to schedule a walkthrough session, please feel free to contact us.",
      "",
      `We appreciate the opportunity to work with ${clientName} and look forward to your valuable feedback.`,
      "",
      "Best regards,",
      ...formatSenderSignOffPlain(sender),
    ].join("\n");
  }

  if (isProposalOnly(input)) {
    const sender = resolveSender(input);

    return [
      "Dear Concern,",
      "",
      "Greetings!",
      "",
      `Thank you for the opportunity to present Shomvob HR to ${clientName}. As discussed, we have prepared a proposal for your review.`,
      "",
      "Please find the proposal attached. Kindly go through the document at your convenience. Should you wish to proceed, we would be glad to set up a trial account so your team can evaluate the system first-hand.",
      "",
      "If you have any questions or would like a walkthrough of the proposal, please feel free to contact us.",
      "",
      `We look forward to your feedback and the opportunity to work with ${clientName}.`,
      "",
      "Best regards,",
      ...formatSenderSignOffPlain(sender),
    ].join("\n");
  }

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

/**
 * HTML body — matches the reference screenshot (bold field labels, a real
 * bulleted list, a clickable portal link). This is NOT usable in a
 * `mailto:` link; it's meant for the clipboard-copy flow (see
 * buildClientEmailClipboardPayload), where pasting into Gmail/Outlook's
 * rich-text compose window preserves the formatting.
 */
export function buildClientEmailHtml(input: ClientEmailTemplateInput): string {
  const clientName = escapeHtml(input.clientName.trim());

  if (isTrialInvite(input)) {
    const { portalUrl, username, password, start, end, ...sender } =
      resolveTrialFields(input);

    return [
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5;">',
      "<p>Dear Concern,</p>",
      "<p>Greetings!</p>",
      `<p>We are pleased to inform you that your <strong>Trial Account</strong> has been successfully created and is now ready to use.</p>`,
      "<p>Please find your trial account details below:</p>",
      '<ul style="padding-left:20px;margin:0 0 16px;">',
      `<li><strong>Portal:</strong> <a href="${escapeHtml(portalUrl)}">${escapeHtml(portalUrl)}</a></li>`,
      `<li><strong>Username:</strong> ${escapeHtml(username)}</li>`,
      `<li><strong>Password:</strong> ${escapeHtml(password)}</li>`,
      `<li><strong>Trial Period:</strong> [${start}] to [${end}]</li>`,
      "</ul>",
      `<p>During the trial period, you will have the opportunity to explore the system's features and evaluate how it can support your daily operations. Our team will be available to assist you with account setup, training, and any questions you may have throughout the trial.</p>`,
      "<p>If you require any assistance or would like to schedule a walkthrough session, please feel free to contact us.</p>",
      `<p>We appreciate the opportunity to work with ${clientName} and look forward to your valuable feedback.</p>`,
      "<p>Best regards,</p>",
      formatSenderSignOffHtml(sender),
      "</div>",
    ].join("");
  }

  if (isProposalOnly(input)) {
    const sender = resolveSender(input);

    return [
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5;">',
      "<p>Dear Concern,</p>",
      "<p>Greetings!</p>",
      `<p>Thank you for the opportunity to present Shomvob HR to ${clientName}. As discussed, we have prepared a proposal for your review.</p>`,
      "<p>Please find the proposal attached. Kindly go through the document at your convenience. Should you wish to proceed, we would be glad to set up a trial account so your team can evaluate the system first-hand.</p>",
      "<p>If you have any questions or would like a walkthrough of the proposal, please feel free to contact us.</p>",
      `<p>We look forward to your feedback and the opportunity to work with ${clientName}.</p>`,
      "<p>Best regards,</p>",
      formatSenderSignOffHtml(sender),
      "</div>",
    ].join("");
  }

  return [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1a1a;line-height:1.5;">',
    `<p>Dear ${clientName} team,</p>`,
    "<p>Thank you for taking the time to speak with us. We valued the conversation and wanted to follow up with a short summary you can keep for your records.</p>",
    "<p>We have prepared a tailored overview reflecting this discussion and attached it here for your reference.</p>",
    "<p>If you would like to pick up the conversation when it suits you, simply reply to this email.</p>",
    "<p>Warm regards,<br>The Shomvob HR Team</p>",
    "</div>",
  ].join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildClientMailtoUrl(input: ClientEmailTemplateInput): string {
  const recipient = input.clientEmail.trim();
  const subject = encodeURIComponent(buildClientEmailSubject(input));
  const body = encodeURIComponent(buildClientEmailBody(input));

  // encodeURIComponent uses %20 for spaces. URLSearchParams uses +, which
  // many mail clients show literally instead of as spaces.
  return `mailto:${recipient}?subject=${subject}&body=${body}`;
}

/**
 * Writes both an HTML and a plain-text representation of the email to the
 * clipboard in one call, so pasting into a rich-text compose window (Gmail,
 * Outlook web, etc.) shows the formatted version, while pasting into a
 * plain-text field falls back gracefully to the text version.
 *
 * Requires the Clipboard API's ClipboardItem (modern Chrome/Edge; partial
 * Firefox/Safari support) and a secure context (https or localhost). Throws
 * if unsupported — callers should catch and fall back to
 * navigator.clipboard.writeText(buildClientEmailBody(input)) instead.
 */
export async function copyClientEmailToClipboard(
  input: ClientEmailTemplateInput,
): Promise<void> {
  const html = buildClientEmailHtml(input);
  const text = buildClientEmailBody(input);

  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Rich clipboard copy isn't supported in this browser.");
  }

  const item = new ClipboardItem({
    "text/html": new Blob([html], { type: "text/html" }),
    "text/plain": new Blob([text], { type: "text/plain" }),
  });

  await navigator.clipboard.write([item]);
}