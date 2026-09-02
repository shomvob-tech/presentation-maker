"use client";

/**
 * Commercial terms page preview — loads wizard inputs from localStorage and
 * renders Commercialterms at true A4 size. Meant to sit below the letter in
 * /proposal-preview, same pattern as PreviewLetterPage.tsx.
 *
 * This is the proposal's last page, so its number depends on how long Section
 * 3 ran: 4 when the module overview fits one page, 5 when it overflows onto a
 * continuation page. Both this and Previewmoduleoverviewpage.tsx read that
 * from lib/module-page-layout.ts rather than passing state between previews.
 */

import Commercialterms from "@/app/components/Commercialterms";
import {
  hasProblemStatementContent,
  MODULE_SECTION_START_PAGE,
  moduleSectionPageCount,
} from "@/lib/module-page-layout";
import {
  loadClientName,
  loadProposalDetails,
  type ProposalDetails,
} from "@/lib/presentation-session";
import { useEffect, useState } from "react";

const SHOMVOB_LOGO_SRC = "/resources/shomvob_hr_logo.png";

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

  const pageNumber =
    MODULE_SECTION_START_PAGE +
    moduleSectionPageCount(
      state.details.selectedModules ?? [],
      hasProblemStatementContent(state.details.problemStatementText),
    );

  return (
    <div className="print-stage flex flex-col items-center bg-[#e5e5e5] pb-16">
      <p className="print-hide mb-6 text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
        Commercial Terms
      </p>
      <div className="print-stage shadow-2xl shadow-black/30">
        <Commercialterms
          clientName={state.clientName}
          addresseeName={addresseeName}
          pageNumber={pageNumber}
          employeeCount={state.details.employeeCount}
          mrcFee={state.details.mrcFee}
          rolloutCharge={state.details.rolloutCharge}
          fieldTrackingFee={state.details.fieldTrackingFee}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </div>
    </div>
  );
}