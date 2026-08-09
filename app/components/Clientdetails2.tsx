"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { getModuleRecommendation } from "@/app/components/ModuleRecommendation";
import type { ClientDetailsInput } from "@/lib/module-recommendation";
import { buildClientMailtoUrl } from "@/lib/client-email-template";
import {
  fileToDataUrl,
  savePresentationSession,
  savePreviewClientName,
  savePreviewLogo,
  saveProposalDetails,
} from "@/lib/presentation-session";

type FormState = {
  // Existing fields
  clientName: string;
  clientEmail: string;
  requirements: string;
  notes: string;

  // Section 1 (Cover) + Section 2 (COO Letter)
  documentTitle: string;
  preparedDate: string; // "YYYY-MM-DD" from <input type="date">
  recipientTitle: string;
  letterAddresseeName: string;
  meetingDateReference: string;
  validityDays: string;

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
};

type FormErrors = Partial<Record<keyof FormState | "logo", string>>;

/** Mirrors the default set in CoverPage.tsx — keep these in sync. */
const DEFAULT_DOCUMENT_TITLE = "Workforce Management Ecosystem";
const DEFAULT_RECIPIENT_TITLE = "Managing Director";

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

  employeeCount: "",
  mrcFee: "",
  rolloutCharge: "",
  includeFieldTracking: false,
  fieldTrackingFee: "",

  contactName: "",
  contactTeam: "",
  contactEmail: "",
  contactPhone: "",
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

  return errors;
}

export default function Clientdetails2() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
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

    if (Object.keys(nextErrors).length > 0) {
      setErrors((current) => ({ ...current, ...nextErrors }));
      return;
    }

    window.location.href = buildClientMailtoUrl({ clientName, clientEmail });
  }

  const inputClassName =
    "w-full rounded-lg border border-[#0c3d20]/15 bg-white px-4 py-3 text-[#0c3d20] placeholder:text-[#0c3d20]/40 outline-none transition focus:border-[#137a3c] focus:ring-2 focus:ring-[#137a3c]/20";

  const labelClassName = "block text-sm font-semibold text-[#0c3d20]";

  const hintClassName = "mt-1 text-xs text-[#0c3d20]/60";

  const errorClassName = "mt-1 text-xs font-medium text-red-600";

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

      <div>
        <label htmlFor="requirements" className={labelClassName}>
          Requirements
        </label>
        <p className={hintClassName}>
          Modules, features, or pain points discussed on the demo call.
        </p>
        <textarea
          id="requirements"
          name="requirements"
          rows={5}
          value={form.requirements}
          onChange={(event) => updateField("requirements", event.target.value)}
          placeholder="e.g. Attendance tracking, leave management, payroll integration, mobile app for field staff..."
          className={`${inputClassName} mt-2 resize-y`}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClassName}>
          Notes
        </label>
        <p className={hintClassName}>
          Extra context for the sales or content team — tone, deadlines,
          stakeholders, or sections to emphasize.
        </p>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="e.g. Focus on factory workforce. Management wants ROI within 6 months. Avoid technical jargon."
          className={`${inputClassName} mt-2 resize-y`}
        />
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

      <div className="rounded-xl border border-[#137a3c]/20 bg-[#137a3c]/5 px-5 py-4">
        <p className="text-sm font-medium text-[#0c3d20]">What happens next</p>
        <ul className="mt-2 space-y-1 text-sm text-[#0c3d20]/75">
          <li>Preview opens in a new tab so your form entries stay here.</li>
          <li>Send mail opens your email app with a drafted message to the client.</li>
          <li>Attach the proposal PDF manually before sending.</li>
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
            Send mail to client
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-[#edb713] px-8 py-4 text-base font-semibold text-[#0c3d20] shadow-lg shadow-black/10 transition hover:bg-[#f5c832] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Preview cover page"}
          </button>
        </div>
      </div>
    </form>
  );
}