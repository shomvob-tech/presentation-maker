"use client";

/**
 * Presentation preview — the deck exactly as the /300ltd sample renders it,
 * full-viewport slides stacked top to bottom, read back out of localStorage.
 *
 * Reads through useSyncExternalStore rather than an effect, as the device
 * preview does, so the slides are present in the first committed render — the
 * export route counts them as soon as the page loads.
 */

import Link from "next/link";
import { useSyncExternalStore } from "react";
import PresentationDeck from "@/app/components/presentation/PresentationDeck";
import PresentationPrintPdfButton from "@/app/components/presentation/PresentationPrintPdfButton";
import { buildDeckPlan } from "@/lib/deck-catalog";
import {
  DECK_DETAILS_KEY,
  DECK_LOGO_KEY,
  loadDeckDetails,
  loadDeckLogo,
  type PresentationDeckDetails,
} from "@/lib/deck-session";

type PreviewSnapshot = {
  details: PresentationDeckDetails | null;
  logoDataUrl: string | null;
};

const EMPTY_SNAPSHOT: PreviewSnapshot = { details: null, logoDataUrl: null };

function subscribeToDeckStorage() {
  return () => undefined;
}

let cachedDetailsRaw: string | null | undefined;
let cachedLogoRaw: string | null | undefined;
let cachedSnapshot: PreviewSnapshot = EMPTY_SNAPSHOT;

/** Must return a stable reference while the underlying strings are unchanged,
 * or useSyncExternalStore re-renders forever. */
function getDeckSnapshot(): PreviewSnapshot {
  const detailsRaw = localStorage.getItem(DECK_DETAILS_KEY);
  const logoRaw = localStorage.getItem(DECK_LOGO_KEY);

  if (detailsRaw === cachedDetailsRaw && logoRaw === cachedLogoRaw) {
    return cachedSnapshot;
  }

  cachedDetailsRaw = detailsRaw;
  cachedLogoRaw = logoRaw;
  cachedSnapshot = {
    details: loadDeckDetails(),
    logoDataUrl: loadDeckLogo(),
  };
  return cachedSnapshot;
}

export default function PresentationPreviewPage() {
  const { details, logoDataUrl } = useSyncExternalStore<PreviewSnapshot>(
    subscribeToDeckStorage,
    getDeckSnapshot,
    () => EMPTY_SNAPSHOT,
  );

  if (!details) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#03110a] px-6 text-center text-white">
        <h1 className="text-lg font-semibold">No presentation to preview</h1>
        <p className="max-w-md text-sm text-white/65">
          Fill in the presentation builder first, then continue to preview.
        </p>
        <Link
          href="/presentation-builder"
          className="rounded-xl bg-[#edb713] px-6 py-3 text-sm font-semibold text-[#0c3d20] transition hover:bg-[#f5c832]"
        >
          Go to presentation builder
        </Link>
      </main>
    );
  }

  const slideCount = buildDeckPlan(details.moduleIds).length;

  return (
    <>
      <div className="print-hide flex items-center justify-between gap-4 bg-[#03110a] px-6 py-3 text-sm text-white md:px-10">
        <Link
          href="/presentation-builder"
          className="font-medium text-white/70 transition hover:text-white"
        >
          ← Edit presentation
        </Link>
        <span className="truncate text-xs font-semibold uppercase tracking-widest text-white/45">
          {details.clientName} · {slideCount} slides
        </span>
      </div>

      <PresentationDeck
        clientName={details.clientName}
        logoSrc={logoDataUrl}
        moduleIds={details.moduleIds}
      />

      <PresentationPrintPdfButton details={details} />
    </>
  );
}
