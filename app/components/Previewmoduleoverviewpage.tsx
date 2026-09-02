"use client";

/**
 * Module overview preview — loads wizard inputs from localStorage and renders
 * Section 3 at true A4 size. Same pattern as PreviewLetterPage.tsx /
 * PreviewCommercialTermsPage.tsx.
 *
 * The section is one or two pages depending on how many modules are selected
 * and whether there's a problem statement — splitModulesAcrossPages() owns
 * that decision (see lib/module-page-layout.ts), this component just renders
 * what it returns. Sections after this one shift down by a page when it
 * overflows; PreviewCommercialTermsPage.tsx derives its number the same way.
 */

import Moduleoverview from "@/app/components/Moduleoverview";
import {
  hasProblemStatementContent,
  MODULE_SECTION_START_PAGE,
  splitModulesAcrossPages,
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

  const { details } = state;
  const selectedModuleIds = details.selectedModules ?? [];
  const problemStatementPresent = hasProblemStatementContent(
    details.problemStatementText,
  );
  const split = splitModulesAcrossPages(
    selectedModuleIds,
    problemStatementPresent,
  );

  const sharedProps = {
    clientName: state.clientName,
    preparedDate: details.preparedDate,
    validityDays: details.validityDays,
    shomvobLogoSrc: SHOMVOB_LOGO_SRC,
  };

  return (
    <div className="print-stage flex flex-col items-center bg-[#e5e5e5] pb-16">
      <p className="print-hide mb-6 text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
        Module Overview
      </p>
      <div className="print-stage shadow-2xl shadow-black/30">
        <Moduleoverview
          {...sharedProps}
          selectedModuleIds={split.firstPageModuleIds}
          problemStatementHeading={
            split.problemStatementOnSecondPage
              ? undefined
              : details.problemStatementHeading
          }
          problemStatementHtml={
            split.problemStatementOnSecondPage
              ? undefined
              : details.problemStatementText
          }
          pageNumber={MODULE_SECTION_START_PAGE}
        />
      </div>

      {split.pageCount === 2 ? (
        <div className="print-stage mt-16 shadow-2xl shadow-black/30">
          <Moduleoverview
            {...sharedProps}
            variant="continued"
            selectedModuleIds={split.secondPageModuleIds}
            problemStatementHeading={details.problemStatementHeading}
            problemStatementHtml={details.problemStatementText}
            pageNumber={MODULE_SECTION_START_PAGE + 1}
          />
        </div>
      ) : null}
    </div>
  );
}
