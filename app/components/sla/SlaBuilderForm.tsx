"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { MODULE_HIGHLIGHTS } from "@/lib/module-highlights";
import {
  buildSuggestedSlaPdfFileName,
  saveSlaDetails,
  type SlaDetails,
} from "@/lib/sla-session";

type FormState = {
  clientName: string;
  clientAddress: string;
  agreementDate: string;
  selectedFeatures: string[];
  employeeCount: string;
  monthlyFee: string;
  oneTimeFee: string;
  vatPercent: string;
  includeEmployeeTracking: boolean;
  trackingFeePerEmployee: string;
  clientCeoName: string;
  clientCeoTitle: string;
  clientHrHeadName: string;
  clientHrHeadTitle: string;
  shomvobPocName: string;
  shomvobPocTitle: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const DEFAULT_FEATURES = MODULE_HIGHLIGHTS.slice(0, 4).map(({ label }) => label);

const initialForm: FormState = {
  clientName: "",
  clientAddress: "",
  agreementDate: new Date().toISOString().slice(0, 10),
  selectedFeatures: DEFAULT_FEATURES,
  employeeCount: "",
  monthlyFee: "",
  oneTimeFee: "",
  vatPercent: "5",
  includeEmployeeTracking: false,
  trackingFeePerEmployee: "",
  clientCeoName: "",
  clientCeoTitle: "",
  clientHrHeadName: "",
  clientHrHeadTitle: "",
  shomvobPocName: "",
  shomvobPocTitle: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#5cd47e] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#28a143]/25";
const labelClass = "text-sm font-semibold text-white/90";
const errorClass = "mt-1.5 text-xs font-medium text-[#ff9b9b]";

function SectionCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 md:p-7">
      <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#28a143]/20 text-sm font-bold text-[#5cd47e]">
          {number}
        </span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? <p className={errorClass}>{error}</p> : null}
    </div>
  );
}

function isPositive(value: string): boolean {
  const number = Number(value);
  return value.trim() !== "" && Number.isFinite(number) && number > 0;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const requiredText: (keyof FormState)[] = [
    "clientName",
    "clientAddress",
    "agreementDate",
    "clientCeoName",
    "clientCeoTitle",
    "clientHrHeadName",
    "clientHrHeadTitle",
    "shomvobPocName",
    "shomvobPocTitle",
  ];

  for (const key of requiredText) {
    if (!String(form[key]).trim()) errors[key] = "This field is required.";
  }

  if (form.selectedFeatures.length === 0) {
    errors.selectedFeatures = "Select at least one system feature.";
  }
  if (!isPositive(form.employeeCount) || !Number.isInteger(Number(form.employeeCount))) {
    errors.employeeCount = "Enter a positive whole number.";
  }
  if (!isPositive(form.monthlyFee)) {
    errors.monthlyFee = "Enter a positive monthly fee.";
  }
  if (
    form.oneTimeFee.trim() === "" ||
    !Number.isFinite(Number(form.oneTimeFee)) ||
    Number(form.oneTimeFee) < 0
  ) {
    errors.oneTimeFee = "Enter zero or a positive one-time fee.";
  }
  if (
    form.vatPercent.trim() === "" ||
    !Number.isFinite(Number(form.vatPercent)) ||
    Number(form.vatPercent) < 0
  ) {
    errors.vatPercent = "Enter zero or a positive VAT percentage.";
  }
  if (form.includeEmployeeTracking && !isPositive(form.trackingFeePerEmployee)) {
    errors.trackingFeePerEmployee = "Enter a positive per-employee tracking fee.";
  }

  return errors;
}

