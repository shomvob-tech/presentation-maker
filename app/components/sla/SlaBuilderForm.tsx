"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { MODULE_HIGHLIGHTS } from "@/lib/module-highlights";
import {
  arrayDelta,
  beginDraft,
  bumpPreviewCount,
  currentDraft,
  diffAgainstSnapshot,
  logEvent,
  markInput,
} from "@/lib/audit/client";
import {
  buildSuggestedSlaPdfFileName,
  DEFAULT_SHOMVOB_SIGNATORY,
  saveSlaDetails,
  type SlaDetails,
} from "@/lib/sla-session";

/** A signatory row in the form. `id` is a stable React key + input-id prefix,
 * so adding or removing a row never shuffles focus into the wrong input. */
type SignatoryRow = {
  id: string;
  name: string;
  title: string;
};

type SignatorySide = "client" | "shomvob";
type SignatoryField = "name" | "title";

/** Each side keeps at least one representative and no more than this — the
 * document's two-column signature grid has to stay on a single page. */
const MIN_SIGNATORIES = 1;
const MAX_SIGNATORIES = 4;

const SIDE_FIELD: Record<SignatorySide, "clientSignatories" | "shomvobSignatories"> = {
  client: "clientSignatories",
  shomvob: "shomvobSignatories",
};

/** Rows added at runtime continue past the fixed ids below. Initial ids are
 * hardcoded rather than generated so server and client markup match. */
let signatoryIdSeed = 2;

function nextSignatoryId(side: SignatorySide): string {
  signatoryIdSeed += 1;
  return `${side}-${signatoryIdSeed}`;
}

function emptyRow(side: SignatorySide): SignatoryRow {
  return { id: nextSignatoryId(side), name: "", title: "" };
}

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
  clientSignatories: SignatoryRow[];
  shomvobSignatories: SignatoryRow[];
};

type FormErrors = Partial<Record<keyof FormState, string>>;
/** Keyed by row id — row ids are unique across both sides. */
type SignatoryErrors = Record<string, Partial<Record<SignatoryField, string>>>;

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
  clientSignatories: [
    { id: "client-1", name: "", title: "" },
    { id: "client-2", name: "", title: "" },
  ],
  shomvobSignatories: [
    { id: "shomvob-1", ...DEFAULT_SHOMVOB_SIGNATORY },
    { id: "shomvob-2", name: "", title: "" },
  ],
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

