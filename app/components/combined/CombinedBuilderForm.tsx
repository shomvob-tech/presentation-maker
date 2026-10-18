"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  arrayDelta,
  beginDraft,
  bumpPreviewCount,
  currentDraft,
  diffAgainstSnapshot,
  logEvent,
  markInput,
} from "@/lib/audit/client";
import Richtexteditor from "@/app/components/Richtexteditor";
import { DEFAULT_UOM, DEVICE_PRESETS, findPreset } from "@/lib/device-catalog";
import { formatQuoteAmount, lineTotal } from "@/lib/device-quote";
import {
  hasProblemStatementContent,
  SELECTABLE_MODULES,
} from "@/lib/module-page-layout";
import {
  firstInvoiceTotal,
  monthlyTotal,
  oneTimeTotal,
} from "@/lib/combined-quote";
import {
  buildSuggestedCombinedPdfFileName,
  DEFAULT_COMBINED_DOCUMENT_TITLE,
  DEFAULT_COMBINED_VALIDITY_DAYS,
  saveCombinedDetails,
  saveCombinedLogo,
  type CombinedProposalDetails,
} from "@/lib/combined-session";
import {
  DEFAULT_DELIVERY_CITY,
  DEFAULT_DELIVERY_LEAD_TIME,
  DEFAULT_KEY_BENEFITS,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_WARRANTY_PERIOD,
  type DeviceLineItem,
} from "@/lib/device-session";
import { fileToDataUrl } from "@/lib/presentation-session";
// Shared with the HRIS-only builder so `modules_added_vs_default` stays
// comparable between the two flows.
import { DEFAULT_SELECTED_MODULE_IDS } from "@/lib/proposal-defaults";

/** A quotation row while it is being edited — numbers stay strings so a
 * half-typed "1." does not become NaN mid-keystroke. */
type LineItemRow = {
  id: string;
  description: string;
  brand: string;
  modelNo: string;
  uom: string;
  quantity: string;
  unitPrice: string;
};

type FormState = {
  clientName: string;
  documentTitle: string;
  preparedDate: string;

  recipientName: string;
  recipientTitle: string;
  letterAddresseeName: string;
  meetingDateReference: string;
  keyBenefits: string[];

  problemStatementHeading: string;
  /** HTML from Richtexteditor, not plain text. */
  problemStatementText: string;
  selectedModules: string[];

  employeeCount: string;
  mrcFee: string;
  includeRolloutCharge: boolean;
  rolloutCharge: string;
  includeFieldTracking: boolean;
  fieldTrackingFee: string;

  lineItems: LineItemRow[];

  validityDays: string;
  vatPercent: string;
  warrantyPeriod: string;
  paymentTerms: string;
  deliveryCity: string;
  deliveryLeadTime: string;

  preparedByName: string;
  preparedByTitle: string;
  preparedByPhone: string;
  preparedByEmail: string;
};

type FormErrors = Partial<Record<keyof FormState | "logo", string>>;
/** Keyed by row id. */
type LineItemErrors = Record<string, Partial<Record<keyof LineItemRow, string>>>;

const MIN_LINE_ITEMS = 1;
/**
 * The commercial table is one page and also carries the HRIS rows, so the
 * hardware half has less room than in the standalone device quotation.
 *
 * Six is measured, not guessed. A data row averages 12.6mm once its
 * description wraps to a second line, and in the worst case — field tracking
 * and a rollout charge both switched on — the page has room for nine data
 * rows before the totals block would be clipped. Two of those are the
 * recurring rows and one is the rollout charge, which leaves six for
 * hardware. The page clips silently rather than spilling, so this cap is the
 * only thing standing between a long quotation and a truncated total.
 */
const MAX_LINE_ITEMS = 6;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const DEFAULT_PROBLEM_STATEMENT_HEADING = "Solving Your Specific Challenge";

/** Runtime ids continue past the seeded row, so server and client markup
 * match on first render. */
let lineItemIdSeed = 1;

function nextLineItemId(): string {
  lineItemIdSeed += 1;
  return `citem-${lineItemIdSeed}`;
}

function rowFromPreset(presetId: string, id: string): LineItemRow {
  const preset = findPreset(presetId);

  return {
    id,
    description: preset?.description ?? "",
    brand: preset?.brand ?? "",
    modelNo: preset?.modelNo ?? "",
    uom: preset?.uom ?? DEFAULT_UOM,
    quantity: "1",
    unitPrice: preset ? String(preset.unitPrice) : "",
  };
}

function todayAsDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

