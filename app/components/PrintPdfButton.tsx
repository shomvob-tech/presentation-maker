"use client";

/**
 * Browser-native PDF export for /proposal-preview.
 *
 * Opens the OS print dialog (user chooses "Save as PDF"). No serverless
 * Chromium — this is the Vercel-safe path. Pair with `.print-hide` /
 * `.print-stage` in globals.css so preview chrome does not appear in the PDF.
 *
 * `?print=1` auto-opens the dialog once A4 pages, fonts, and images are ready.
 */

import { useEffect } from "react";
import { logEvent } from "@/lib/audit/client";
import {
  loadClientName,
  loadProposalDetails,
} from "@/lib/presentation-session";

/** How long the font/image polish step may hold the dialog back. */
const POLISH_BUDGET_MS = 3_000;

/**
 * Resolves when `promise` settles or the budget runs out, whichever is first.
 *
 * Every wait before `window.print()` has to be bounded. `image.decode()` never
 * settles while the document isn't being painted — a background tab, a hidden
 * window — even for an image that has fully loaded. `window.open` can land in
 * a background tab, so an unbounded await there means the preview opens and no
 * print dialog ever appears.
 */
function withBudget(promise: Promise<unknown> | undefined, ms: number) {
  if (!promise) return Promise.resolve();

  return Promise.race([
    promise.catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
}

async function waitForProposalReady(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  // The pages themselves are a hard requirement: printing before they mount
  // produces a blank PDF.
  while (Date.now() < deadline) {
    if (document.querySelectorAll(".a4-page").length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Fonts and image decoding are polish. The images are already loaded by the
  // time they are in the DOM, so a lapsed budget costs sharpness at worst,
  // where waiting forever costs the export entirely.
  const budget = Math.min(POLISH_BUDGET_MS, Math.max(0, deadline - Date.now()));

  await withBudget(document.fonts?.ready, budget);
  await withBudget(
    Promise.all(
      [...document.images].map((image) => image.decode().catch(() => undefined)),
    ),
    budget,
  );
}

/**
 * Logs the button press, mirroring the fields the builder's "Print as PDF"
 * sends so both rows aggregate together.
 *
 * Only the button logs. The `?print=1` path was already logged by the builder
 * before it opened this page, and logging there too would count one export as
 * two. Reading the ids straight out of localStorage is what keeps this row on
 * the same `draft_id` as the builder's: the preview is a separate tab, but
 * localStorage is shared and `logEvent` looks the draft up itself.
 *
 * This matters because "Preview Proposal" opens the page without `?print=1` —
 * a rep who previews and then saves from here would otherwise export with no
 * row in the log at all.
 */
function logExportClicked() {
  const details = loadProposalDetails();

  logEvent("export_clicked", "proposal", {
    client_name: loadClientName(),
    export_method: "print",
    employee_count: details?.employeeCount ?? "",
    mrc_fee: details?.mrcFee ?? "",
    module_count: details?.selectedModules?.length ?? 0,
  });
}

export default function PrintPdfButton() {
  useEffect(() => {
    const shouldAutoPrint =
      new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldAutoPrint) return;

    let cancelled = false;

    void waitForProposalReady().then(() => {
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
        logExportClicked();
        window.print();
      }}
      className="print-hide fixed bottom-6 right-6 z-50 rounded-xl bg-[#edb713] px-5 py-3 text-sm font-semibold text-[#0c3d20] shadow-[0_10px_30px_-10px_rgba(237,183,19,0.75)] transition hover:bg-[#f5c832]"
    >
      Save as PDF
    </button>
  );
}
