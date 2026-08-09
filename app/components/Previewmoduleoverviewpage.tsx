"use client";

/**
 * Module overview preview — loads wizard inputs from localStorage and
 * renders Moduleoverview at true A4 size. Same pattern as
 * PreviewLetterPage.tsx / PreviewCommercialTermsPage.tsx.
 *
 * pageNumber is hardcoded to 3 here, and this is no longer a placeholder —
 * now that Section 3 is a fixed one-page format, the whole document's page
 * count is fixed too: Cover=1, Letter=2, Solution=3, Commercial=4, always.
 * (Worth updating PreviewCommercialTermsPage.tsx's pageNumber comment to
 * reflect this too — it was written when Section 3's length was still
 * variable and treated 4 as a guess.)
 */

import Moduleoverview from "@/app/components/Moduleoverview";
import {
  loadClientName,
  loadProposalDetails,
  type ProposalDetails,
} from "@/lib/presentation-session";
import { useEffect, useState } from "react";

const SHOMVOB_LOGO_SRC = "/resources/shomvob_hr_text.png";
const PAGE_NUMBER = 3;

type PreviewState = {
  clientName: string;
  details: ProposalDetails | null;
};

export default function PreviewModuleOverviewPage() {
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

  const selectedModuleIds = state.details.selectedModules ?? [];

  return (
    <div className="flex flex-col items-center bg-[#e5e5e5] pb-16">
      <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
        Module Overview
      </p>
      <div className="shadow-2xl shadow-black/30">
        <Moduleoverview
          clientName={state.clientName}
          preparedDate={state.details.preparedDate}
          validityDays={state.details.validityDays}
          selectedModuleIds={selectedModuleIds}
          problemStatementHeading={state.details.problemStatementHeading}
          problemStatementHtml={state.details.problemStatementText}
          pageNumber={PAGE_NUMBER}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </div>
    </div>
  );
}