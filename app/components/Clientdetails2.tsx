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
  rolloutCharge: string;
  includeFieldTracking: boolean;
  fieldTrackingFee: string;

  // Proposal contact (Section 4 footer)
  contactName: string;
  contactTeam: string;
  contactEmail: string;
  contactPhone: string;

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

/** Section 3 is a fixed one-page layout: 3 modules if a problem statement is
 * present (it takes up the space of the other 3), 6 modules if not. This
 * is what keeps the page from ever looking wonky — see module-highlights.ts
 * for the finalized content each checkbox pulls from. */
const MODULE_COUNT_WITH_PROBLEM_STATEMENT = 3;
const MODULE_COUNT_WITHOUT_PROBLEM_STATEMENT = 6;

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
  selectedModules: [],

  employeeCount: "",
  mrcFee: "",
  rolloutCharge: "",
  includeFieldTracking: false,
  fieldTrackingFee: "",

  contactName: "",
  contactTeam: "",
  contactEmail: "",
  contactPhone: "",

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

function requiredModuleCount(form: FormState): number {
  return hasProblemStatement(form)
    ? MODULE_COUNT_WITH_PROBLEM_STATEMENT
    : MODULE_COUNT_WITHOUT_PROBLEM_STATEMENT;
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

  if (
    form.contactEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())
  ) {
    errors.contactEmail = "Enter a valid email address.";
  }

  if (!isPositiveNumber(form.employeeCount)) {
    errors.employeeCount = "Enter the number of employees.";
  }

  if (!isPositiveNumber(form.mrcFee)) {
    errors.mrcFee = "Enter the monthly subscription fee (BDT).";
  }

  if (!isPositiveNumber(form.rolloutCharge)) {
    errors.rolloutCharge = "Enter the software rollout charge (BDT).";
  }

  if (form.includeFieldTracking && !isPositiveNumber(form.fieldTrackingFee)) {
    errors.fieldTrackingFee = "Enter a per-user fee, or turn this off.";
  }

  // Cross-validation: module count must match the problem-statement state,
  // exactly, so the one-page layout never has to guess how to fit content.
  const required = requiredModuleCount(form);
  const selectedCount = form.selectedModules.length;
  if (selectedCount !== required) {
    errors.selectedModules = hasProblemStatement(form)
      ? `You've written a problem statement, so it takes the place of 3 modules on the page — select exactly ${required} modules (currently ${selectedCount} selected).`
      : `With no problem statement, all 6 module slots are available — select exactly ${required} modules (currently ${selectedCount} selected).`;
  }

  return errors;
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
      rolloutCharge: Number(form.rolloutCharge),
      fieldTrackingFee: form.includeFieldTracking
        ? Number(form.fieldTrackingFee)
        : undefined,
      letterAddresseeName:
        form.letterAddresseeName.trim() || form.clientName.trim(),
      meetingDateReference: form.meetingDateReference,
      validityDays: form.validityDays.trim()
        ? Number(form.validityDays)
        : 30,
      contactName: form.contactName.trim() || undefined,
      contactTeam: form.contactTeam.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,

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

  const inputClassName =
    "w-full rounded-lg border border-[#0c3d20]/15 bg-white px-4 py-3 text-[#0c3d20] placeholder:text-[#0c3d20]/40 outline-none transition focus:border-[#137a3c] focus:ring-2 focus:ring-[#137a3c]/20";

  const labelClassName = "block text-sm font-semibold text-[#0c3d20]";

  const hintClassName = "mt-1 text-xs text-[#0c3d20]/60";

  const errorClassName = "mt-1 text-xs font-medium text-red-600";

  const problemStatementActive = hasProblemStatement(form);
  const requiredCount = requiredModuleCount(form);
  const selectedCount = form.selectedModules.length;
  const countIsCorrect = selectedCount === requiredCount;

  return (
    <form onSubmit={handlePreview} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="clientName" className={labelClassName}>
            Client name
          </label>
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
          <label htmlFor="clientEmail" className={labelClassName}>
            Client email
          </label>
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

      <div>
        <label htmlFor="logo" className={labelClassName}>
          Client logo
        </label>
        <p className={hintClassName}>
          PNG, SVG, or JPG — used on the cover page. Transparent background,
          no empty space around the mark.
        </p>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-36 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#137a3c]/35 bg-[#137a3c]/5 px-6 py-8 text-center transition hover:border-[#137a3c]/60 hover:bg-[#137a3c]/10"
          >
            <span className="text-sm font-medium text-[#0c3d20]">
              Click to upload logo
            </span>
            <span className="mt-1 text-xs text-[#0c3d20]/60">
              Recommended: square or wide logo on transparent background. Make sure the logo does not have empty space around it.
            </span>
          </button>

          {logoPreview ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#0c3d20]/10 bg-white p-4">
              <div className="relative flex h-24 w-40 items-center justify-center overflow-hidden rounded-lg bg-[#f4f7f5]">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  unoptimized
                  className="object-contain p-2"
                />
              </div>
              <p className="max-w-40 truncate text-xs text-[#0c3d20]/70">
                {logo?.name}
              </p>
              <button
                type="button"
                onClick={clearLogo}
                className="text-xs font-medium text-red-600 hover:text-red-700"
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
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Section 3 (Solution Proposal) — problem statement + modules       */}
      {/* Replaces the old "Requirements" field, which lived here before.   */}
      {/* ---------------------------------------------------------------- */}
      <div>
        <h3 className="text-base font-semibold text-[#0c3d20]">
          Problem statement
        </h3>
        <p className="mt-1 text-sm text-[#0c3d20]/60">
          Optional. If filled in, this is placed directly into the proposal
          as a highlighted callout — write it exactly as you want the client
          to read it. Leave both fields blank for no problem statement at all.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="problemStatementHeading" className={labelClassName}>
              Heading (optional)
            </label>
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

          <div>
            <label htmlFor="problemStatementText" className={labelClassName}>
              Body text
            </label>
            <p className={hintClassName}>
              Use the toolbar for bold, italic, or a bullet list — this
              renders directly into the proposal&apos;s callout box.
            </p>
            <div className="mt-2">
              <Richtexteditor
                value={form.problemStatementText}
                onChange={(html) => updateField("problemStatementText", html)}
                placeholder="e.g. Deductions are capped so a payslip can never go negative. If a manually entered deduction is larger than what a single month can absorb, the excess is carried forward to next month's payroll."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-[#0c3d20]/10 pt-6">
          <h3 className="text-base font-semibold text-[#0c3d20]">
            Module selection
          </h3>
          <p className="mt-1 text-sm text-[#0c3d20]/60">
            <b>6 modules</b> if there's no problem statement above, or{" "}
            <b>3 modules</b> if there is one. Pick whichever modules are most
            relevant to this client — the highlights for each are already
            finalized.
          </p>

          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
              countIsCorrect
                ? "bg-[#137a3c]/10 text-[#137a3c]"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {selectedCount} of {requiredCount} selected
            {problemStatementActive ? " (problem statement included)" : ""}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {MODULE_HIGHLIGHTS.map((module) => {
              const checked = form.selectedModules.includes(module.id);
              return (
                <label
                  key={module.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                    checked
                      ? "border-[#137a3c] bg-[#137a3c]/5 text-[#0c3d20]"
                      : "border-[#0c3d20]/15 text-[#0c3d20]/80 hover:border-[#137a3c]/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleModule(module.id)}
                    className="mt-0.5 h-4 w-4 rounded border-[#0c3d20]/30 text-[#137a3c] focus:ring-[#137a3c]/30"
                  />
                  <span className="font-medium">{module.label}</span>
                </label>
              );
            })}
          </div>

          {errors.selectedModules ? (
            <p className={`${errorClassName} mt-3`}>{errors.selectedModules}</p>
          ) : null}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Section 1 (Cover) + Section 2 (COO Letter) specifics             */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-t border-[#0c3d20]/10 pt-8">
        <h3 className="text-base font-semibold text-[#0c3d20]">
          Cover &amp; letter details
        </h3>
        <p className="mt-1 text-sm text-[#0c3d20]/60">
          Used on the cover page and in the COO&apos;s introduction letter.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="documentTitle" className={labelClassName}>
              Document title
            </label>
            <p className={hintClassName}>
              Leave blank to use the default: &quot;{DEFAULT_DOCUMENT_TITLE}&quot;
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
              Leave blank to use the default: &quot;{DEFAULT_RECIPIENT_TITLE}&quot;
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
            <label htmlFor="preparedDate" className={labelClassName}>
              Proposal date
            </label>
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
              Letter addressee (if different from client name)
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
            <label htmlFor="validityDays" className={labelClassName}>
              Proposal valid for (days)
            </label>
            <p className={hintClassName}>
              Leave blank to use 30 days.
            </p>
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
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Section 4 (Commercial Terms) specifics                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-t border-[#0c3d20]/10 pt-8">
        <h3 className="text-base font-semibold text-[#0c3d20]">
          Commercial terms
        </h3>
        <p className="mt-1 text-sm text-[#0c3d20]/60">
          Populates the pricing table on the final page. All figures in BDT.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <div>
            <label htmlFor="employeeCount" className={labelClassName}>
              Number of employees
            </label>
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
            <label htmlFor="mrcFee" className={labelClassName}>
              Monthly subscription fee (MRC)
            </label>
            <input
              id="mrcFee"
              name="mrcFee"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.mrcFee}
              onChange={(event) => updateField("mrcFee", event.target.value)}
              placeholder="BDT, e.g. 2500"
              className={`${inputClassName} mt-2`}
            />
            {errors.mrcFee ? (
              <p className={errorClassName}>{errors.mrcFee}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="rolloutCharge" className={labelClassName}>
              Software rollout charge
            </label>
            <input
              id="rolloutCharge"
              name="rolloutCharge"
              type="number"
              min={0}
              inputMode="numeric"
              value={form.rolloutCharge}
              onChange={(event) => updateField("rolloutCharge", event.target.value)}
              placeholder="BDT, e.g. 10000"
              className={`${inputClassName} mt-2`}
            />
            {errors.rolloutCharge ? (
              <p className={errorClassName}>{errors.rolloutCharge}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-[#0c3d20]/10 bg-[#f4f7f5] p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-[#0c3d20]">
            <input
              type="checkbox"
              checked={form.includeFieldTracking}
              onChange={(event) =>
                updateField("includeFieldTracking", event.target.checked)
              }
              className="h-4 w-4 rounded border-[#0c3d20]/30 text-[#137a3c] focus:ring-[#137a3c]/30"
            />
            Include field employee tracking
          </label>

          {form.includeFieldTracking ? (
            <div className="mt-3 max-w-xs">
              <label htmlFor="fieldTrackingFee" className={labelClassName}>
                Per-user fee (MRC)
              </label>
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
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Proposal contact (Section 4 footer)                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-t border-[#0c3d20]/10 pt-8">
        <h3 className="text-base font-semibold text-[#0c3d20]">
          Proposal contact
        </h3>
        <p className="mt-1 text-sm text-[#0c3d20]/60">
          Shown in the footer of the final page.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="contactName" className={labelClassName}>
              Prepared by (name)
            </label>
            <input
              id="contactName"
              name="contactName"
              type="text"
              value={form.contactName}
              onChange={(event) => updateField("contactName", event.target.value)}
              placeholder="e.g. Hasib Rahman"
              className={`${inputClassName} mt-2`}
            />
          </div>

          <div>
            <label htmlFor="contactTeam" className={labelClassName}>
              Team
            </label>
            <input
              id="contactTeam"
              name="contactTeam"
              type="text"
              value={form.contactTeam}
              onChange={(event) => updateField("contactTeam", event.target.value)}
              placeholder="e.g. Sales"
              className={`${inputClassName} mt-2`}
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className={labelClassName}>
              Contact email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              autoComplete="email"
              value={form.contactEmail}
              onChange={(event) =>
                updateField("contactEmail", event.target.value)
              }
              placeholder="name@shomvob.com"
              className={`${inputClassName} mt-2`}
            />
            {errors.contactEmail ? (
              <p className={errorClassName}>{errors.contactEmail}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="contactPhone" className={labelClassName}>
              Contact phone
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              autoComplete="tel"
              value={form.contactPhone}
              onChange={(event) =>
                updateField("contactPhone", event.target.value)
              }
              placeholder="+880…"
              className={`${inputClassName} mt-2`}
            />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Trial account email (Send mail button)                           */}
      {/* ---------------------------------------------------------------- */}
      <div className="border-t border-[#0c3d20]/10 pt-8">
        <h3 className="text-base font-semibold text-[#0c3d20]">
          Trial account email
        </h3>
        <p className="mt-1 text-sm text-[#0c3d20]/60">
          Only used by the &quot;Send mail&quot; button below — not part of
          the proposal PDF. Required to send, but won&apos;t block saving or
          downloading the proposal.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="trialPortalUrl" className={labelClassName}>
              Portal URL
            </label>
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
            <label htmlFor="trialUsername" className={labelClassName}>
              Username
            </label>
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
              className={`${inputClassName} mt-2 bg-[#0c3d20]/5 text-[#0c3d20]/70`}
            />
            <p className="mt-1 text-xs text-[#0c3d20]/55">
              Fixed for all trial accounts — included automatically in the mail.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="trialStartDate" className={labelClassName}>
                Trial start
              </label>
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
              <label htmlFor="trialEndDate" className={labelClassName}>
                Trial end
              </label>
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

        <div className="mt-6 border-t border-[#0c3d20]/10 pt-6">
          <h4 className="text-sm font-semibold text-[#0c3d20]">Sent from</h4>
          <p className="mt-1 text-xs text-[#0c3d20]/60">
            Signs off the trial email — fill in who on the team is sending this
            one.
          </p>

          <div className="mt-3 grid gap-6 md:grid-cols-2">
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
                placeholder="e.g. +880 1xxxxxxx"
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
                placeholder="e.g. ariful@shomvob.com"
                className={`${inputClassName} mt-2`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#137a3c]/20 bg-[#137a3c]/5 px-5 py-4">
        <p className="text-sm font-medium text-[#0c3d20]">What happens next</p>
        <ul className="mt-2 space-y-1 text-sm text-[#0c3d20]/75">
          <li>"Save &amp; Preview" saves input and opens in a new tab.</li>
          <li>"Download pdf" uses the last saved version of inputs.</li>
          <li>"Send mail" opens your mail client without attachment. (for current version)</li>
          <li>Attach proposal PDF manually before sending.</li>
        </ul>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[#0c3d20]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/proposal-builder"
          className="text-center text-sm font-medium text-[#0c3d20]/70 transition hover:text-[#0c3d20]"
        >
          ← Back
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSendMail}
            className="rounded-xl border border-[#0c3d20]/20 bg-white px-8 py-4 text-base font-semibold text-[#0c3d20] transition hover:border-[#0c3d20]/40 hover:bg-[#f4f7f5]"
          >
            Send mail
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="rounded-xl border border-[#0c3d20]/20 bg-white px-8 py-4 text-base font-semibold text-[#0c3d20] transition hover:border-[#0c3d20]/40 hover:bg-[#f4f7f5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloadingPdf ? "Generating PDF…" : "Download PDF"}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#edb713] px-8 py-4 text-base font-semibold text-[#0c3d20] shadow-lg shadow-black/10 transition hover:bg-[#f5c832] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Preview Proposal"}
          </button>
        </div>
      </div>

      {pdfError ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          Could not generate PDF: {pdfError}
        </p>
      ) : null}
    </form>
  );
}