"use client";

/**
 * Proposal cover preview — loads wizard inputs from localStorage and renders
 * CoverPage at true A4 size on a gray backdrop.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import CoverPage from "@/app/components/CoverPage";
import {
  loadClientName,
  loadPreviewLogo,
  loadProposalDetails,
  type ProposalDetails,
} from "@/lib/presentation-session";

const SHOMVOB_LOGO_SRC = "/resources/shomvob_hr_text.png";

type PreviewState = {
  clientName: string;
  clientLogoSrc: string | null;
  details: ProposalDetails | null;
};

export default function PreviewPage() {
  const [state, setState] = useState<PreviewState | null>(null);

  useEffect(() => {
    setState({
      clientName: loadClientName(),
      clientLogoSrc: loadPreviewLogo(),
      details: loadProposalDetails(),
    });
  }, []);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e5e5e5] text-[#0c3d20]">
        Loading preview…
      </div>
    );
  }

  if (!state.details || !state.clientLogoSrc) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#e5e5e5] px-6 text-center text-[#0c3d20]">
        <p className="text-lg font-semibold">No proposal details to preview</p>
        <p className="max-w-md text-sm text-[#0c3d20]/70">
          Fill in the proposal builder form (including a client logo) first,
          then continue to preview.
        </p>
        <Link
          href="/proposal-builder"
          className="rounded-xl bg-[#edb713] px-6 py-3 text-sm font-semibold text-[#0c3d20] transition hover:bg-[#f5c832]"
        >
          Go to proposal builder
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-[#e5e5e5] pt-10 pb-6">
      <div className="mb-6 flex w-full max-w-[210mm] items-center justify-between px-4">
        <Link
          href="/proposal-builder"
          className="text-sm font-medium text-[#0c3d20]/70 transition hover:text-[#0c3d20]"
        >
          ← Edit details
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
          Cover preview
        </p>
      </div>

      <div className="shadow-2xl shadow-black/30">
        <CoverPage
          clientName={state.clientName}
          clientLogoSrc={state.clientLogoSrc}
          documentTitle={state.details.documentTitle}
          preparedDate={state.details.preparedDate}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </div>
    </div>
  );
}