function validate(form: FormState): {
  errors: FormErrors;
  signatoryErrors: SignatoryErrors;
} {
  const errors: FormErrors = {};
  const requiredText: (keyof FormState)[] = [
    "clientName",
    "clientAddress",
    "agreementDate",
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

  // Every row that exists has to be filled in — a rep who doesn't need a
  // second signatory removes the row rather than leaving it blank.
  const signatoryErrors: SignatoryErrors = {};
  for (const row of [...form.clientSignatories, ...form.shomvobSignatories]) {
    const rowErrors: Partial<Record<SignatoryField, string>> = {};
    if (!row.name.trim()) rowErrors.name = "Name is required.";
    if (!row.title.trim()) rowErrors.title = "Title is required.";
    if (Object.keys(rowErrors).length > 0) signatoryErrors[row.id] = rowErrors;
  }

  return { errors, signatoryErrors };
}

function SignatoryGroup({
  side,
  heading,
  hint,
  rows,
  errors,
  onFieldChange,
  onAdd,
  onRemove,
}: {
  side: SignatorySide;
  heading: string;
  hint: string;
  rows: SignatoryRow[];
  errors: SignatoryErrors;
  onFieldChange: (side: SignatorySide, id: string, field: SignatoryField, value: string) => void;
  onAdd: (side: SignatorySide) => void;
  onRemove: (side: SignatorySide, id: string) => void;
}) {
  const atMax = rows.length >= MAX_SIGNATORIES;
  const atMin = rows.length <= MIN_SIGNATORIES;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#8be9a5]">
            {heading}
          </h3>
          <p className="mt-1 text-xs text-white/50">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => onAdd(side)}
          disabled={atMax}
          title={atMax ? `Up to ${MAX_SIGNATORIES} representatives per side.` : undefined}
          className="rounded-lg border border-[#5cd47e]/45 bg-[#28a143]/12 px-3.5 py-2 text-xs font-semibold text-[#8be9a5] transition hover:border-[#5cd47e] hover:bg-[#28a143]/22 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-white/30"
        >
          + Add representative
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const rowErrors = errors[row.id] ?? {};
          return (
            <div
              key={row.id}
              className="signatory-row-in rounded-lg border border-white/10 bg-white/[0.04] p-3.5"
            >
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Representative {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(side, row.id)}
                  disabled={atMin}
                  title={
                    atMin
                      ? "At least one representative is required on each side."
                      : `Remove representative ${index + 1}`
                  }
                  className="rounded-md px-2 py-1 text-xs font-semibold text-[#ff9b9b] transition hover:bg-[#ff9b9b]/12 disabled:cursor-not-allowed disabled:text-white/25 disabled:hover:bg-transparent"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  id={`${row.id}-name`}
                  label="Full name *"
                  error={rowErrors.name}
                >
                  <input
                    id={`${row.id}-name`}
                    value={row.name}
                    onChange={(event) =>
                      onFieldChange(side, row.id, "name", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Full name"
                    aria-invalid={Boolean(rowErrors.name)}
                  />
                </Field>
                <Field
                  id={`${row.id}-title`}
                  label="Title / designation *"
                  error={rowErrors.title}
                >
                  <input
                    id={`${row.id}-title`}
                    value={row.title}
                    onChange={(event) =>
                      onFieldChange(side, row.id, "title", event.target.value)
                    }
                    className={inputClass}
                    placeholder="e.g. Managing Director"
                    aria-invalid={Boolean(rowErrors.title)}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-white/40">
        {rows.length} of {MAX_SIGNATORIES} signature lines used
        {atMax ? " — remove one to add a different signatory." : ""}
      </p>
    </div>
  );
}

export default function SlaBuilderForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [signatoryErrors, setSignatoryErrors] = useState<SignatoryErrors>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  /** Row id whose name input should take focus — set right after "Add", then
   * consumed by the effect below once the new row is in the DOM. A ref rather
   * than state: focusing is a DOM side effect, not something we render from. */
  const pendingFocusRowId = useRef<string | null>(null);
  /** Strict Mode mounts effects twice in dev — see the proposal builder. */
  const hasLoggedOpen = useRef(false);

  useEffect(() => {
    const rowId = pendingFocusRowId.current;
    if (!rowId) return;
    pendingFocusRowId.current = null;
    document.getElementById(`${rowId}-name`)?.focus();
  });

  // One visit to the builder is one draft — the form always mounts blank.
  useEffect(() => {
    if (hasLoggedOpen.current) return;
    hasLoggedOpen.current = true;

    beginDraft("sla");
    logEvent("builder_opened", "sla");
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (markInput("sla")) logEvent("form_touched", "sla");

    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setPdfError(null);
  }

  function updateSignatory(
    side: SignatorySide,
    id: string,
    field: SignatoryField,
    value: string,
  ) {
    if (markInput("sla")) logEvent("form_touched", "sla");

    const key = SIDE_FIELD[side];
    setForm((current) => ({
      ...current,
      [key]: current[key].map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }));
    setSignatoryErrors((current) => {
      const rowErrors = current[id];
      if (!rowErrors?.[field]) return current;

      const remaining = { ...rowErrors };
      delete remaining[field];

      const next = { ...current };
      if (Object.keys(remaining).length === 0) delete next[id];
      else next[id] = remaining;
      return next;
    });
    setPdfError(null);
  }

  function addSignatory(side: SignatorySide) {
    const key = SIDE_FIELD[side];
    if (form[key].length >= MAX_SIGNATORIES) return;

    const row = emptyRow(side);
    setForm((current) => ({ ...current, [key]: [...current[key], row] }));
    pendingFocusRowId.current = row.id;
    setPdfError(null);
  }

  function removeSignatory(side: SignatorySide, id: string) {
    const key = SIDE_FIELD[side];
    if (form[key].length <= MIN_SIGNATORIES) return;

    setForm((current) => ({
      ...current,
      [key]: current[key].filter((row) => row.id !== id),
    }));
    setSignatoryErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
    setPdfError(null);
  }

  function toggleFeature(label: string) {
    const next = form.selectedFeatures.includes(label)
      ? form.selectedFeatures.filter((feature) => feature !== label)
      : [...form.selectedFeatures, label];
    update("selectedFeatures", next);
  }

  function prepareDetails(): SlaDetails | null {
    const { errors: nextErrors, signatoryErrors: nextSignatoryErrors } =
      validate(form);
    setErrors(nextErrors);
    setSignatoryErrors(nextSignatoryErrors);

    if (
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextSignatoryErrors).length > 0
    ) {
      // The invalid fields only get aria-invalid on the next render, so let
      // that commit land before hunting for the first one — otherwise the very
      // first submit finds nothing and the rep is left staring at an unchanged
      // page. A timeout rather than requestAnimationFrame: frames are paused
      // in a background tab, timers still fire.
      setTimeout(() => {
        const firstInvalid =
          document.querySelector<HTMLElement>("[aria-invalid='true']");
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid?.focus({ preventScroll: true });
      }, 0);

      logEvent("validation_failed", "sla", {
        client_name: form.clientName.trim(),
        validation_failed_fields: [
          ...Object.keys(nextErrors),
          // Signatory errors are keyed by row id, which says nothing useful —
          // report them as one field so the counts stay comparable.
          ...(Object.keys(nextSignatoryErrors).length > 0
            ? ["signatories"]
            : []),
        ].join(", "),
      });
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
      clientSignatories: form.clientSignatories.map(({ name, title }) => ({
        name: name.trim(),
        title: title.trim(),
      })),
      shomvobSignatories: form.shomvobSignatories.map(({ name, title }) => ({
        name: name.trim(),
        title: title.trim(),
      })),
    };

    saveSlaDetails(details);
    return details;
  }

  /** Shared shape for the SLA rows — the fee/feature columns of the schema. */
  function slaRowFields(details: SlaDetails) {
    return {
      client_name: details.clientName,
      employee_count: details.employeeCount,
      mrc_fee: details.monthlyFee,
      module_count: details.selectedFeatures.length,
      modules: details.selectedFeatures.join(", "),
    };
  }

  function logSlaPreviewed(details: SlaDetails) {
    const { added, removed } = arrayDelta(
      details.selectedFeatures,
      DEFAULT_FEATURES,
    );

    const optionalSections = [
      details.includeEmployeeTracking ? "employee_tracking" : null,
      details.oneTimeFee > 0 ? "one_time_fee" : null,
      details.clientSignatories.length > 1 ||
      details.shomvobSignatories.length > 1
        ? "extra_signatories"
        : null,
    ].filter((section): section is string => section !== null);

    const snapshot = details as unknown as Record<string, unknown>;

    logEvent("previewed", "sla", {
      ...slaRowFields(details),
      preview_count: bumpPreviewCount("sla"),
      modules_added_vs_default: added.join(", "),
      modules_removed_vs_default: removed.join(", "),
      optional_sections: optionalSections.join(", "),
      fields_changed_since_last_preview: diffAgainstSnapshot(
        "sla",
        snapshot,
      ).join(", "),
      payload_json: JSON.stringify(details),
    });
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const details = prepareDetails();
    if (!details) return;

    logSlaPreviewed(details);
    window.open("/sla-preview", "_blank", "noopener,noreferrer");
  }

  function handlePrint() {
    const details = prepareDetails();
    if (!details) return;

    // As on the proposal side, the OS print dialog never reports back whether
    // the rep saved or cancelled.
    logEvent("export_clicked", "sla", {
      ...slaRowFields(details),
      export_method: "print",
    });
    window.open("/sla-preview?print=1", "_blank", "noopener,noreferrer");
  }

  async function handleDownload() {
    const details = prepareDetails();
    if (!details) return;

    setIsDownloading(true);
    setPdfError(null);
    logEvent("export_clicked", "sla", {
      ...slaRowFields(details),
      export_method: "api",
    });

    try {
      const response = await fetch("/api/export-pdf-sla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${window.location.origin}/sla-preview`,
          slaDetails: details,
          // Joins the server's export_result row to this draft.
          auditDraftId: currentDraft("sla").draftId,
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
        <p className="mb-5 text-sm text-white/60">
          Each representative below becomes one signature line in Article 13 —
          add or remove rows so both sides match who is actually signing.
        </p>
        <div className="space-y-5">
          <SignatoryGroup
            side="client"
            heading="For the Client"
            hint="Whoever signs on the client's behalf."
            rows={form.clientSignatories}
            errors={signatoryErrors}
            onFieldChange={updateSignatory}
            onAdd={addSignatory}
            onRemove={removeSignatory}
          />
          <SignatoryGroup
            side="shomvob"
            heading="For Shomvob Technologies Ltd"
            hint="Pre-filled with Hasib Rahman — edit or remove as needed."
            rows={form.shomvobSignatories}
            errors={signatoryErrors}
            onFieldChange={updateSignatory}
            onAdd={addSignatory}
            onRemove={removeSignatory}
          />
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
