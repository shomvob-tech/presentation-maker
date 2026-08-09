"use client";

/**
 * Letter page preview — loads wizard inputs from localStorage and renders
 * LetterFromCoo at true A4 size. Meant to sit below the cover in
 * /proposal-preview.
 */

import LetterFromCoo from "@/app/components/Letterfromcoo";
import {
  loadClientName,
  loadProposalDetails,
  type ProposalDetails,
} from "@/lib/presentation-session";
import { useEffect, useState } from "react";

const SHOMVOB_LOGO_SRC = "/resources/shomvob_hr_text.png";
const SIGNATURE_SRC = "/resources/hasib_bhai_sig.png";

type PreviewState = {
  clientName: string;
  details: ProposalDetails | null;
};

export default function PreviewLetterPage() {
  const [state, setState] = useState<PreviewState | null>(null);

  useEffect(() => {
    setState({
      clientName: loadClientName(),
      details: loadProposalDetails(),
    });
  }, []);

  if (!state?.details) {
    return null;
  }

  const addresseeName =
    state.details.letterAddresseeName?.trim() || state.clientName;

  return (
    <div className="flex flex-col items-center bg-[#e5e5e5] pb-16">
      <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
        Letter from COO
      </p>
      <div className="shadow-2xl shadow-black/30">
        <LetterFromCoo
          clientName={state.clientName}
          addresseeName={addresseeName}
          recipientTitle={state.details.recipientTitle}
          preparedDate={state.details.preparedDate}
          meetingDateReference={
            state.details.meetingDateReference || state.details.preparedDate
          }
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
          signatureSrc={SIGNATURE_SRC}
        />
      </div>
    </div>
  );
}
