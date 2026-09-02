"use client";

import { useEffect } from "react";

async function waitForSlaReady(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (document.querySelector(".sla-doc")) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await document.fonts?.ready;
}

export default function SlaPrintPdfButton() {
  useEffect(() => {
    const shouldPrint =
      new URLSearchParams(window.location.search).get("print") === "1";
    if (!shouldPrint) return;

    let cancelled = false;
    void waitForSlaReady().then(() => {
      if (!cancelled) window.print();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <button type="button" onClick={() => window.print()} className="sla-print-button">
      Save as PDF
    </button>
  );
}
