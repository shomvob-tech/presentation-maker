"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { getModuleRecommendation } from "@/app/components/ModuleRecommendation";
import type { ClientDetailsInput } from "@/lib/module-recommendation";
import {
  buildClientMailtoUrl,
  buildSuggestedProposalPdfFileName,
  TRIAL_ACCOUNT_PASSWORD,
} from "@/lib/client-email-template";
import { MODULE_HIGHLIGHTS } from "@/lib/module-highlights";
import Richtexteditor from "@/app/components/Richtexteditor";
import {
  fileToDataUrl,
  loadPreviewLogo,
  loadProposalDetails,
  savePresentationSession,
  savePreviewClientName,
  savePreviewLogo,
  saveProposalDetails,
} from "@/lib/presentation-session";

type FormState = {
  // Existing fields
  clientName: string;
  clientEmail: string;
  // `requirements` no longer has a UI field (removed in favor of Problem
  // statement + Module selection below) but stays in the data model as an
  // always-empty string — ClientDetailsInput / getModuleRecommendation may
  // still depend on this key existing. Safe to delete once confirmed.
  requirements: string;
  notes: string; // same story — see the Problem statement section.

  // Section 1 (Cover) + Section 2 (COO Letter)
  documentTitle: string;
  preparedDate: string; // "YYYY-MM-DD" from <input type="date">
  recipientTitle: string;
  letterAddresseeName: string;
  meetingDateReference: string;
  validityDays: string;

  // Section 3 (Solution Proposal) — one-page format
  problemStatementHeading: string;
  problemStatementText: string; // HTML from Richtexteditor, not plain text
  selectedModules: string[]; // module ids from MODULE_HIGHLIGHTS

  // Section 4 (Commercial Terms)
  employeeCount: string;
  mrcFee: string;
  includeRolloutCharge: boolean;
  rolloutCharge: string;
  includeFieldTracking: boolean;
  fieldTrackingFee: string;

  // Trial account email (Send mail button). Kept separate from the
  // "Proposal contact" fields above — the trial invite is plausibly sent by
  // a different team member than whoever's listed on the proposal PDF.
  trialPortalUrl: string;
  trialUsername: string;
  trialPassword: string;
  trialStartDate: string; // "YYYY-MM-DD" from <input type="date">
  trialEndDate: string;
  trialSenderName: string;
  trialSenderTitle: string;
  trialSenderPhone: string;
  trialSenderEmail: string;
};

type FormErrors = Partial<Record<keyof FormState | "logo" | "selectedModules", string>>;

/** Mirrors the default set in CoverPage.tsx — keep these in sync. */
const DEFAULT_DOCUMENT_TITLE = "Workforce Management Ecosystem";
const DEFAULT_RECIPIENT_TITLE = "Managing Director";

/** Trial accounts are always on the same portal today — override per row if
 * that ever changes (e.g. staging environment for a specific client). */
const DEFAULT_TRIAL_PORTAL_URL = "https://hr.shomvob.com/";

/** Section 3 is a fixed one-page layout. Module count is a ceiling, not an
 * exact quota — a problem statement eats into the page's available space,
 * so the cap drops from 8 to 6 when one is present. Zero modules is allowed
 * (the rep may be filling this in before deciding), but the page looks best
 * with a handful selected — see RECOMMENDED_MIN_MODULE_COUNT below. See
 * module-highlights.ts for the finalized content each checkbox pulls from. */
const MODULE_MAX_WITH_PROBLEM_STATEMENT = 6;
const MODULE_MAX_WITHOUT_PROBLEM_STATEMENT = 8;

/** Soft recommendation only — never blocks submission. Below this, the page
 * still renders correctly (see Moduleoverview.tsx's odd-count handling) but
 * tends to look sparse for a client-facing proposal. */
const RECOMMENDED_MIN_MODULE_COUNT = 4;

/** Preselected by default for every new proposal — the four modules most
 * proposals end up including anyway. Reps can untick any of them. */
const DEFAULT_SELECTED_MODULE_IDS = ["attendance", "leave", "payroll", "roster"];

function todayAsDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

const initialForm: FormState = {
  clientName: "",
  clientEmail: "",
  requirements: "",
  notes: "",

  documentTitle: "",
  preparedDate: todayAsDateInputValue(),
  recipientTitle: "",
  letterAddresseeName: "",
  meetingDateReference: todayAsDateInputValue(),
  validityDays: "30",

  problemStatementHeading: "",
  problemStatementText: "",
  selectedModules: DEFAULT_SELECTED_MODULE_IDS,

  employeeCount: "",
  mrcFee: "",
  includeRolloutCharge: true,
  rolloutCharge: "",
  includeFieldTracking: false,
  fieldTrackingFee: "",

  trialPortalUrl: DEFAULT_TRIAL_PORTAL_URL,
  trialUsername: "",
  trialPassword: TRIAL_ACCOUNT_PASSWORD,
  trialStartDate: todayAsDateInputValue(),
  trialEndDate: "",
  trialSenderName: "",
  trialSenderTitle: "",
  trialSenderPhone: "",
  trialSenderEmail: "",
};