export default function SlaBuilderForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setPdfError(null);
  }

  function toggleFeature(label: string) {
    const next = form.selectedFeatures.includes(label)
      ? form.selectedFeatures.filter((feature) => feature !== label)
      : [...form.selectedFeatures, label];
    update("selectedFeatures", next);
  }

  function prepareDetails(): SlaDetails | null {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return null;
    }

    const details: SlaDetails = {
      clientName: form.clientName.trim(),
      clientAddress: form.clientAddress.trim(),
      agreementDate: form.agreementDate,
      selectedFeatures: form.selectedFeatures,
      employeeCount: Number(form.employeeCount),
      monthlyFee: Number(form.monthlyFee),
      oneTimeFee: Number(form.oneTimeFee),
      vatPercent: Number(form.vatPercent),
      includeEmployeeTracking: form.includeEmployeeTracking,
      trackingFeePerEmployee: form.includeEmployeeTracking
        ? Number(form.trackingFeePerEmployee)
        : undefined,
      clientCeoName: form.clientCeoName.trim(),
      clientCeoTitle: form.clientCeoTitle.trim(),
      clientHrHeadName: form.clientHrHeadName.trim(),
      clientHrHeadTitle: form.clientHrHeadTitle.trim(),
      shomvobPocName: form.shomvobPocName.trim(),
      shomvobPocTitle: form.shomvobPocTitle.trim(),
    };

    saveSlaDetails(details);
    return details;
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prepareDetails()) return;
    window.open("/sla-preview", "_blank", "noopener,noreferrer");
  }

  function handlePrint() {
    if (!prepareDetails()) return;
    window.open("/sla-preview?print=1", "_blank", "noopener,noreferrer");
  }

  async function handleDownload() {
    const details = prepareDetails();
    if (!details) return;

    setIsDownloading(true);
    setPdfError(null);

    try {
      const response = await fetch("/api/export-pdf-sla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${window.location.origin}/sla-preview`,
          slaDetails: details,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = buildSuggestedSlaPdfFileName(details.clientName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Failed to generate PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  const invalid = (key: keyof FormState) => Boolean(errors[key]);

  return (
    <form onSubmit={handlePreview} className="space-y-6" noValidate>
      <SectionCard number="1" title="Agreement and client details">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="clientName" label="Client legal name *" error={errors.clientName}>
            <input
              id="clientName"
              value={form.clientName}
              onChange={(event) => update("clientName", event.target.value)}
              className={inputClass}
              placeholder="Example Company Limited"
              aria-invalid={invalid("clientName")}
            />
          </Field>
          <Field id="agreementDate" label="Agreement date *" error={errors.agreementDate}>
            <input
              id="agreementDate"
              type="date"
              value={form.agreementDate}
              onChange={(event) => update("agreementDate", event.target.value)}
              className={inputClass}
              aria-invalid={invalid("agreementDate")}
            />
          </Field>
          <div className="md:col-span-2">
            <Field id="clientAddress" label="Client operational address *" error={errors.clientAddress}>
              <textarea
                id="clientAddress"
                rows={3}
                value={form.clientAddress}
                onChange={(event) => update("clientAddress", event.target.value)}
                className={inputClass}
                placeholder="Full registered or operational address"
                aria-invalid={invalid("clientAddress")}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard number="2" title="System features">
        <p className="mb-4 text-sm text-white/60">
          Selected modules will appear as the System Features list in Article 1.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULE_HIGHLIGHTS.map(({ id, label }) => {
            const checked = form.selectedFeatures.includes(label);
            return (
              <label
                key={id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  checked
                    ? "border-[#28a143]/60 bg-[#28a143]/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFeature(label)}
                  className="h-4 w-4 accent-[#28a143]"
                />
                {label}
              </label>
            );
          })}
        </div>
        {errors.selectedFeatures ? <p className={errorClass}>{errors.selectedFeatures}</p> : null}
      </SectionCard>

      <SectionCard number="3" title="Fees and payment">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="employeeCount" label="Employee count *" error={errors.employeeCount}>
            <input
              id="employeeCount"
              type="number"
              min="1"
              step="1"
              value={form.employeeCount}
              onChange={(event) => update("employeeCount", event.target.value)}
              className={inputClass}
              placeholder="250"
              aria-invalid={invalid("employeeCount")}
            />
          </Field>
          <Field id="monthlyFee" label="Total monthly subscription fee (BDT) *" error={errors.monthlyFee}>
            <input
              id="monthlyFee"
              type="number"
              min="0"
              value={form.monthlyFee}
              onChange={(event) => update("monthlyFee", event.target.value)}
              className={inputClass}
              placeholder="50000"
              aria-invalid={invalid("monthlyFee")}
            />
          </Field>
          <Field id="oneTimeFee" label="One-time rollout and training fee (BDT) *" error={errors.oneTimeFee}>
            <input
              id="oneTimeFee"
              type="number"
              min="0"
              value={form.oneTimeFee}
              onChange={(event) => update("oneTimeFee", event.target.value)}
              className={inputClass}
              placeholder="25000"
              aria-invalid={invalid("oneTimeFee")}
            />
          </Field>
          <Field id="vatPercent" label="VAT percentage *" error={errors.vatPercent}>
            <input
              id="vatPercent"
              type="number"
              min="0"
              step="0.01"
              value={form.vatPercent}
              onChange={(event) => update("vatPercent", event.target.value)}
              className={inputClass}
              aria-invalid={invalid("vatPercent")}
            />
          </Field>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-white/90">
            <input
              type="checkbox"
              checked={form.includeEmployeeTracking}
              onChange={(event) => update("includeEmployeeTracking", event.target.checked)}
              className="h-4 w-4 accent-[#28a143]"
            />
            Include employee tracking
          </label>
          {form.includeEmployeeTracking ? (
            <div className="mt-4 max-w-sm">
              <Field
                id="trackingFeePerEmployee"
                label="Tracking fee per employee (BDT) *"
                error={errors.trackingFeePerEmployee}
              >
                <input
                  id="trackingFeePerEmployee"
                  type="number"
                  min="0"
                  value={form.trackingFeePerEmployee}
                  onChange={(event) => update("trackingFeePerEmployee", event.target.value)}
                  className={inputClass}
                  placeholder="100"
                  aria-invalid={invalid("trackingFeePerEmployee")}
                />
              </Field>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard number="4" title="Authorized signatories">
        <div className="grid gap-6 md:grid-cols-2">
          <Field id="clientCeoName" label="Client CEO name *" error={errors.clientCeoName}>
            <input id="clientCeoName" value={form.clientCeoName} onChange={(event) => update("clientCeoName", event.target.value)} className={inputClass} aria-invalid={invalid("clientCeoName")} />
          </Field>
          <Field id="clientCeoTitle" label="Client CEO title *" error={errors.clientCeoTitle}>
            <input id="clientCeoTitle" value={form.clientCeoTitle} onChange={(event) => update("clientCeoTitle", event.target.value)} className={inputClass} aria-invalid={invalid("clientCeoTitle")} />
          </Field>
          <Field id="clientHrHeadName" label="Client HR head name *" error={errors.clientHrHeadName}>
            <input id="clientHrHeadName" value={form.clientHrHeadName} onChange={(event) => update("clientHrHeadName", event.target.value)} className={inputClass} aria-invalid={invalid("clientHrHeadName")} />
          </Field>
          <Field id="clientHrHeadTitle" label="Client HR head title *" error={errors.clientHrHeadTitle}>
            <input id="clientHrHeadTitle" value={form.clientHrHeadTitle} onChange={(event) => update("clientHrHeadTitle", event.target.value)} className={inputClass} aria-invalid={invalid("clientHrHeadTitle")} />
          </Field>
          <Field id="shomvobPocName" label="Shomvob POC name *" error={errors.shomvobPocName}>
            <input id="shomvobPocName" value={form.shomvobPocName} onChange={(event) => update("shomvobPocName", event.target.value)} className={inputClass} aria-invalid={invalid("shomvobPocName")} />
          </Field>
          <Field id="shomvobPocTitle" label="Shomvob POC title *" error={errors.shomvobPocTitle}>
            <input id="shomvobPocTitle" value={form.shomvobPocTitle} onChange={(event) => update("shomvobPocTitle", event.target.value)} className={inputClass} aria-invalid={invalid("shomvobPocTitle")} />
          </Field>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <button type="button" onClick={handlePrint} className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
          Print as PDF
        </button>
        <button type="button" onClick={handleDownload} disabled={isDownloading} className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
          {isDownloading ? "Generating PDF…" : "Download PDF"}
        </button>
        <button type="submit" className="rounded-xl bg-[#edb713] px-7 py-3.5 text-sm font-bold text-[#0c3d20] transition hover:bg-[#f5c832]">
          Preview SLA
        </button>
      </div>

      {pdfError ? (
        <p role="alert" className="text-right text-sm font-medium text-[#ff9b9b]">
          Could not generate PDF: {pdfError}
        </p>
      ) : null}
    </form>
  );
}
