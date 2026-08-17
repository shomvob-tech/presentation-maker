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

async function waitForProposalReady(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (document.querySelectorAll(".a4-page").length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await document.fonts?.ready;
  await Promise.all(
    [...document.images].map((image) => image.decode().catch(() => undefined)),
  );
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
      onClick={() => window.print()}
      className="print-hide fixed bottom-6 right-6 z-50 rounded-xl bg-[#edb713] px-5 py-3 text-sm font-semibold text-[#0c3d20] shadow-[0_10px_30px_-10px_rgba(237,183,19,0.75)] transition hover:bg-[#f5c832]"
    >
      Save as PDF
    </button>
  );
}