function isPositiveNumber(value: string): boolean {
  if (!value.trim()) return false;
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function isPositiveInteger(value: string): boolean {
  if (!value.trim()) return false;
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

/** Tiptap reports an empty editor as "<p></p>", not "" — strip tags before
 * checking for real content, or an empty editor would count as "has text". */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function hasProblemStatement(form: FormState): boolean {
  return stripHtml(form.problemStatementText).length > 0;
}

function maxModuleCount(form: FormState): number {
  return hasProblemStatement(form)
    ? MODULE_MAX_WITH_PROBLEM_STATEMENT
    : MODULE_MAX_WITHOUT_PROBLEM_STATEMENT;
}

function validateForm(form: FormState, logo: File | null): FormErrors {
  const errors: FormErrors = {};

  if (!form.clientName.trim()) {
    errors.clientName = "Client name is required.";
  }

  if (!form.clientEmail.trim()) {
    errors.clientEmail = "Client email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.clientEmail.trim())) {
    errors.clientEmail = "Enter a valid email address.";
  }

  if (!logo) {
    errors.logo = "Client logo is required for the cover page.";
  } else if (!logo.type.startsWith("image/")) {
    errors.logo = "Logo must be an image file.";
  }

  if (!form.preparedDate) {
    errors.preparedDate = "Proposal date is required.";
  }

  if (form.validityDays.trim() && !isPositiveInteger(form.validityDays)) {
    errors.validityDays = "Enter a positive whole number of days.";
  }

  if (!isPositiveNumber(form.employeeCount)) {
    errors.employeeCount = "Enter the number of employees.";
  }

  if (!isPositiveNumber(form.mrcFee)) {
    errors.mrcFee = "Enter the monthly subscription fee (BDT).";
  }

  if (form.includeRolloutCharge && !isPositiveNumber(form.rolloutCharge)) {
    errors.rolloutCharge = "Enter the software rollout charge (BDT).";
  }

  if (form.includeFieldTracking && !isPositiveNumber(form.fieldTrackingFee)) {
    errors.fieldTrackingFee = "Enter a per-user fee, or turn this off.";
  }

  // Cross-validation: module count is a ceiling, not an exact quota. Zero is
  // allowed — the page still renders correctly with none selected — this
  // only blocks going over the cap the one-page layout can fit.
  const max = maxModuleCount(form);
  const selectedCount = form.selectedModules.length;
  if (selectedCount > max) {
    errors.selectedModules = hasProblemStatement(form)
      ? `A problem statement takes up space on the page, so the cap drops to ${max} modules — you have ${selectedCount} selected. Remove ${selectedCount - max}, or clear the problem statement.`
      : `Select up to ${max} modules — you have ${selectedCount} selected.`;
  }

  return errors;
}

/** Section ids (see the `id` prop on each SectionCard below) mapped to the
 * error keys that belong to them, in on-page order. Used to find and scroll
 * to the first section with a problem after a blocked submit. */
const SECTION_ERROR_MAP: { id: string; keys: (keyof FormErrors)[] }[] = [
  { id: "section-client-info", keys: ["clientName", "clientEmail", "logo"] },
  { id: "section-module-selection", keys: ["selectedModules"] },
  { id: "section-cover-letter", keys: ["preparedDate", "validityDays"] },
  {
    id: "section-commercial-terms",
    keys: ["employeeCount", "mrcFee", "rolloutCharge", "fieldTrackingFee"],
  },
  {
    id: "section-email-details",
    keys: ["trialPortalUrl", "trialUsername", "trialStartDate", "trialEndDate"],
  },
];

function sectionHasError(errors: FormErrors, keys: (keyof FormErrors)[]): boolean {
  return keys.some((key) => Boolean(errors[key]));
}

/** Smooth-scrolls to the first section (in on-page order) that has an error,
 * so a rep submitting a long form lands on the problem instead of having to
 * hunt for it. Takes the freshly computed error object directly rather than
 * reading state, since setState hasn't flushed yet when this runs. */
function scrollToFirstErrorSection(errors: FormErrors) {
  const firstErrored = SECTION_ERROR_MAP.find((section) =>
    sectionHasError(errors, section.keys),
  );
  if (!firstErrored) return;

  document
    .getElementById(firstErrored.id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Separate from validateForm — these only matter for the "Send mail"
 * action, not for building/downloading the proposal PDF. A proposal can
 * exist without a trial account being ready yet, so the main form doesn't
 * block on these. */
function validateTrialEmailFields(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.trialPortalUrl.trim()) {
    errors.trialPortalUrl = "Portal URL is required.";
  }

  if (!form.trialUsername.trim()) {
    errors.trialUsername = "Trial username is required.";
  }

  if (!form.trialStartDate) {
    errors.trialStartDate = "Trial start date is required.";
  }

  if (!form.trialEndDate) {
    errors.trialEndDate = "Trial end date is required.";
  } else if (
    form.trialStartDate &&
    new Date(form.trialEndDate) < new Date(form.trialStartDate)
  ) {
    errors.trialEndDate = "Trial end date can't be before the start date.";
  }

  return errors;
}

/* ------------------------------------------------------------------ */
/* Dark theme primitives, matching design_template.html                */
/* ------------------------------------------------------------------ */

const FONT_HEADING = "font-['Inter_Tight',sans-serif]";
const FONT_BODY = "font-['IBM_Plex_Sans',system-ui,sans-serif]";

const inputClassName = `w-full rounded-[10px] border-0 bg-white/[0.045] px-3.5 py-3 text-[14.5px] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] outline-none transition placeholder:text-white/45 hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] focus:bg-white/[0.075] focus:shadow-[inset_0_0_0_1px_rgba(61,220,127,0.65),0_0_0_3px_rgba(40,161,67,0.22)] ${FONT_BODY}`;

const labelClassName = "block text-[13px] font-semibold tracking-[0.01em] text-white/90";

const hintClassName = "mt-1 text-xs leading-[1.5] text-white/60";

const errorClassName = "mt-1 text-xs font-medium text-[#ff9b9b]";

/**
 * Numbered section shell — dark card with an inset ring and a soft green
 * hairline glow across the top edge, matching design_template.html exactly.
 * Rendered inside the dark panel wrapper in the main component below.
 *
 * `hasError` swaps the whole header (top hairline, number chip, title) into
 * a red "needs attention" state with a looping ping ring on the number chip
 * — used when this section contains a field that failed validation. `id`
 * lets the submit handlers scroll a specific card into view.
 */
function SectionCard({
  index,
  title,
  description,
  children,
  id,
  hasError = false,
}: {
  index: number;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  hasError?: boolean;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden rounded-[14px] bg-white/[0.035] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.075)] transition-shadow duration-300 sm:p-6 ${
        hasError ? "shadow-[inset_0_0_0_1.5px_rgba(255,107,107,0.6)]" : ""
      }`}
    >
      <div
        className={`absolute inset-x-6 top-0 h-px ${
          hasError
            ? "animate-pulse-subtle bg-gradient-to-r from-[#ff6b6b]/85 via-[#ff6b6b]/40 to-transparent"
            : "bg-gradient-to-r from-[#3ddc7f]/55 to-transparent"
        }`}
      />
      <header className="flex items-start gap-3.5">
        <span className="relative shrink-0">
          {hasError ? (
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-1 rounded-[11px] border-2 border-[#ff6b6b]/70 animate-ping"
            />
          ) : null}
          <span
            className={`relative flex h-[30px] w-[30px] items-center justify-center rounded-[9px] text-sm font-bold ${FONT_HEADING} ${
              hasError
                ? "bg-[#ff6b6b]/20 text-[#ffb3b3] shadow-[inset_0_0_0_1px_rgba(255,107,107,0.55)]"
                : "bg-[#28a143]/16 text-[#5ee08c] shadow-[inset_0_0_0_1px_rgba(61,220,127,0.35)]"
            }`}
          >
            {index}
          </span>
        </span>
        <div className="min-w-0 pt-0.5">
          <h3
            className={`flex flex-wrap items-center gap-2 text-[19px] font-semibold tracking-[-0.01em] ${FONT_HEADING} ${
              hasError ? "text-[#ffb3b3]" : "text-white"
            }`}
          >
            {title}
            {hasError ? (
              <span className="inline-flex items-center rounded-full bg-[#ff6b6b]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ffb3b3] shadow-[inset_0_0_0_1px_rgba(255,107,107,0.45)]">
                Needs attention
              </span>
            ) : null}
          </h3>
          {description ? (
            <p className="mt-1.5 max-w-[70ch] text-[13px] leading-[1.55] text-white/50">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="mt-[22px]">{children}</div>
    </section>
  );
}

/**
 * Field label with a looping "ping" dot when its field has failed
 * validation — pairs with the red error text already shown under each
 * field, so the label itself (not just the message below it) signals which
 * input is incomplete.
 */
function FieldLabel({
  htmlFor,
  hasError,
  children,
}: {
  htmlFor: string;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`flex items-center gap-1.5 text-[13px] font-semibold tracking-[0.01em] transition-colors ${
        hasError ? "text-[#ff9b9b]" : "text-white/90"
      }`}
    >
      {children}
      {hasError ? (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b6b] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6b6b]" />
        </span>
      ) : null}
    </label>
  );
}

/**
 * Accessible custom checkbox — the real <input> stays functional and
 * keyboard-focusable (visually hidden via sr-only), a sibling span renders
 * the checkmark chip look from the mockup, which a native checkbox can't
 * be restyled into directly.
 */
function CheckChip({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] text-[11px] font-extrabold transition ${
        checked
          ? "bg-[#28a143] text-[#04170c]"
          : "bg-white/[0.06] text-transparent shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]"
      }`}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

export default function Clientdetails2() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function toggleModule(id: string) {
    setForm((current) => {
      const isSelected = current.selectedModules.includes(id);
      const selectedModules = isSelected
        ? current.selectedModules.filter((m) => m !== id)
        : [...current.selectedModules, id];
      return { ...current, selectedModules };
    });
    setErrors((current) => ({ ...current, selectedModules: undefined }));
  }

  function handleLogoChange(file: File | null) {
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogo(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
    setErrors((current) => ({ ...current, logo: undefined }));
  }

  function clearLogo() {
    handleLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function persistProposalSession(): Promise<ClientDetailsInput> {
    const clientDetails: ClientDetailsInput = {
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim(),
      requirements: form.requirements.trim(),
      notes: form.notes.trim(),
    };

    const recommendation = getModuleRecommendation(clientDetails);
    const logoDataUrl = logo ? await fileToDataUrl(logo) : undefined;

    savePresentationSession({
      clientDetails,
      recommendation,
      logoDataUrl,
      logoFileName: logo?.name,
    });
    savePreviewLogo(logoDataUrl);
    savePreviewClientName(clientDetails.clientName);

    const problemStatementPresent = hasProblemStatement(form);

    saveProposalDetails({
      documentTitle: form.documentTitle.trim() || DEFAULT_DOCUMENT_TITLE,
      preparedDate: form.preparedDate,
      recipientTitle: form.recipientTitle.trim() || DEFAULT_RECIPIENT_TITLE,
      employeeCount: Number(form.employeeCount),
      mrcFee: Number(form.mrcFee),
      rolloutCharge: form.includeRolloutCharge
        ? Number(form.rolloutCharge)
        : undefined,
      fieldTrackingFee: form.includeFieldTracking
        ? Number(form.fieldTrackingFee)
        : undefined,
      letterAddresseeName:
        form.letterAddresseeName.trim() || form.clientName.trim(),
      meetingDateReference: form.meetingDateReference,
      validityDays: form.validityDays.trim()
        ? Number(form.validityDays)
        : 30,

      problemStatementHeading: problemStatementPresent
        ? form.problemStatementHeading.trim() || undefined
        : undefined,
      problemStatementText: problemStatementPresent
        ? form.problemStatementText
        : undefined,
      selectedModules: form.selectedModules,
    });

    return clientDetails;
  }

  async function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form, logo);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      scrollToFirstErrorSection(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await persistProposalSession();
      window.open("/proposal-preview", "_blank", "noopener,noreferrer");
    } catch {
      setErrors({ logo: "Could not prepare client details. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSendMail() {
    const clientName = form.clientName.trim();
    const clientEmail = form.clientEmail.trim();
    const nextErrors: FormErrors = {};

    if (!clientName) {
      nextErrors.clientName = "Client name is required.";
    }

    if (!clientEmail) {
      nextErrors.clientEmail = "Client email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      nextErrors.clientEmail = "Enter a valid email address.";
    }

    Object.assign(nextErrors, validateTrialEmailFields(form));

    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({ ...current, ...nextErrors }));
      scrollToFirstErrorSection(nextErrors);
      return;
    }

    // Dates are passed as raw "YYYY-MM-DD"; reformatted to DD-MM-YYYY inside
    // the template. Password is always TRIAL_ACCOUNT_PASSWORD (demo@1234).
    window.location.href = buildClientMailtoUrl({
      clientName,
      clientEmail,
      trialPortalUrl: form.trialPortalUrl.trim(),
      trialUsername: form.trialUsername.trim(),
      trialStartDate: form.trialStartDate,
      trialEndDate: form.trialEndDate,
      senderName: form.trialSenderName.trim(),
      senderTitle: form.trialSenderTitle.trim(),
      senderPhone: form.trialSenderPhone.trim(),
      senderEmail: form.trialSenderEmail.trim(),
    });
  }

  /**
   * Uses the last saved proposal inputs (from Preview Proposal) and asks
   * /api/export-pdf to render /proposal-preview via Playwright — same capture
   * approach as scripts/export-pdf.mjs.
   */
  async function handleDownloadPdf() {
    const logoDataUrl = loadPreviewLogo();
    const details = loadProposalDetails();
    const clientName =
      form.clientName.trim() || details?.letterAddresseeName || "Client";

    if (!logoDataUrl || !details) {
      setPdfError(
        'No saved proposal found. Click "Preview Proposal" first, then download the PDF.',
      );
      return;
    }

    setIsDownloadingPdf(true);
    setPdfError(null);

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${window.location.origin}/proposal-preview`,
          logoDataUrl,
          clientName,
          proposalDetails: details,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.error ?? `Request failed with status ${response.status}`,
        );
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = buildSuggestedProposalPdfFileName(clientName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setPdfError(
        error instanceof Error ? error.message : "Failed to generate PDF.",
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const problemStatementActive = hasProblemStatement(form);
  const maxCount = maxModuleCount(form);
  const selectedCount = form.selectedModules.length;
  const exceedsMax = selectedCount > maxCount;
  const belowRecommended = selectedCount < RECOMMENDED_MIN_MODULE_COUNT;

  const clientInfoHasError = sectionHasError(errors, ["clientName", "clientEmail", "logo"]);
  const moduleSelectionHasError = sectionHasError(errors, ["selectedModules"]);
  const coverLetterHasError = sectionHasError(errors, ["preparedDate", "validityDays"]);
  const commercialTermsHasError = sectionHasError(errors, [
    "employeeCount",
    "mrcFee",
    "rolloutCharge",
    "fieldTrackingFee",
  ]);
  const emailDetailsHasError = sectionHasError(errors, [
    "trialPortalUrl",
    "trialUsername",
    "trialStartDate",
    "trialEndDate",
  ]);

  return (
    // Self-contained dark panel — NOT relying on a negative-margin trick
    // against an assumed parent white card (the mockup's approach). Same
    // visual result regardless of whatever the surrounding page does.
    <div
      className={`flex w-full min-w-0 flex-col gap-5 rounded-2xl p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-[20px] sm:p-8 ${FONT_BODY}`}
      style={{
        background:
          "linear-gradient(180deg, rgba(12,45,28,0.92) 0%, rgba(5,22,13,0.94) 100%)",
      }}
    >
      <form onSubmit={handlePreview} className="flex w-full min-w-0 flex-col gap-5">
        {/* ---------------------------------------------------------- */}
        {/* 1. Client Info                                              */}
        {/* ---------------------------------------------------------- */}
        <SectionCard
          index={1}
          title="Client Info"
          description="Company details and the logo used on the cover page."
          id="section-client-info"
          hasError={clientInfoHasError}
        >
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div>
              <FieldLabel htmlFor="clientName" hasError={Boolean(errors.clientName)}>
                Client name *
              </FieldLabel>
              <p className={hintClassName}>
                Company or organization this proposal is for.
              </p>
              <input
                id="clientName"
                name="clientName"
                type="text"
                autoComplete="organization"
                value={form.clientName}
                onChange={(event) => updateField("clientName", event.target.value)}
                placeholder="e.g. Terraprime Hotels & Resorts Ltd."
                className={`${inputClassName} mt-2`}
              />
              {errors.clientName ? (
                <p className={errorClassName}>{errors.clientName}</p>
              ) : null}
            </div>

            <div>
              <FieldLabel htmlFor="clientEmail" hasError={Boolean(errors.clientEmail)}>
                Client email *
              </FieldLabel>
              <p className={hintClassName}>
                Primary contact for follow-up and delivery.
              </p>
              <input
                id="clientEmail"
                name="clientEmail"
                type="email"
                autoComplete="email"
                value={form.clientEmail}
                onChange={(event) => updateField("clientEmail", event.target.value)}
                placeholder="hr@company.com"
                className={`${inputClassName} mt-2`}
              />
              {errors.clientEmail ? (
                <p className={errorClassName}>{errors.clientEmail}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[132px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-[#3ddc7f]/40 bg-gradient-to-b from-[#28a143]/10 to-[#28a143]/[0.03] p-6 text-center transition hover:border-[#3ddc7f]/75 hover:from-[#28a143]/[0.18] hover:to-[#28a143]/[0.06]"
            >
              <span className="grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-[#3ddc7f]/15 text-lg text-[#5ee08c]">
                ↑
              </span>
              <span className="text-sm font-semibold text-white">
                Click to upload logo
              </span>
              <span className="max-w-[46ch] text-xs leading-[1.5] text-white/60">
                Square or wide logo on a transparent background, with no
                empty space around the mark.
              </span>
            </button>

            {logoPreview ? (
              <div className="flex w-full flex-col items-center gap-2.5 rounded-xl bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] sm:w-[190px]">
                <div className="relative grid h-[86px] w-full place-items-center overflow-hidden rounded-[9px] bg-white/90">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    unoptimized
                    className="object-contain p-2"
                  />
                </div>
                <p className="max-w-full truncate text-[11.5px] text-white/60">
                  {logo?.name}
                </p>
                <button
                  type="button"
                  onClick={clearLogo}
                  className="text-[11.5px] font-semibold text-[#ff9b9b] hover:text-[#ffbdbd]"
                >
                  Remove logo
                </button>
              </div>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            id="logo"
            name="logo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              handleLogoChange(event.target.files?.[0] ?? null)
            }
          />
          {errors.logo ? <p className={errorClassName}>{errors.logo}</p> : null}
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* 2. Module Selection                                         */}
        {/* ---------------------------------------------------------- */}
        <SectionCard
          index={2}
          title="Module Selection"
          description={
            <span className="animate-pulse-subtle">
              Select up to 8 modules, or up to 6 if you&apos;re including a
              problem statement below — pick whichever are most relevant to
              this client. It&apos;s fine to select none, but we recommend at
              least {RECOMMENDED_MIN_MODULE_COUNT} for a balanced-looking
              page.
            </span>
          }
          id="section-module-selection"
          hasError={moduleSelectionHasError}
        >
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              exceedsMax
                ? "bg-amber-400/15 text-amber-300 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]"
                : "bg-[#28a143]/14 text-[#7ceaa4] shadow-[inset_0_0_0_1px_rgba(61,220,127,0.35)]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                exceedsMax ? "bg-amber-300" : "bg-[#5ee08c] shadow-[0_0_10px_#5ee08c]"
              }`}
            />
            {selectedCount} of up to {maxCount} selected
            {problemStatementActive ? " (problem statement included)" : ""}
          </div>

          {!exceedsMax && belowRecommended ? (
            <p className="mt-2 text-xs text-white/50">
              {selectedCount === 0
                ? "No modules selected — the page will show only the description with no highlights."
                : `Fewer than ${RECOMMENDED_MIN_MODULE_COUNT} modules may leave the page looking sparse.`}{" "}
              Consider selecting at least {RECOMMENDED_MIN_MODULE_COUNT}.
            </p>
          ) : null}

          <div
            className="mt-4 grid gap-2.5"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}
          >
            {MODULE_HIGHLIGHTS.map((module) => {
              const checked = form.selectedModules.includes(module.id);
              return (
                <label
                  key={module.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[11px] px-3.5 py-3 text-[13.5px] font-medium transition ${
                    checked
                      ? "bg-[#28a143]/16 text-white shadow-[inset_0_0_0_1px_rgba(61,220,127,0.55),0_0_24px_-8px_rgba(61,220,127,0.6)]"
                      : "bg-white/[0.03] text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] hover:bg-white/[0.06] hover:shadow-[inset_0_0_0_1px_rgba(61,220,127,0.35)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleModule(module.id)}
                    className="sr-only"
                  />
                  <CheckChip checked={checked} />
                  {module.label}
                </label>
              );
            })}
          </div>

          {errors.selectedModules ? (
            <p className={`${errorClassName} mt-3`}>{errors.selectedModules}</p>
          ) : null}
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* 3. Problem Statement                                        */}
        {/* ---------------------------------------------------------- */}
        <SectionCard
          index={3}
          title="Problem Statement (optional)"
          description="If filled in, this is placed directly into the proposal as a highlighted callout. Leave both fields blank for no problem statement at all."
        >
          <div>
            <label htmlFor="problemStatementHeading" className={labelClassName}>
              Heading (optional)
            </label>
            <p className={hintClassName}>Shown above the callout body.</p>
            <input
              id="problemStatementHeading"
              name="problemStatementHeading"
              type="text"
              value={form.problemStatementHeading}
              onChange={(event) =>
                updateField("problemStatementHeading", event.target.value)
              }
              placeholder="e.g. Custom deductions & negative balances"
              className={`${inputClassName} mt-2`}
            />
          </div>

          <div className="mt-5">
            <label htmlFor="problemStatementText" className={labelClassName}>
              Body text
            </label>
            <p className={hintClassName}>
              Use the toolbar for bold, italic, or a bullet list — this
              renders directly into the proposal&apos;s callout box.
            </p>
            <div className="mt-2 w-full min-w-0">
              <Richtexteditor
                value={form.problemStatementText}
                onChange={(html) => updateField("problemStatementText", html)}
                placeholder="e.g. Deductions are capped so a payslip can never go negative. If a manually entered deduction is larger than what a single month can absorb, the excess is carried forward to next month's payroll."
              />
            </div>
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* 4. Cover & letter details                                   */}
        {/* ---------------------------------------------------------- */}
        <SectionCard
          index={4}
          title="Cover & letter details"
          description="Used on the cover page and in the COO's introduction letter."
          id="section-cover-letter"
          hasError={coverLetterHasError}
        >
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div>
              <label htmlFor="documentTitle" className={labelClassName}>
                Document title
              </label>
              <p className={hintClassName}>
                Leave blank for &quot;{DEFAULT_DOCUMENT_TITLE}&quot;.
              </p>
              <input
                id="documentTitle"
                name="documentTitle"
                type="text"
                value={form.documentTitle}
                onChange={(event) => updateField("documentTitle", event.target.value)}
                placeholder={DEFAULT_DOCUMENT_TITLE}
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label htmlFor="recipientTitle" className={labelClassName}>
                Recipient title
              </label>
              <p className={hintClassName}>
                Leave blank for &quot;{DEFAULT_RECIPIENT_TITLE}&quot;.
              </p>
              <input
                id="recipientTitle"
                name="recipientTitle"
                type="text"
                value={form.recipientTitle}
                onChange={(event) => updateField("recipientTitle", event.target.value)}
                placeholder={DEFAULT_RECIPIENT_TITLE}
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <FieldLabel htmlFor="preparedDate" hasError={Boolean(errors.preparedDate)}>
                Proposal date *
              </FieldLabel>
              <p className={hintClassName}>
                Used on the cover, the letter, and the section meta line.
              </p>
              <input
                id="preparedDate"
                name="preparedDate"
                type="date"
                value={form.preparedDate}
                onChange={(event) => updateField("preparedDate", event.target.value)}
                className={`${inputClassName} mt-2`}
              />
              {errors.preparedDate ? (
                <p className={errorClassName}>{errors.preparedDate}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="letterAddresseeName" className={labelClassName}>
                Letter addressee
              </label>
              <p className={hintClassName}>
                Leave blank to address the letter to the client name above.
              </p>
              <input
                id="letterAddresseeName"
                name="letterAddresseeName"
                type="text"
                value={form.letterAddresseeName}
                onChange={(event) =>
                  updateField("letterAddresseeName", event.target.value)
                }
                placeholder="e.g. Terraprime Group"
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <label htmlFor="meetingDateReference" className={labelClassName}>
                Date of client meeting
              </label>
              <p className={hintClassName}>
                Referenced in the COO letter body. Defaults to today.
              </p>
              <input
                id="meetingDateReference"
                name="meetingDateReference"
                type="date"
                value={form.meetingDateReference}
                onChange={(event) =>
                  updateField("meetingDateReference", event.target.value)
                }
                className={`${inputClassName} mt-2`}
              />
            </div>

            <div>
              <FieldLabel htmlFor="validityDays" hasError={Boolean(errors.validityDays)}>
                Proposal valid for (days)
              </FieldLabel>
              <p className={hintClassName}>Leave blank to use 30 days.</p>
              <input
                id="validityDays"
                name="validityDays"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.validityDays}
                onChange={(event) =>
                  updateField("validityDays", event.target.value)
                }
                placeholder="30"
                className={`${inputClassName} mt-2`}
              />
              {errors.validityDays ? (
                <p className={errorClassName}>{errors.validityDays}</p>
              ) : null}
            </div>
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* 5. Commercial terms                                         */}
        {/* ---------------------------------------------------------- */}
        <SectionCard
          index={5}
          title="Commercial terms"
          description="Populates the pricing table on the final page. All figures in BDT."
          id="section-commercial-terms"
          hasError={commercialTermsHasError}
        >
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div>
              <FieldLabel htmlFor="employeeCount" hasError={Boolean(errors.employeeCount)}>
                Number of employees *
              </FieldLabel>
              <p className={hintClassName}>Headcount covered by the subscription.</p>
              <input
                id="employeeCount"
                name="employeeCount"
                type="number"
                min={1}
                inputMode="numeric"
                value={form.employeeCount}
                onChange={(event) => updateField("employeeCount", event.target.value)}
                placeholder="e.g. 25"
                className={`${inputClassName} mt-2`}
              />
              {errors.employeeCount ? (
                <p className={errorClassName}>{errors.employeeCount}</p>
              ) : null}
            </div>

            <div>
              <FieldLabel htmlFor="mrcFee" hasError={Boolean(errors.mrcFee)}>
                Monthly subscription fee *
              </FieldLabel>
              <p className={hintClassName}>MRC in BDT.</p>
              <input
                id="mrcFee"
                name="mrcFee"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.mrcFee}
                onChange={(event) => updateField("mrcFee", event.target.value)}
                placeholder="e.g. 2500"
                className={`${inputClassName} mt-2`}
              />
              {errors.mrcFee ? (
                <p className={errorClassName}>{errors.mrcFee}</p>
              ) : null}
            </div>

            <div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-white/90">
                <input
                  type="checkbox"
                  checked={form.includeRolloutCharge}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    updateField("includeRolloutCharge", checked);
                    if (!checked) {
                      setErrors((current) => ({ ...current, rolloutCharge: undefined }));
                    }
                  }}
                  className="sr-only"
                />
                <CheckChip checked={form.includeRolloutCharge} />
                Include software rollout charge (optional)
              </label>
              {form.includeRolloutCharge ? (
                <>
                  <FieldLabel htmlFor="rolloutCharge" hasError={Boolean(errors.rolloutCharge)}>
                    One-time, in BDT.
                  </FieldLabel>
                  {/* <p className={hintClassName}>One-time, in BDT.</p> */}
                  <input
                    id="rolloutCharge"
                    name="rolloutCharge"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={form.rolloutCharge}
                    onChange={(event) => updateField("rolloutCharge", event.target.value)}
                    placeholder="e.g. 10000"
                    className={`${inputClassName} mt-2`}
                  />
                  {errors.rolloutCharge ? (
                    <p className={errorClassName}>{errors.rolloutCharge}</p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-white/[0.03] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-white/90">
              <input
                type="checkbox"
                checked={form.includeFieldTracking}
                onChange={(event) =>
                  updateField("includeFieldTracking", event.target.checked)
                }
                className="sr-only"
              />
              <CheckChip checked={form.includeFieldTracking} />
              Include field employee tracking
            </label>

            {form.includeFieldTracking ? (
              <div className="mt-3 max-w-xs">
                <FieldLabel htmlFor="fieldTrackingFee" hasError={Boolean(errors.fieldTrackingFee)}>
                  Per-user fee (MRC)
                </FieldLabel>
                <input
                  id="fieldTrackingFee"
                  name="fieldTrackingFee"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.fieldTrackingFee}
                  onChange={(event) =>
                    updateField("fieldTrackingFee", event.target.value)
                  }
                  placeholder="BDT per user, e.g. 100"
                  className={`${inputClassName} mt-2`}
                />
                {errors.fieldTrackingFee ? (
                  <p className={errorClassName}>{errors.fieldTrackingFee}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* 6. Email details                                            */}
        {/* ---------------------------------------------------------- */}
        <SectionCard
          index={6}
          title="Email details"
          description={
            <>
              Only used by the &quot;Send mail&quot; button — not part of the
              proposal PDF. Required to send, but won&apos;t block saving or
              downloading the proposal.
            </>
          }
          id="section-email-details"
          hasError={emailDetailsHasError}
        >
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div>
              <FieldLabel htmlFor="trialPortalUrl" hasError={Boolean(errors.trialPortalUrl)}>
                Portal URL *
              </FieldLabel>
              <p className={hintClassName}>Where the client signs in.</p>
              <input
                id="trialPortalUrl"
                name="trialPortalUrl"
                type="url"
                value={form.trialPortalUrl}
                onChange={(event) => updateField("trialPortalUrl", event.target.value)}
                placeholder={DEFAULT_TRIAL_PORTAL_URL}
                className={`${inputClassName} mt-2`}
              />
              {errors.trialPortalUrl ? (
                <p className={errorClassName}>{errors.trialPortalUrl}</p>
              ) : null}
            </div>

            <div>
              <FieldLabel htmlFor="trialUsername" hasError={Boolean(errors.trialUsername)}>
                Username *
              </FieldLabel>
              <p className={hintClassName}>The trial login handed to the client.</p>
              <input
                id="trialUsername"
                name="trialUsername"
                type="text"
                value={form.trialUsername}
                onChange={(event) => updateField("trialUsername", event.target.value)}
                placeholder="e.g. nazmul@tazahairoil.com"
                className={`${inputClassName} mt-2`}
              />
              {errors.trialUsername ? (
                <p className={errorClassName}>{errors.trialUsername}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="trialPassword" className={labelClassName}>
                Password
              </label>
              <input
                id="trialPassword"
                name="trialPassword"
                type="text"
                value={TRIAL_ACCOUNT_PASSWORD}
                readOnly
                className={`${inputClassName} mt-2 opacity-70`}
              />
              <p className={hintClassName}>
                Fixed for all trial accounts — included automatically in the
                mail.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="trialStartDate" hasError={Boolean(errors.trialStartDate)}>
                  Trial start
                </FieldLabel>
                <input
                  id="trialStartDate"
                  name="trialStartDate"
                  type="date"
                  value={form.trialStartDate}
                  onChange={(event) =>
                    updateField("trialStartDate", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
                {errors.trialStartDate ? (
                  <p className={errorClassName}>{errors.trialStartDate}</p>
                ) : null}
              </div>

              <div>
                <FieldLabel htmlFor="trialEndDate" hasError={Boolean(errors.trialEndDate)}>
                  Trial end
                </FieldLabel>
                <input
                  id="trialEndDate"
                  name="trialEndDate"
                  type="date"
                  value={form.trialEndDate}
                  onChange={(event) =>
                    updateField("trialEndDate", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
                {errors.trialEndDate ? (
                  <p className={errorClassName}>{errors.trialEndDate}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <h4 className={`text-sm font-semibold text-white ${FONT_HEADING}`}>
              Sent from
            </h4>
            <p className="mt-1 text-xs text-white/60">
              Signs off the trial email — pre-filled, change if someone else
              on the team is sending this one.
            </p>

            <div
              className="mt-3 grid gap-5"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
            >
              <div>
                <label htmlFor="trialSenderName" className={labelClassName}>
                  Name
                </label>
                <input
                  id="trialSenderName"
                  name="trialSenderName"
                  type="text"
                  value={form.trialSenderName}
                  onChange={(event) =>
                    updateField("trialSenderName", event.target.value)
                  }
                  placeholder="e.g. Md. Ariful Islam Manik"
                  className={`${inputClassName} mt-2`}
                />
              </div>

              <div>
                <label htmlFor="trialSenderTitle" className={labelClassName}>
                  Title
                </label>
                <input
                  id="trialSenderTitle"
                  name="trialSenderTitle"
                  type="text"
                  value={form.trialSenderTitle}
                  onChange={(event) =>
                    updateField("trialSenderTitle", event.target.value)
                  }
                  placeholder="e.g. Manager – HRM Growth"
                  className={`${inputClassName} mt-2`}
                />
              </div>

              <div>
                <label htmlFor="trialSenderPhone" className={labelClassName}>
                  Phone
                </label>
                <input
                  id="trialSenderPhone"
                  name="trialSenderPhone"
                  type="tel"
                  value={form.trialSenderPhone}
                  onChange={(event) =>
                    updateField("trialSenderPhone", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
              </div>

              <div>
                <label htmlFor="trialSenderEmail" className={labelClassName}>
                  Email
                </label>
                <input
                  id="trialSenderEmail"
                  name="trialSenderEmail"
                  type="email"
                  autoComplete="email"
                  value={form.trialSenderEmail}
                  onChange={(event) =>
                    updateField("trialSenderEmail", event.target.value)
                  }
                  className={`${inputClassName} mt-2`}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ---------------------------------------------------------- */}
        {/* What happens next                                           */}
        {/* ---------------------------------------------------------- */}
        <div
          className="rounded-[14px] p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(237,183,19,0.12), rgba(237,183,19,0.03))",
            boxShadow: "inset 0 0 0 1px rgba(237,183,19,0.28)",
          }}
        >
          <p className={`text-[13.5px] font-bold tracking-[0.02em] text-[#f3cf5e] ${FONT_HEADING}`}>
            What happens next
          </p>
          <ul className="mt-2.5 flex flex-col gap-1.5 text-[13.5px] leading-[1.5] text-white/70">
            <li className="flex gap-2.5">
              <span className="text-[#edb713]">—</span>
              &quot;Preview Proposal&quot; saves input and opens it in a new tab.
            </li>
            <li className="flex gap-2.5">
              <span className="text-[#edb713]">—</span>
              &quot;Download PDF&quot; uses the last saved inputs. May take up
              to a minute.
            </li>
            <li className="flex gap-2.5">
              <span className="text-[#edb713]">—</span>
              &quot;Send mail&quot; opens your mail client without an
              attachment.
            </li>
            <li className="flex gap-2.5">
              <span className="text-[#edb713]">—</span>
              Attach the proposal PDF manually before sending.
            </li>
          </ul>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Actions                                                     */}
        {/* ---------------------------------------------------------- */}
        <div className="flex flex-col-reverse gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/proposal-builder"
            className="text-center text-sm font-medium text-white/60 transition hover:text-white"
          >
            ← Back
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleSendMail}
              className={`rounded-xl bg-white/5 px-6 py-[15px] text-[15px] font-semibold text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] transition hover:bg-white/10 ${FONT_HEADING}`}
            >
              Send mail
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className={`rounded-xl bg-white/5 px-6 py-[15px] text-[15px] font-semibold text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${FONT_HEADING}`}
            >
              {isDownloadingPdf ? "Generating PDF…" : "Download PDF"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-xl px-7 py-[15px] text-[15px] font-bold text-[#0c3d20] shadow-[0_10px_30px_-10px_rgba(237,183,19,0.75),inset_0_1px_0_rgba(255,255,255,0.62)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${FONT_HEADING}`}
              style={{ background: "linear-gradient(180deg,#f3c634,#edb713)" }}
            >
              {isSubmitting ? "Saving…" : "Preview Proposal"}
            </button>
          </div>
        </div>

        {pdfError ? (
          <p className="text-sm font-medium text-[#ff9b9b]" role="alert">
            Could not generate PDF: {pdfError}
          </p>
        ) : null}
      </form>
    </div>
  );
}