const initialForm: FormState = {
  clientName: "",
  documentTitle: DEFAULT_COMBINED_DOCUMENT_TITLE,
  preparedDate: todayAsDateInputValue(),

  recipientName: "",
  recipientTitle: "",
  letterAddresseeName: "",
  meetingDateReference: "",
  keyBenefits: [...DEFAULT_KEY_BENEFITS],

  problemStatementHeading: DEFAULT_PROBLEM_STATEMENT_HEADING,
  problemStatementText: "",
  selectedModules: [...DEFAULT_SELECTED_MODULE_IDS],

  employeeCount: "",
  mrcFee: "",
  includeRolloutCharge: false,
  rolloutCharge: "",
  includeFieldTracking: false,
  fieldTrackingFee: "",

  // Seeded with the access-control device — every device quotation starts
  // with one, and a blank grid is a worse starting point than a row to edit.
  lineItems: [rowFromPreset(DEVICE_PRESETS[0].id, "citem-1")],

  validityDays: String(DEFAULT_COMBINED_VALIDITY_DAYS),
  vatPercent: "0",
  warrantyPeriod: DEFAULT_WARRANTY_PERIOD,
  paymentTerms: DEFAULT_PAYMENT_TERMS,
  deliveryCity: DEFAULT_DELIVERY_CITY,
  deliveryLeadTime: DEFAULT_DELIVERY_LEAD_TIME,

  preparedByName: "",
  preparedByTitle: "",
  preparedByPhone: "",
  preparedByEmail: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#5cd47e] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#28a143]/25";
const compactInputClass =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#5cd47e] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#28a143]/25";
const labelClass = "text-sm font-semibold text-white/90";
const compactLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-white/55";
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
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-white/50">{hint}</p> : null}
      {error ? <p className={errorClass}>{error}</p> : null}
    </div>
  );
}

function isPositive(value: string): boolean {
  const number = Number(value);
  return value.trim() !== "" && Number.isFinite(number) && number > 0;
}

function isZeroOrMore(value: string): boolean {
  const number = Number(value);
  return value.trim() !== "" && Number.isFinite(number) && number >= 0;
}

function numberOr(value: string, fallback: number): number {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : fallback;
}

function validate(form: FormState): {
  errors: FormErrors;
  lineItemErrors: LineItemErrors;
} {
  const errors: FormErrors = {};
  const requiredText: (keyof FormState)[] = [
    "clientName",
    "documentTitle",
    "preparedDate",
    "warrantyPeriod",
    "paymentTerms",
    "deliveryCity",
    "deliveryLeadTime",
  ];

  for (const key of requiredText) {
    if (!String(form[key]).trim()) errors[key] = "This field is required.";
  }

  if (!isPositive(form.employeeCount) || !Number.isInteger(Number(form.employeeCount))) {
    errors.employeeCount = "Enter a positive whole number of employees.";
  }
  if (!isPositive(form.mrcFee)) {
    errors.mrcFee = "Enter the monthly subscription fee (BDT).";
  }
  if (form.includeRolloutCharge && !isPositive(form.rolloutCharge)) {
    errors.rolloutCharge = "Enter the rollout charge, or turn this off.";
  }
  if (form.includeFieldTracking && !isPositive(form.fieldTrackingFee)) {
    errors.fieldTrackingFee = "Enter a per-user fee, or turn this off.";
  }
  if (!isZeroOrMore(form.vatPercent)) {
    errors.vatPercent = "Enter zero or a positive VAT percentage.";
  }
  if (
    form.validityDays.trim() &&
    (!isPositive(form.validityDays) || !Number.isInteger(Number(form.validityDays)))
  ) {
    errors.validityDays = "Enter a positive whole number of days.";
  }

  // Module selection has nothing to validate — any count from zero to the
  // full catalogue lays out correctly (see lib/module-page-layout.ts).

  const lineItemErrors: LineItemErrors = {};
  for (const row of form.lineItems) {
    const rowErrors: Partial<Record<keyof LineItemRow, string>> = {};

    if (!row.description.trim()) rowErrors.description = "Required.";
    if (!row.uom.trim()) rowErrors.uom = "Required.";
    if (!isPositive(row.quantity) || !Number.isInteger(Number(row.quantity))) {
      rowErrors.quantity = "Whole number.";
    }
    if (!isZeroOrMore(row.unitPrice)) rowErrors.unitPrice = "0 or more.";

    if (Object.keys(rowErrors).length > 0) lineItemErrors[row.id] = rowErrors;
  }

  return { errors, lineItemErrors };
}

