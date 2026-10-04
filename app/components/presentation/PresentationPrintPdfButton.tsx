"use client";

/**
 * Browser-native PDF export for /presentation-preview — the OS print dialog,
 * as on the other previews. PresentationDeck sets the 16:9 page size.
 *
 * `?print=1` auto-opens the dialog once the slides are ready.
 */

import { useEffect } from "react";
import { logEvent } from "@/lib/audit/client";
import type { PresentationDeckDetails } from "@/lib/deck-session";

/** How long font loading may hold the dialog back. */
const FONT_BUDGET_MS = 3_000;
/**
 * How long image loading may. Longer than the A4 previews allow: a freshly
 * opened deck is fetching every screenshot and logo on every slide at once.
 */
const IMAGE_BUDGET_MS = 10_000;

/** Resolves when `promise` settles or the budget runs out, whichever is first. */
function withBudget(promise: Promise<unknown> | undefined, ms: number) {
  if (!promise) return Promise.resolve();

  return Promise.race([
    promise.catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
}

/**
 * Slide images are next/image's default `loading="lazy"`, so on a stacked
 * deck only the first slide's have loaded when the dialog opens — the phone
 * screenshots further down would print blank. Switching them to eager starts
 * every load at once.
 */
function loadLazyImages() {
  for (const image of document.querySelectorAll<HTMLImageElement>(
    'img[loading="lazy"]',
  )) {
    image.loading = "eager";
  }
}

/**
 * Load events rather than `image.decode()`, which the A4 previews use: decode
 * never settles while the tab is not being painted, and `window.open` can
 * land this page in a background tab. Load events fire there too.
 */
function whenLoaded(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve();

  return new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

async function waitForDeckReady(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  // Hard requirement: printing before the slides mount produces a blank PDF.
  while (Date.now() < deadline) {
    if (document.querySelectorAll(".deck-root > section").length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  loadLazyImages();

  await withBudget(document.fonts?.ready, FONT_BUDGET_MS);
  await withBudget(
    Promise.all([...document.images].map(whenLoaded)),
    IMAGE_BUDGET_MS,
  );
}

/**
 * Only the button logs. The `?print=1` path was already logged by the builder
 * before it opened this page; logging here too would count one export twice.
 * `logEvent` reads the draft id out of localStorage, which the builder's tab
 * shares, so this row lands on the builder's draft.
 */
function logExportClicked(details: PresentationDeckDetails) {
  logEvent("export_clicked", "presentation", {
    client_name: details.clientName,
    module_count: details.moduleIds.length,
    modules: details.moduleIds.join(", "),
    export_method: "print",
  });
}

export default function PresentationPrintPdfButton({
  details,
}: {
  details: PresentationDeckDetails;
}) {
  useEffect(() => {
    const shouldAutoPrint =
      new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldAutoPrint) return;

    let cancelled = false;

    void waitForDeckReady().then(() => {
      if (!cancelled) window.print();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleClick() {
    // Logged before the wait — keepalive gets the row out even if the rep
    // closes the tab while the images finish.
    logExportClicked(details);
    await waitForDeckReady();
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="print-hide fixed bottom-6 right-6 z-50 rounded-xl bg-[#edb713] px-5 py-3 text-sm font-semibold text-[#0c3d20] shadow-[0_10px_30px_-10px_rgba(237,183,19,0.75)] transition hover:bg-[#f5c832]"
    >
      Save as PDF
    </button>
  );
}
