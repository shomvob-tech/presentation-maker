"use client";

import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import { useSyncExternalStore } from "react";
import SlaCoverPage from "@/app/components/sla/SlaCoverPage";
import SlaDocument from "@/app/components/sla/SlaDocument";
import SlaPrintPdfButton from "@/app/components/sla/SlaPrintPdfButton";
import {
  loadSlaDetails,
  SLA_DETAILS_KEY,
  type SlaDetails,
} from "@/lib/sla-session";
import "@/app/components/sla/sla-document.css";
import "./sla-print.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sla-serif",
});

function subscribeToSlaStorage() {
  return () => undefined;
}

let cachedRaw: string | null | undefined;
let cachedDetails: SlaDetails | null = null;

function getSlaSnapshot(): SlaDetails | null {
  const raw = localStorage.getItem(SLA_DETAILS_KEY);
  if (raw === cachedRaw) return cachedDetails;
  cachedRaw = raw;
  cachedDetails = loadSlaDetails();
  return cachedDetails;
}

export default function SlaPreviewPage() {
  const details = useSyncExternalStore<SlaDetails | null>(
    subscribeToSlaStorage,
    getSlaSnapshot,
    () => null,
  );

  if (!details) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#e9e9e4] px-6 text-center text-[#333]">
        <h1 className="text-xl font-bold">No SLA details to preview</h1>
        <p className="max-w-md text-sm text-[#666]">
          Complete the SLA builder first, then return to the preview.
        </p>
        <Link
          href="/sla-builder"
          className="rounded-xl bg-[#edb713] px-6 py-3 text-sm font-bold text-[#0c3d20]"
        >
          Go to SLA builder
        </Link>
      </main>
    );
  }

  return (
    <main className={`${sourceSerif.variable} sla-preview-shell`}>
      <div className="sla-preview-toolbar">
        <Link href="/sla-builder">← Edit SLA details</Link>
        <span>SLA preview</span>
      </div>
      <SlaCoverPage clientName={details.clientName} />
      <SlaDocument details={details} />
      <SlaPrintPdfButton details={details} />
    </main>
  );
}
