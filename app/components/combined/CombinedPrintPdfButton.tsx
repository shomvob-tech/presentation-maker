"use client";

/**
 * Browser-native PDF export for /combined-preview — the same Vercel-safe path
 * the other three previews use: the OS print dialog, no serverless Chromium.
 * Pairs with `.print-hide` / `.print-stage` in globals.css.
 *
 * `?print=1` auto-opens the dialog once the A4 pages are ready.
 */

import { useEffect } from "react";
import { logEvent } from "@/lib/audit/client";
import type { CombinedProposalDetails } from "@/lib/combined-session";

/** How long the font/image polish step may hold the dialog back. */
const POLISH_BUDGET_MS = 3_000;

/**
 * Resolves when `promise` settles or the budget runs out. `image.decode()`
 * never settles while the document is not being painted, and `window.open`
 * can land in a background tab, so an unbounded await means the preview opens
 * and no dialog ever appears.
 */
function withBudget(promise: Promise<unknown> | undefined, ms: number) {
  if (!promise) return Promise.resolve();

  return Promise.race([
    promise.catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
}

async function waitForCombinedReady(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  // Hard requirement: printing before the pages mount produces a blank PDF.
  while (Date.now() < deadline) {
    if (document.querySelectorAll(".a4-page").length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const budget = Math.min(POLISH_BUDGET_MS, Math.max(0, deadline - Date.now()));

  await withBudget(document.fonts?.ready, budget);
  await withBudget(
    Promise.all([...document.images].map((image) => image.decode().catch(() => undefined))),
    budget,
  );
}

/**
 * Only the button logs. The `?print=1` path was already logged by the builder
 * before it opened this page, and logging here too would count one export as
 * two. `logEvent` reads the ids out of localStorage itself, which keeps this
 * row on the builder's `draft_id` — the preview is a separate tab, but
 * localStorage is shared.
 */
function logExportClicked(details: CombinedProposalDetails) {
  logEvent("export_clicked", "combined", {
    client_name: details.clientName,
    employee_count: details.employeeCount,
    mrc_fee: details.mrcFee,
    module_count: details.selectedModules.length,
    modules: details.selectedModules.join(", "),
    export_method: "print",
  });
}

export default function CombinedPrintPdfButton({
  details,
}: {
  details: CombinedProposalDetails;
}) {
  useEffect(() => {
    const shouldAutoPrint =
      new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldAutoPrint) return;

    let cancelled = false;

    void waitForCombinedReady().then(() => {
      if (!cancelled) window.print();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        // Fire-and-forget with keepalive, so the blocking print dialog can't
        // strand the request.
        logExportClicked(details);
        window.print();
      }}
      className="print-hide fixed bottom-6 right-6 z-50 rounded-xl bg-[#edb713] px-5 py-3 text-sm font-semibold text-[#0c3d20] shadow-[0_10px_30px_-10px_rgba(237,183,19,0.75)] transition hover:bg-[#f5c832]"
    >
      Save as PDF
    </button>
  );
}