function LineItemEditor({
  rows,
  errors,
  onFieldChange,
  onRemove,
}: {
  rows: LineItemRow[];
  errors: LineItemErrors;
  onFieldChange: (id: string, field: keyof LineItemRow, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const atMin = rows.length <= MIN_LINE_ITEMS;

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const rowErrors = errors[row.id] ?? {};
        const total = lineTotal({
          quantity: Number(row.quantity),
          unitPrice: Number(row.unitPrice),
        });

        return (
          <div
            key={row.id}
            className="signatory-row-in rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8be9a5]">
                Item {index + 1}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/50">
                  Line total{" "}
                  <b className="text-white/80">{formatQuoteAmount(total)}</b> BDT
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(row.id)}
                  disabled={atMin}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-[#ff9b9b]/50 hover:text-[#ff9b9b] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-6">
              <div className="md:col-span-6">
                <label htmlFor={`${row.id}-description`} className={compactLabelClass}>
                  Description *
                </label>
                <input
                  id={`${row.id}-description`}
                  value={row.description}
                  onChange={(event) =>
                    onFieldChange(row.id, "description", event.target.value)
                  }
                  className={compactInputClass}
                  placeholder="Biometric Access Control (Face, Finger and Card)"
                  aria-invalid={Boolean(rowErrors.description)}
                />
                {rowErrors.description ? (
                  <p className={errorClass}>{rowErrors.description}</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label htmlFor={`${row.id}-brand`} className={compactLabelClass}>
                  Brand
                </label>
                <input
                  id={`${row.id}-brand`}
                  value={row.brand}
                  onChange={(event) => onFieldChange(row.id, "brand", event.target.value)}
                  className={compactInputClass}
                  placeholder="ZKTeco"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor={`${row.id}-modelNo`} className={compactLabelClass}>
                  Model no
                </label>
                <input
                  id={`${row.id}-modelNo`}
                  value={row.modelNo}
                  onChange={(event) => onFieldChange(row.id, "modelNo", event.target.value)}
                  className={compactInputClass}
                  placeholder="SanseFace 2A"
                />
              </div>

              <div>
                <label htmlFor={`${row.id}-uom`} className={compactLabelClass}>
                  UoM *
                </label>
                <input
                  id={`${row.id}-uom`}
                  value={row.uom}
                  onChange={(event) => onFieldChange(row.id, "uom", event.target.value)}
                  className={compactInputClass}
                  placeholder={DEFAULT_UOM}
                  aria-invalid={Boolean(rowErrors.uom)}
                />
                {rowErrors.uom ? <p className={errorClass}>{rowErrors.uom}</p> : null}
              </div>

              <div>
                <label htmlFor={`${row.id}-quantity`} className={compactLabelClass}>
                  Qnty *
                </label>
                <input
                  id={`${row.id}-quantity`}
                  type="number"
                  min="1"
                  step="1"
                  value={row.quantity}
                  onChange={(event) => onFieldChange(row.id, "quantity", event.target.value)}
                  className={compactInputClass}
                  aria-invalid={Boolean(rowErrors.quantity)}
                />
                {rowErrors.quantity ? (
                  <p className={errorClass}>{rowErrors.quantity}</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label htmlFor={`${row.id}-unitPrice`} className={compactLabelClass}>
                  Unit price (BDT) *
                </label>
                <input
                  id={`${row.id}-unitPrice`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.unitPrice}
                  onChange={(event) => onFieldChange(row.id, "unitPrice", event.target.value)}
                  className={compactInputClass}
                  placeholder="12000"
                  aria-invalid={Boolean(rowErrors.unitPrice)}
                />
                {rowErrors.unitPrice ? (
                  <p className={errorClass}>{rowErrors.unitPrice}</p>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CombinedBuilderForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [lineItemErrors, setLineItemErrors] = useState<LineItemErrors>({});
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const pendingFocusRowId = useRef<string | null>(null);
  /** Strict Mode mounts effects twice in dev — see the other three builders. */
  const hasLoggedOpen = useRef(false);

  useEffect(() => {
    const rowId = pendingFocusRowId.current;
    if (!rowId) return;
    pendingFocusRowId.current = null;
    document.getElementById(`${rowId}-description`)?.focus();
  });

  // One visit to the builder is one draft — the form always mounts blank.
  useEffect(() => {
    if (hasLoggedOpen.current) return;
    hasLoggedOpen.current = true;

    beginDraft("combined");
    logEvent("builder_opened", "combined");
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (markInput("combined")) logEvent("form_touched", "combined");

    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setPdfError(null);
  }

  function updateLineItem(id: string, field: keyof LineItemRow, value: string) {
    if (markInput("combined")) logEvent("form_touched", "combined");

    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    }));
    setLineItemErrors((current) => {
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

  function addLineItem(presetId: string) {
    if (form.lineItems.length >= MAX_LINE_ITEMS) return;

    const row = rowFromPreset(presetId, nextLineItemId());
    setForm((current) => ({ ...current, lineItems: [...current.lineItems, row] }));
    pendingFocusRowId.current = row.id;
    setPdfError(null);
  }

  function removeLineItem(id: string) {
    if (form.lineItems.length <= MIN_LINE_ITEMS) return;

    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.filter((row) => row.id !== id),
    }));
    setLineItemErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
    setPdfError(null);
  }

  function toggleBenefit(benefit: string) {
    const next = form.keyBenefits.includes(benefit)
      ? form.keyBenefits.filter((entry) => entry !== benefit)
      : // Re-adding keeps the source proposal's order rather than appending,
        // so the letter reads the same however the boxes were clicked.
        DEFAULT_KEY_BENEFITS.filter(
          (entry) => form.keyBenefits.includes(entry) || entry === benefit,
        );

    update("keyBenefits", next);
  }

  function toggleModule(id: string) {
    const next = form.selectedModules.includes(id)
      ? form.selectedModules.filter((entry) => entry !== id)
      : SELECTABLE_MODULES.filter(
          (module) => form.selectedModules.includes(module.id) || module.id === id,
        ).map((module) => module.id);

    update("selectedModules", next);
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_LOGO_BYTES) {
      setErrors((current) => ({ ...current, logo: "Logo must be under 2 MB." }));
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setLogoDataUrl(dataUrl);
      setLogoFileName(file.name);
      setErrors((current) => ({ ...current, logo: undefined }));
    } catch {
      setErrors((current) => ({ ...current, logo: "Could not read that file." }));
    }
  }

  function clearLogo() {
    setLogoDataUrl(null);
    setLogoFileName(null);
    setErrors((current) => ({ ...current, logo: undefined }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function toLineItems(): DeviceLineItem[] {
    return form.lineItems.map((row) => ({
      id: row.id,
      description: row.description.trim(),
      brand: row.brand.trim() || "N/A",
      modelNo: row.modelNo.trim() || "N/A",
      uom: row.uom.trim(),
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
    }));
  }

  /** Current form as a details object — used both for the running totals and,
   * after validation passes, as what gets saved. */
  function toDetails(): CombinedProposalDetails {
    return {
      clientName: form.clientName.trim(),
      documentTitle: form.documentTitle.trim(),
      preparedDate: form.preparedDate,

      recipientName: form.recipientName.trim() || undefined,
      recipientTitle: form.recipientTitle.trim() || undefined,
      letterAddresseeName: form.letterAddresseeName.trim() || undefined,
      meetingDateReference: form.meetingDateReference.trim() || undefined,
      keyBenefits: form.keyBenefits,

      preparedByName: form.preparedByName.trim() || undefined,
      preparedByTitle: form.preparedByTitle.trim() || undefined,
      preparedByPhone: form.preparedByPhone.trim() || undefined,
      preparedByEmail: form.preparedByEmail.trim() || undefined,

      problemStatementHeading: hasProblemStatementContent(form.problemStatementText)
        ? form.problemStatementHeading.trim() || DEFAULT_PROBLEM_STATEMENT_HEADING
        : undefined,
      problemStatementText: hasProblemStatementContent(form.problemStatementText)
        ? form.problemStatementText
        : undefined,
      selectedModules: form.selectedModules,
      validityDays: numberOr(form.validityDays, DEFAULT_COMBINED_VALIDITY_DAYS),

      employeeCount: numberOr(form.employeeCount, 0),
      mrcFee: numberOr(form.mrcFee, 0),
      fieldTrackingFee: form.includeFieldTracking
        ? numberOr(form.fieldTrackingFee, 0)
        : undefined,

      rolloutCharge: form.includeRolloutCharge
        ? numberOr(form.rolloutCharge, 0)
        : undefined,
      lineItems: toLineItems(),
      vatPercent: numberOr(form.vatPercent, 0),

      warrantyPeriod: form.warrantyPeriod.trim(),
      paymentTerms: form.paymentTerms.trim(),
      deliveryCity: form.deliveryCity.trim(),
      deliveryLeadTime: form.deliveryLeadTime.trim(),
    };
  }

  function prepareDetails(): CombinedProposalDetails | null {
    const { errors: nextErrors, lineItemErrors: nextLineItemErrors } = validate(form);
    setErrors(nextErrors);
    setLineItemErrors(nextLineItemErrors);

    if (
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextLineItemErrors).length > 0
    ) {
      // aria-invalid only lands on the next render, so let that commit before
      // hunting for the first invalid field. A timeout, not
      // requestAnimationFrame: frames pause in a background tab.
      setTimeout(() => {
        const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid?.focus({ preventScroll: true });
      }, 0);

      logEvent("validation_failed", "combined", {
        client_name: form.clientName.trim(),
        validation_failed_fields: [
          ...Object.keys(nextErrors),
          // Row errors are keyed by row id, which says nothing useful —
          // report them as one field so the counts stay comparable.
          ...(Object.keys(nextLineItemErrors).length > 0 ? ["line_items"] : []),
        ].join(", "),
      });
      return null;
    }

    const details = toDetails();
    saveCombinedDetails(details);
    saveCombinedLogo(logoDataUrl ?? undefined);
    return details;
  }

  /**
   * Shared columns for the combined rows.
   *
   * Unlike the device flow, this one does send `employee_count` and
   * `mrc_fee`: there is a genuine monthly recurring charge here, so both are
   * semantically what those columns mean.
   *
   * `modules` carries the HRIS module ids, NOT the hardware line items, so
   * the column stays directly comparable with the HRIS proposal's rows. The
   * hardware count and the totals ride along in `payload_json`.
   */
  function combinedRowFields(details: CombinedProposalDetails) {
    return {
      client_name: details.clientName,
      employee_count: details.employeeCount,
      mrc_fee: details.mrcFee,
      module_count: details.selectedModules.length,
      modules: details.selectedModules.join(", "),
    };
  }

  /** Which optional sections this proposal actually used. */
  function usedOptionalSections(details: CombinedProposalDetails): string[] {
    return [
      details.rolloutCharge !== undefined ? "rollout_charge" : null,
      details.fieldTrackingFee !== undefined ? "field_tracking" : null,
      details.problemStatementText ? "problem_statement" : null,
      details.preparedByName || details.preparedByEmail ? "prepared_by" : null,
      logoDataUrl ? "client_logo" : null,
      details.vatPercent > 0 ? "vat" : null,
      details.letterAddresseeName ? "letter_addressee" : null,
    ].filter((section): section is string => section !== null);
  }

  function logCombinedPreviewed(details: CombinedProposalDetails) {
    const { added, removed } = arrayDelta(
      details.selectedModules,
      DEFAULT_SELECTED_MODULE_IDS,
    );

    // The problem statement is Tiptap HTML. Its length is the useful part —
    // the markup would be a multi-kilobyte cell with no analytical value, and
    // /api/track drops the whole event over 32k characters. Same treatment as
    // the HRIS builder.
    const snapshot: Record<string, unknown> = {
      ...details,
      problemStatementText: undefined,
      problemStatementChars: details.problemStatementText?.length ?? 0,
      hardwareItemCount: details.lineItems.length,
      monthlyTotal: monthlyTotal(details),
      oneTimeTotal: oneTimeTotal(details),
    };

    logEvent("previewed", "combined", {
      ...combinedRowFields(details),
      preview_count: bumpPreviewCount("combined"),
      modules_added_vs_default: added.join(", "),
      modules_removed_vs_default: removed.join(", "),
      optional_sections: usedOptionalSections(details).join(", "),
      fields_changed_since_last_preview: diffAgainstSnapshot(
        "combined",
        snapshot,
      ).join(", "),
      payload_json: JSON.stringify(snapshot),
    });
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const details = prepareDetails();
    if (!details) return;

    logCombinedPreviewed(details);
    window.open("/combined-preview", "_blank", "noopener,noreferrer");
  }

  function handlePrint() {
    const details = prepareDetails();
    if (!details) return;

    // As on the other builders, the OS print dialog never reports back
    // whether the rep saved or cancelled.
    logEvent("export_clicked", "combined", {
      ...combinedRowFields(details),
      export_method: "print",
    });
    window.open("/combined-preview?print=1", "_blank", "noopener,noreferrer");
  }

  async function handleDownload() {
    const details = prepareDetails();
    if (!details) return;

    setIsDownloading(true);
    setPdfError(null);
    logEvent("export_clicked", "combined", {
      ...combinedRowFields(details),
      export_method: "api",
    });

    try {
      const response = await fetch("/api/export-pdf-combined", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${window.location.origin}/combined-preview`,
          combinedDetails: details,
          logoDataUrl: logoDataUrl ?? undefined,
          // Joins the server's export_result row to this draft.
          auditDraftId: currentDraft("combined").draftId,
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
      anchor.download = buildSuggestedCombinedPdfFileName(details.clientName);
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

  const previewDetails = toDetails();
  const previewMonthly = monthlyTotal(previewDetails);
  const previewOneTime = oneTimeTotal(previewDetails);
  const previewFirst = firstInvoiceTotal(previewDetails);
  const atMaxItems = form.lineItems.length >= MAX_LINE_ITEMS;

  return (
    <form onSubmit={handlePreview} className="space-y-6" noValidate>
      <SectionCard number="1" title="Client and cover details">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="clientName" label="Client name *" error={errors.clientName}>
            <input
              id="clientName"
              value={form.clientName}
              onChange={(event) => update("clientName", event.target.value)}
              className={inputClass}
              placeholder="Example Company Limited"
              aria-invalid={invalid("clientName")}
            />
          </Field>
          <Field id="preparedDate" label="Proposal date *" error={errors.preparedDate}>
            <input
              id="preparedDate"
              type="date"
              value={form.preparedDate}
              onChange={(event) => update("preparedDate", event.target.value)}
              className={inputClass}
              aria-invalid={invalid("preparedDate")}
            />
          </Field>
          <div className="md:col-span-2">
            <Field
              id="documentTitle"
              label="Document title *"
              error={errors.documentTitle}
              hint="Shown on the cover under the PROPOSAL eyebrow."
            >
              <input
                id="documentTitle"
                value={form.documentTitle}
                onChange={(event) => update("documentTitle", event.target.value)}
                className={inputClass}
                aria-invalid={invalid("documentTitle")}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className={labelClass}>Client logo</p>
          <p className="mt-1.5 text-xs text-white/50">
            Optional — the cover opens on the gold rule when no logo is added.
            PNG with a transparent background works best. Max 2 MB.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <input
              ref={logoInputRef}
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full max-w-sm text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-[#28a143]/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#8be9a5] hover:file:bg-[#28a143]/30"
            />
            {logoDataUrl ? (
              <div className="flex items-center gap-3">
                <Image
                  src={logoDataUrl}
                  alt="Client logo preview"
                  width={64}
                  height={40}
                  unoptimized
                  className="h-10 w-auto rounded bg-white/90 object-contain px-2 py-1"
                />
                <span className="max-w-[160px] truncate text-xs text-white/60">
                  {logoFileName}
                </span>
                <button
                  type="button"
                  onClick={clearLogo}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-[#ff9b9b]/50 hover:text-[#ff9b9b]"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>
          {errors.logo ? <p className={errorClass}>{errors.logo}</p> : null}
        </div>
      </SectionCard>

      <SectionCard number="2" title="Letter from the COO">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="recipientName" label="Recipient name">
            <input
              id="recipientName"
              value={form.recipientName}
              onChange={(event) => update("recipientName", event.target.value)}
              className={inputClass}
              placeholder="Md. Shariful Islam"
            />
          </Field>
          <Field id="recipientTitle" label="Recipient title">
            <input
              id="recipientTitle"
              value={form.recipientTitle}
              onChange={(event) => update("recipientTitle", event.target.value)}
              className={inputClass}
              placeholder="Managing Director"
            />
          </Field>
          <div className="md:col-span-2 -mt-1">
            <p className="text-xs text-white/50">
              Both are optional. Leave them blank when the proposal goes to the
              company rather than to a named person.
            </p>
          </div>
          <Field
            id="letterAddresseeName"
            label="Letter addressee company"
            hint="Leave blank to use the client name."
          >
            <input
              id="letterAddresseeName"
              value={form.letterAddresseeName}
              onChange={(event) => update("letterAddresseeName", event.target.value)}
              className={inputClass}
              placeholder="Same as client name"
            />
          </Field>
          <Field
            id="meetingDateReference"
            label="Meeting date referenced in the letter"
            hint="Powers “Following our meeting on …”. Defaults to the proposal date."
          >
            <input
              id="meetingDateReference"
              type="date"
              value={form.meetingDateReference}
              onChange={(event) => update("meetingDateReference", event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6">
          <p className={labelClass}>Hardware key benefits</p>
          <p className="mb-4 mt-1.5 text-xs text-white/50">
            Each selected benefit becomes one bullet in the letter. The page is
            laid out to hold all six, so any subset fits.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {DEFAULT_KEY_BENEFITS.map((benefit) => {
              const checked = form.keyBenefits.includes(benefit);
              return (
                <label
                  key={benefit}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    checked
                      ? "border-[#28a143]/60 bg-[#28a143]/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBenefit(benefit)}
                    className="h-4 w-4 shrink-0 accent-[#28a143]"
                  />
                  {benefit}
                </label>
              );
            })}
          </div>
        </div>
      </SectionCard>

      <SectionCard number="3" title="Solution and modules">
        <div className="mb-6">
          <p className={labelClass}>Modules</p>
          <p className="mb-4 mt-1.5 text-xs text-white/50">
            Selected modules fill the solution page. Any number works — the
            section runs onto a second page when they no longer fit one.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SELECTABLE_MODULES.map((module) => {
              const checked = form.selectedModules.includes(module.id);
              return (
                <label
                  key={module.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    checked
                      ? "border-[#28a143]/60 bg-[#28a143]/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleModule(module.id)}
                    className="h-4 w-4 shrink-0 accent-[#28a143]"
                  />
                  {module.label}
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-white/40">
            {form.selectedModules.length} of {SELECTABLE_MODULES.length} selected
          </p>
        </div>

        <div className="border-t border-white/10 pt-6">
          <Field
            id="problemStatementHeading"
            label="Problem statement heading"
            hint="Optional callout on the solution page. Leave the body empty to omit it entirely."
          >
            <input
              id="problemStatementHeading"
              value={form.problemStatementHeading}
              onChange={(event) => update("problemStatementHeading", event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="mt-4">
            <Richtexteditor
              value={form.problemStatementText}
              onChange={(html) => update("problemStatementText", html)}
              placeholder="e.g. Attendance is collected on paper across three sites, so payroll spends two days a month reconciling it before a single payslip can be issued."
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard number="4" title="HRIS subscription (recurring)">
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
          <Field
            id="mrcFee"
            label="Monthly subscription fee, total (BDT) *"
            error={errors.mrcFee}
          >
            <input
              id="mrcFee"
              type="number"
              min="0"
              value={form.mrcFee}
              onChange={(event) => update("mrcFee", event.target.value)}
              className={inputClass}
              placeholder="50000"
              aria-invalid={invalid("mrcFee")}
            />
          </Field>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-white/90">
            <input
              type="checkbox"
              checked={form.includeFieldTracking}
              onChange={(event) => update("includeFieldTracking", event.target.checked)}
              className="h-4 w-4 accent-[#28a143]"
            />
            Include field employee tracking
          </label>
          {form.includeFieldTracking ? (
            <div className="mt-4 max-w-sm">
              <Field
                id="fieldTrackingFee"
                label="Tracking fee per employee, per month (BDT) *"
                error={errors.fieldTrackingFee}
                hint="The table multiplies this by the employee count."
              >
                <input
                  id="fieldTrackingFee"
                  type="number"
                  min="0"
                  value={form.fieldTrackingFee}
                  onChange={(event) => update("fieldTrackingFee", event.target.value)}
                  className={inputClass}
                  placeholder="100"
                  aria-invalid={invalid("fieldTrackingFee")}
                />
              </Field>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard number="5" title="Hardware and rollout (one-time)">
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-white/90">
            <input
              type="checkbox"
              checked={form.includeRolloutCharge}
              onChange={(event) => update("includeRolloutCharge", event.target.checked)}
              className="h-4 w-4 accent-[#28a143]"
            />
            Include software rollout charge
          </label>
          {form.includeRolloutCharge ? (
            <div className="mt-4 max-w-sm">
              <Field
                id="rolloutCharge"
                label="Rollout, configuration & training (BDT) *"
                error={errors.rolloutCharge}
              >
                <input
                  id="rolloutCharge"
                  type="number"
                  min="0"
                  value={form.rolloutCharge}
                  onChange={(event) => update("rolloutCharge", event.target.value)}
                  className={inputClass}
                  placeholder="25000"
                  aria-invalid={invalid("rolloutCharge")}
                />
              </Field>
            </div>
          ) : null}
        </div>

        <p className="mb-5 text-sm text-white/60">
          Every row below becomes one line of the one-time half of the
          commercial table. Add an item from the catalogue to pre-fill its
          brand, model and last quoted price, then edit whatever differs.
        </p>

        <LineItemEditor
          rows={form.lineItems}
          errors={lineItemErrors}
          onFieldChange={updateLineItem}
          onRemove={removeLineItem}
        />

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {DEVICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => addLineItem(preset.id)}
              disabled={atMaxItems}
              className="rounded-lg border border-[#28a143]/40 bg-[#28a143]/10 px-4 py-2 text-xs font-semibold text-[#8be9a5] transition hover:border-[#5cd47e] hover:bg-[#28a143]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + {preset.description}
            </button>
          ))}
          <button
            type="button"
            onClick={() => addLineItem("")}
            disabled={atMaxItems}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white/75 transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Blank row
          </button>
        </div>
        <p className="mt-3 text-xs text-white/40">
          {form.lineItems.length} of {MAX_LINE_ITEMS} rows used
          {atMaxItems ? " — remove one to add a different item." : ""}
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
          <div className="flex justify-between py-1 text-white/70">
            <span>Monthly total</span>
            <span>{formatQuoteAmount(previewMonthly)}</span>
          </div>
          <div className="flex justify-between py-1 text-white/70">
            <span>One-time total</span>
            <span>{formatQuoteAmount(previewOneTime)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-3 font-bold text-[#8be9a5]">
            <span>
              First invoice
              <span className="block text-[11px] font-normal text-white/45">
                One-time plus the first month
              </span>
            </span>
            <span>{formatQuoteAmount(previewFirst)} BDT</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard number="6" title="Terms and conditions">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="vatPercent"
            label="VAT percentage *"
            error={errors.vatPercent}
            hint="Stated as a terms clause, not a table row. 0 prints an “excluding VAT & AIT” note instead."
          >
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
          <Field
            id="validityDays"
            label="Proposal validity (days)"
            error={errors.validityDays}
          >
            <input
              id="validityDays"
              type="number"
              min="1"
              step="1"
              value={form.validityDays}
              onChange={(event) => update("validityDays", event.target.value)}
              className={inputClass}
              aria-invalid={invalid("validityDays")}
            />
          </Field>
          <Field id="warrantyPeriod" label="Warranty period *" error={errors.warrantyPeriod}>
            <input
              id="warrantyPeriod"
              value={form.warrantyPeriod}
              onChange={(event) => update("warrantyPeriod", event.target.value)}
              className={inputClass}
              aria-invalid={invalid("warrantyPeriod")}
            />
          </Field>
          <Field id="deliveryCity" label="Delivery city *" error={errors.deliveryCity}>
            <input
              id="deliveryCity"
              value={form.deliveryCity}
              onChange={(event) => update("deliveryCity", event.target.value)}
              className={inputClass}
              aria-invalid={invalid("deliveryCity")}
            />
          </Field>
          <div className="md:col-span-2">
            <Field
              id="deliveryLeadTime"
              label="Tentative delivery time *"
              error={errors.deliveryLeadTime}
            >
              <input
                id="deliveryLeadTime"
                value={form.deliveryLeadTime}
                onChange={(event) => update("deliveryLeadTime", event.target.value)}
                className={inputClass}
                aria-invalid={invalid("deliveryLeadTime")}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field id="paymentTerms" label="Payment terms *" error={errors.paymentTerms}>
              <textarea
                id="paymentTerms"
                rows={2}
                value={form.paymentTerms}
                onChange={(event) => update("paymentTerms", event.target.value)}
                className={inputClass}
                aria-invalid={invalid("paymentTerms")}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard number="7" title="Prepared by (optional)">
        <p className="mb-5 text-sm text-white/60">
          Fill these in to put a named contact on the cover. Leave every field
          blank and the cover reads &ldquo;Shomvob Technologies Limited&rdquo;.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="preparedByName" label="Name">
            <input
              id="preparedByName"
              value={form.preparedByName}
              onChange={(event) => update("preparedByName", event.target.value)}
              className={inputClass}
              placeholder="Md. Ariful Islam"
            />
          </Field>
          <Field id="preparedByTitle" label="Title">
            <input
              id="preparedByTitle"
              value={form.preparedByTitle}
              onChange={(event) => update("preparedByTitle", event.target.value)}
              className={inputClass}
              placeholder="Manager, HRM Growth"
            />
          </Field>
          <Field id="preparedByPhone" label="Mobile">
            <input
              id="preparedByPhone"
              value={form.preparedByPhone}
              onChange={(event) => update("preparedByPhone", event.target.value)}
              className={inputClass}
              placeholder="01XXXXXXXXX"
            />
          </Field>
          <Field id="preparedByEmail" label="Email">
            <input
              id="preparedByEmail"
              type="email"
              value={form.preparedByEmail}
              onChange={(event) => update("preparedByEmail", event.target.value)}
              className={inputClass}
              placeholder="name@shomvob.com"
            />
          </Field>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Print as PDF
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
        >
          {isDownloading ? "Generating PDF…" : "Download PDF"}
        </button>
        <button
          type="submit"
          className="rounded-xl bg-[#edb713] px-7 py-3.5 text-sm font-bold text-[#0c3d20] transition hover:bg-[#f5c832]"
        >
          Preview proposal
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
