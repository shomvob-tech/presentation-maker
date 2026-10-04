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
import {
  buildDeckPlan,
  CLOSING_SLIDES,
  DECK_MODULE_IDS,
  DECK_MODULES,
  OPENING_SLIDES,
} from "@/lib/deck-catalog";
import {
  buildSuggestedDeckPdfFileName,
  saveDeckDetails,
  saveDeckLogo,
  type PresentationDeckDetails,
} from "@/lib/deck-session";
import { fileToDataUrl } from "@/lib/presentation-session";

type FormState = {
  clientName: string;
  moduleIds: string[];
};

type FormErrors = Partial<Record<keyof FormState | "logo", string>>;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Every module, as in the /300ltd sample — reps untick what the client does
 * not need rather than build the list up from nothing. */
const initialForm: FormState = {
  clientName: "",
  moduleIds: [...DECK_MODULE_IDS],
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

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.clientName.trim()) errors.clientName = "This field is required.";
  if (form.moduleIds.length === 0) {
    errors.moduleIds =
      "Pick at least one module — without one the deck goes straight from the introduction to the thank-you slide.";
  }

  return errors;
}

export default function PresentationBuilderForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  /** Strict Mode mounts effects twice in dev — see the other builders. */
  const hasLoggedOpen = useRef(false);

  // One visit to the builder is one draft — the form always mounts blank.
  useEffect(() => {
    if (hasLoggedOpen.current) return;
    hasLoggedOpen.current = true;

    beginDraft("presentation");
    logEvent("builder_opened", "presentation");
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (markInput("presentation")) logEvent("form_touched", "presentation");

    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setPdfError(null);
  }

  function toggleModule(id: string) {
    const next = form.moduleIds.includes(id)
      ? form.moduleIds.filter((entry) => entry !== id)
      : // Kept in catalog order, so the stored selection reads in the same
        // order the slides run, however the boxes were clicked.
        DECK_MODULE_IDS.filter((entry) => form.moduleIds.includes(entry) || entry === id);

    update("moduleIds", next);
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
      setPdfError(null);
    } catch {
      setErrors((current) => ({ ...current, logo: "Could not read that file." }));
    }
  }

  function clearLogo() {
    setLogoDataUrl(null);
    setLogoFileName(null);
    setErrors((current) => ({ ...current, logo: undefined }));
    setPdfError(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function prepareDetails(): PresentationDeckDetails | null {
    const nextErrors = validate(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      // aria-invalid only lands on the next render, so let that commit before
      // hunting for the first invalid field — otherwise the first submit finds
      // nothing. A timeout, not requestAnimationFrame: frames pause in a
      // background tab, timers still fire.
      setTimeout(() => {
        const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
        firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalid?.focus({ preventScroll: true });
      }, 0);

      logEvent("validation_failed", "presentation", {
        client_name: form.clientName.trim(),
        validation_failed_fields: Object.keys(nextErrors).join(", "),
      });
      return null;
    }

    const details: PresentationDeckDetails = {
      clientName: form.clientName.trim(),
      moduleIds: form.moduleIds,
    };

    saveDeckDetails(details);
    saveDeckLogo(logoDataUrl ?? undefined);
    return details;
  }

  function deckRowFields(details: PresentationDeckDetails) {
    return {
      client_name: details.clientName,
      module_count: details.moduleIds.length,
      modules: details.moduleIds.join(", "),
    };
  }

  function logDeckPreviewed(details: PresentationDeckDetails) {
    const { added, removed } = arrayDelta(details.moduleIds, DECK_MODULE_IDS);

    logEvent("previewed", "presentation", {
      ...deckRowFields(details),
      preview_count: bumpPreviewCount("presentation"),
      modules_added_vs_default: added.join(", "),
      modules_removed_vs_default: removed.join(", "),
      optional_sections: logoDataUrl ? "client_logo" : "",
      fields_changed_since_last_preview: diffAgainstSnapshot(
        "presentation",
        details as unknown as Record<string, unknown>,
      ).join(", "),
      payload_json: JSON.stringify(details),
    });
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const details = prepareDetails();
    if (!details) return;

    logDeckPreviewed(details);
    window.open("/presentation-preview", "_blank", "noopener,noreferrer");
  }

  function handlePrint() {
    const details = prepareDetails();
    if (!details) return;

    // As on the other builders, the OS print dialog never reports back
    // whether the rep saved or cancelled.
    logEvent("export_clicked", "presentation", {
      ...deckRowFields(details),
      export_method: "print",
    });
    window.open("/presentation-preview?print=1", "_blank", "noopener,noreferrer");
  }

  async function handleDownload() {
    const details = prepareDetails();
    if (!details) return;

    setIsDownloading(true);
    setPdfError(null);
    logEvent("export_clicked", "presentation", {
      ...deckRowFields(details),
      export_method: "api",
    });

    try {
      const response = await fetch("/api/export-pdf-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `${window.location.origin}/presentation-preview`,
          deckDetails: details,
          logoDataUrl: logoDataUrl ?? undefined,
          // Joins the server's export_result row to this draft.
          auditDraftId: currentDraft("presentation").draftId,
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
      anchor.download = buildSuggestedDeckPdfFileName(details.clientName);
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

  const slideCount = buildDeckPlan(form.moduleIds).length;
  const fixedSlideCount = OPENING_SLIDES.length + CLOSING_SLIDES.length;
  const modulesInvalid = Boolean(errors.moduleIds);

  return (
    <form onSubmit={handlePreview} className="space-y-6" noValidate>
      <SectionCard number="1" title="Client">
        <Field
          id="clientName"
          label="Client name *"
          error={errors.clientName}
          hint={`Appears on the title slide — “Building a Smarter HR Ecosystem for ${
            form.clientName.trim() || "…"
          }” — and in the PDF's file name.`}
        >
          <input
            id="clientName"
            value={form.clientName}
            onChange={(event) => update("clientName", event.target.value)}
            className={inputClass}
            placeholder="Example Company Limited"
            aria-invalid={Boolean(errors.clientName)}
          />
        </Field>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className={labelClass}>Client logo</p>
          <p className="mt-1.5 text-xs text-white/50">
            Optional — it sits beside the Shomvob mark on most slides, against
            both dark green and light backgrounds, so pick a version that
            reads on both. Without one, those slides show the Shomvob mark
            alone. Max 2 MB.
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

      <SectionCard number="2" title="Modules">
        <p className={labelClass}>Module slides *</p>
        <p className="mb-4 mt-1.5 text-xs text-white/50">
          Each module adds its slides in the order listed. The title, Shomvob
          introduction, About Shomvob and thank-you slides are always included.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {DECK_MODULES.map((deckModule) => {
            const checked = form.moduleIds.includes(deckModule.id);
            return (
              <label
                key={deckModule.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  checked
                    ? "border-[#28a143]/60 bg-[#28a143]/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleModule(deckModule.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#28a143]"
                  aria-invalid={modulesInvalid}
                  aria-describedby={modulesInvalid ? "moduleIds-error" : undefined}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{deckModule.name}</span>
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
                      {plural(deckModule.slides.length, "slide")}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-white/50">
                    {deckModule.summary}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {errors.moduleIds ? (
          <p id="moduleIds-error" className={errorClass}>
            {errors.moduleIds}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-white/40">
          {form.moduleIds.length} of {DECK_MODULES.length} modules ·{" "}
          {plural(slideCount, "slide")} in the deck, {fixedSlideCount} of them
          always included
        </p>
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
          Preview presentation
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
