"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getModuleRecommendation } from "@/app/components/ModuleRecommendation";
import type { ClientDetailsInput } from "@/lib/module-recommendation";
import {
  fileToDataUrl,
  savePresentationSession,
  savePreviewClientName,
  savePreviewLogo,
} from "@/lib/presentation-session";

type FormState = {
  clientName: string;
  clientEmail: string;
  requirements: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState | "logo", string>>;

const initialForm: FormState = {
  clientName: "",
  clientEmail: "",
  requirements: "",
  notes: "",
};

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

  if (logo && !logo.type.startsWith("image/")) {
    errors.logo = "Logo must be an image file.";
  }

  return errors;
}

export default function ClientDetailsForm() {
  const router = useRouter();
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form, logo);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
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

      router.push("/new/validate");
    } catch {
      setErrors({ logo: "Could not prepare client details. Please try again." });
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "w-full rounded-lg border border-[#0c3d20]/15 bg-white px-4 py-3 text-[#0c3d20] placeholder:text-[#0c3d20]/40 outline-none transition focus:border-[#137a3c] focus:ring-2 focus:ring-[#137a3c]/20";

  const labelClassName = "block text-sm font-semibold text-[#0c3d20]";

  const hintClassName = "mt-1 text-xs text-[#0c3d20]/60";

  const errorClassName = "mt-1 text-xs font-medium text-red-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="clientName" className={labelClassName}>
            Client name
          </label>
          <p className={hintClassName}>
            Company or organization this deck is for.
          </p>
          <input
            id="clientName"
            name="clientName"
            type="text"
            autoComplete="organization"
            value={form.clientName}
            onChange={(event) => updateField("clientName", event.target.value)}
            placeholder="e.g. 300 Ltd"
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
          PNG, SVG, or JPG — used on the title slide and branding elements.
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
          stakeholders, or slides to emphasize.
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

      <div className="rounded-xl border border-[#137a3c]/20 bg-[#137a3c]/5 px-5 py-4">
        <p className="text-sm font-medium text-[#0c3d20]">What happens next</p>
        <ul className="mt-2 space-y-1 text-sm text-[#0c3d20]/75">
          <li>Requirements are matched against modules in the knowledge base.</li>
          <li>You validate the recommended options before the deck is generated.</li>
          <li>Once confirmed, the presentation is built and ready to preview.</li>
        </ul>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[#0c3d20]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-center text-sm font-medium text-[#0c3d20]/70 transition hover:text-[#0c3d20]"
        >
          ← Back to home
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#edb713] px-8 py-4 text-base font-semibold text-[#0c3d20] shadow-lg shadow-black/10 transition hover:bg-[#f5c832] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Matching modules…" : "Continue to validate options"}
        </button>
      </div>
    </form>
  );
}
