"use client";

import { useEffect } from "react";
import { logEvent } from "@/lib/audit/client";
import type { SlaDetails } from "@/lib/sla-session";

async function waitForSlaReady(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (document.querySelector(".sla-doc")) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await document.fonts?.ready;
}

/**
 * Logs the button press, mirroring `slaRowFields` in SlaBuilderForm so both
 * rows aggregate together.
 *
 * Only the button logs. The `?print=1` path was already logged by the builder
 * before it opened this page, and logging there too would count one export as
 * two. `logEvent` reads the ids out of localStorage itself, which is what keeps
 * this row on the same `draft_id` as the builder's — the preview is a separate
 * tab, but localStorage is shared.
 *
 * This matters because the builder's preview opens this page without
 * `?print=1`: a rep who previews and then saves from here would otherwise
 * export with no row in the log at all.
 */
function logExportClicked(details: SlaDetails) {
  logEvent("export_clicked", "sla", {
    client_name: details.clientName,
    employee_count: details.employeeCount,
    mrc_fee: details.monthlyFee,
    module_count: details.selectedFeatures.length,
    modules: details.selectedFeatures.join(", "),
    export_method: "print",
  });
}

export default function SlaPrintPdfButton({
  details,
}: {
  details: SlaDetails;
}) {
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
    <button
      type="button"
      onClick={() => {
        // Fire-and-forget with keepalive, so the blocking print dialog can't
        // strand the request.
        logExportClicked(details);
        window.print();
      }}
      className="sla-print-button"
    >
      Save as PDF
    </button>
  );
}
