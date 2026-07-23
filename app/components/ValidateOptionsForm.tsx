"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllModuleNames } from "@/lib/module-recommendation";
import {
  loadPresentationSession,
  savePreviewLogo,
  type PresentationWizardSession,
} from "@/lib/presentation-session";
import {
  buildPreviewPath,
  moduleNamesToIds,
  MODULES_WITH_SLIDES,
} from "@/lib/points-generator";
import knowledgeBase from "@/lib/knowledge_base.json";

const allModules = getAllModuleNames();

const moduleNameHasSlide: Record<string, boolean> = Object.fromEntries(
  knowledgeBase.modules.map((module) => [
    module.name,
    MODULES_WITH_SLIDES.has(module.id),
  ]),
);

export default function ValidateOptionsForm() {
  const router = useRouter();
  const [session, setSession] = useState<PresentationWizardSession | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [aiNotes, setAiNotes] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const storedSession = loadPresentationSession();
    if (!storedSession) {
      router.replace("/new");
      return;
    }

    setSession(storedSession);
    setSelectedModules(storedSession.recommendation.modules);
    setIsReady(true);
  }, [router]);

  function toggleModule(moduleName: string) {
    setSelectedModules((current) =>
      current.includes(moduleName)
        ? current.filter((name) => name !== moduleName)
        : [...current, moduleName],
    );
    setPreviewUrl(null);
    setPdfError(null);
  }

  function handleGeneratePreview() {
    if (!session) return;

    const moduleIds = moduleNamesToIds(selectedModules);
    const path = buildPreviewPath(moduleIds);
    savePreviewLogo(session.logoDataUrl);
    setPreviewUrl(`${window.location.origin}${path}`);
    setPdfError(null);
  }

  async function handleDownloadPdf() {
    if (!previewUrl) return;

    setIsDownloadingPdf(true);
    setPdfError(null);

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: previewUrl,
          logoDataUrl: session?.logoDataUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "presentation.pdf";
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

  if (!isReady || !session) {
    return (
      <p className="text-sm text-[#0c3d20]/70">Loading validation options…</p>
    );
  }

  const recommendedModules = new Set(session.recommendation.modules);
  const { clientDetails } = session;

  const labelClassName = "text-xs font-semibold uppercase tracking-wide text-[#0c3d20]/55";
  const valueClassName = "mt-1 text-sm text-[#0c3d20]";
  const inputClassName =
    "w-full rounded-lg border border-[#0c3d20]/15 bg-white px-4 py-3 text-[#0c3d20] placeholder:text-[#0c3d20]/40 outline-none transition focus:border-[#137a3c] focus:ring-2 focus:ring-[#137a3c]/20";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[#0c3d20]/10 bg-[#f8fbf9] p-5">
        <h2 className="text-sm font-semibold text-[#0c3d20]">Client details</h2>
        <p className="mt-1 text-xs text-[#0c3d20]/60">
          Review the information entered on the previous step.
        </p>

        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <dt className={labelClassName}>Client name</dt>
            <dd className={valueClassName}>{clientDetails.clientName}</dd>
          </div>
          <div>
            <dt className={labelClassName}>Client email</dt>
            <dd className={valueClassName}>{clientDetails.clientEmail}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className={labelClassName}>Requirements</dt>
            <dd className={`${valueClassName} whitespace-pre-wrap`}>
              {clientDetails.requirements || "—"}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className={labelClassName}>Notes</dt>
            <dd className={`${valueClassName} whitespace-pre-wrap`}>
              {clientDetails.notes || "—"}
            </dd>
          </div>
          {session.logoDataUrl ? (
            <div className="md:col-span-2">
              <dt className={labelClassName}>Logo</dt>
              <dd className="mt-2 flex items-center gap-4">
                <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-[#0c3d20]/10 bg-white">
                  <Image
                    src={session.logoDataUrl}
                    alt="Client logo"
                    fill
                    unoptimized
                    className="object-contain p-2"
                  />
                </div>
                {session.logoFileName ? (
                  <span className="text-sm text-[#0c3d20]/70">
                    {session.logoFileName}
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-[#0c3d20]">Modules</h2>
        <p className="mt-1 text-xs text-[#0c3d20]/60">
          Recommended modules are pre-selected. Add or remove any before
          generating the presentation.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {allModules.map((moduleName) => {
            const isSelected = selectedModules.includes(moduleName);
            const isRecommended = recommendedModules.has(moduleName);
            const hasSlide = moduleNameHasSlide[moduleName];

            return (
              <label
                key={moduleName}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                  isSelected
                    ? "border-[#137a3c] bg-[#137a3c]/8"
                    : "border-[#0c3d20]/10 bg-white hover:border-[#137a3c]/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleModule(moduleName)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#137a3c]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#0c3d20]">
                    {moduleName}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {isRecommended ? (
                      <span className="inline-block rounded-full bg-[#edb713]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6500]">
                        Recommended
                      </span>
                    ) : null}
                    {!hasSlide ? (
                      <span className="inline-block rounded-full bg-[#0c3d20]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0c3d20]/50">
                        No slide yet
                      </span>
                    ) : null}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-[#0c3d20]/55">
          {selectedModules.length} module
          {selectedModules.length === 1 ? "" : "s"} selected. Only modules with
          a dedicated slide template will appear in the generated deck.
        </p>
      </section>

      <section>
        <label htmlFor="aiNotes" className="block text-sm font-semibold text-[#0c3d20]">
          AI notes
        </label>
        <p className="mt-1 text-xs text-[#0c3d20]/60">
          Reserved for future AI-generated guidance. Not used yet.
        </p>
        <textarea
          id="aiNotes"
          name="aiNotes"
          rows={4}
          value={aiNotes}
          onChange={(event) => setAiNotes(event.target.value)}
          placeholder="AI suggestions and content notes will appear here in a future step."
          className={`${inputClassName} mt-2 resize-y`}
        />
      </section>

      {previewUrl ? (
        <section className="rounded-xl border border-[#137a3c]/20 bg-[#137a3c]/5 px-5 py-4">
          <p className="text-sm font-medium text-[#0c3d20]">
            Presentation preview link
          </p>
          <p className="mt-1 text-xs text-[#0c3d20]/60">
            This temporary link renders the selected slides. Open it to review,
            or download it directly as a PDF.
          </p>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block break-all rounded-lg bg-white/80 px-3 py-2 text-xs font-medium text-[#137a3c] underline-offset-2 hover:underline"
          >
            {previewUrl}
          </a>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="rounded-lg bg-[#0c3d20] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0a331b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDownloadingPdf ? "Generating PDF…" : "Download PDF"}
            </button>
            <span className="text-xs text-[#0c3d20]/55">
              PDF generation opens the preview link in a headless browser and
              captures every slide.
            </span>
          </div>

          {pdfError ? (
            <p className="mt-3 text-xs font-medium text-red-600">
              Could not generate PDF: {pdfError}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-[#0c3d20]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/new"
          className="text-center text-sm font-medium text-[#0c3d20]/70 transition hover:text-[#0c3d20]"
        >
          ← Back to client details
        </Link>

        <button
          type="button"
          onClick={handleGeneratePreview}
          disabled={selectedModules.length === 0}
          className="rounded-xl bg-[#edb713] px-8 py-4 text-base font-semibold text-[#0c3d20] shadow-lg shadow-black/10 transition hover:bg-[#f5c832] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {previewUrl ? "Regenerate preview" : "Generate presentation"}
        </button>
      </div>
    </div>
  );
}
