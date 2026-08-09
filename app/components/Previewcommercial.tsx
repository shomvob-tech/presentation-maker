"use client";

/**
 * Commercial terms page preview — loads wizard inputs from localStorage and
 * renders Commercialterms at true A4 size. Meant to sit below the letter in
 * /proposal-preview, same pattern as PreviewLetterPage.tsx.
 *
 * `pageNumber` is hardcoded to 4 here since this is a standalone preview and
 * Section 3 doesn't exist yet to compute a real page count from. Once the
 * solution section is wired up, replace this with whatever the assembled
 * proposal calculates as this page's actual position.
 */

import Commercialterms from "@/app/components/Commercialterms";
import {
  loadClientName,
  loadProposalDetails,
  type ProposalDetails,
} from "@/lib/presentation-session";
import { useEffect, useState } from "react";

const SHOMVOB_LOGO_SRC = "/resources/shomvob_hr_text.png";
const PLACEHOLDER_PAGE_NUMBER = 4;

type PreviewState = {
  clientName: string;
  details: ProposalDetails | null;
};

export default function PreviewCommercialTermsPage() {
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
        Commercial Terms
      </p>
      <div className="shadow-2xl shadow-black/30">
        <Commercialterms
          clientName={state.clientName}
          addresseeName={addresseeName}
          pageNumber={PLACEHOLDER_PAGE_NUMBER}
          employeeCount={state.details.employeeCount}
          mrcFee={state.details.mrcFee}
          rolloutCharge={state.details.rolloutCharge}
          fieldTrackingFee={state.details.fieldTrackingFee}
          contactName={state.details.contactName}
          contactTeam={state.details.contactTeam}
          contactEmail={state.details.contactEmail}
          contactPhone={state.details.contactPhone}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </div>
    </div>
  );
}