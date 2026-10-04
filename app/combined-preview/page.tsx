"use client";

/**
 * Combined HRIS + device proposal preview — five or six A4 pages at true
 * print size on a gray backdrop, read back out of localStorage.
 *
 * Three of the five page types are reused unchanged: CoverPage, and
 * Moduleoverview for the solution section (one page, or two when the module
 * list overflows — splitModulesAcrossPages owns that decision, exactly as in
 * the HRIS preview). Only the letter, the commercial table and the terms page
 * are specific to this format.
 *
 * Reads through useSyncExternalStore rather than an effect, like the SLA and
 * device previews, so every page is present in the first committed render —
 * the export route waits on a page count, and a second-pass mount is a race
 * it does not need to run.
 */

import Link from "next/link";
import { useSyncExternalStore } from "react";
import CoverPage from "@/app/components/CoverPage";
import Moduleoverview from "@/app/components/Moduleoverview";
import CombinedLetter from "@/app/components/combined/CombinedLetter";
import CombinedCommercial from "@/app/components/combined/CombinedCommercial";
import CombinedTerms from "@/app/components/combined/CombinedTerms";
import CombinedPrintPdfButton from "@/app/components/combined/CombinedPrintPdfButton";
import {
  hasProblemStatementContent,
  MODULE_SECTION_START_PAGE,
  splitModulesAcrossPages,
} from "@/lib/module-page-layout";
import {
  COMBINED_DETAILS_KEY,
  COMBINED_LOGO_KEY,
  loadCombinedDetails,
  loadCombinedLogo,
  type CombinedProposalDetails,
} from "@/lib/combined-session";

const SHOMVOB_LOGO_SRC = "/resources/shomvob_hr_logo.png";
const SIGNATURE_SRC = "/resources/hasib_bhai_sig.png";

type PreviewSnapshot = {
  details: CombinedProposalDetails | null;
  logoDataUrl: string | null;
};

const EMPTY_SNAPSHOT: PreviewSnapshot = { details: null, logoDataUrl: null };

function subscribeToCombinedStorage() {
  return () => undefined;
}

let cachedDetailsRaw: string | null | undefined;
let cachedLogoRaw: string | null | undefined;
let cachedSnapshot: PreviewSnapshot = EMPTY_SNAPSHOT;

/** Must return a stable reference while the underlying strings are unchanged,
 * or useSyncExternalStore re-renders forever. */
function getCombinedSnapshot(): PreviewSnapshot {
  const detailsRaw = localStorage.getItem(COMBINED_DETAILS_KEY);
  const logoRaw = localStorage.getItem(COMBINED_LOGO_KEY);

  if (detailsRaw === cachedDetailsRaw && logoRaw === cachedLogoRaw) {
    return cachedSnapshot;
  }

  cachedDetailsRaw = detailsRaw;
  cachedLogoRaw = logoRaw;
  cachedSnapshot = {
    details: loadCombinedDetails(),
    logoDataUrl: loadCombinedLogo(),
  };
  return cachedSnapshot;
}

function PageFrame({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="print-stage flex flex-col items-center bg-[#e5e5e5] pb-16">
      <p className="print-hide mb-6 text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
        {label}
      </p>
      <div className="print-stage shadow-2xl shadow-black/30">{children}</div>
    </div>
  );
}

export default function CombinedPreviewPage() {
  const { details, logoDataUrl } = useSyncExternalStore<PreviewSnapshot>(
    subscribeToCombinedStorage,
    getCombinedSnapshot,
    () => EMPTY_SNAPSHOT,
  );

  if (!details) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#e5e5e5] px-6 text-center text-[#0c3d20]">
        <h1 className="text-lg font-semibold">No combined proposal to preview</h1>
        <p className="max-w-md text-sm text-[#0c3d20]/70">
          Fill in the combined proposal builder first, then continue to preview.
        </p>
        <Link
          href="/combined-builder"
          className="rounded-xl bg-[#edb713] px-6 py-3 text-sm font-semibold text-[#0c3d20] transition hover:bg-[#f5c832]"
        >
          Go to combined builder
        </Link>
      </main>
    );
  }

  const addresseeName = details.letterAddresseeName?.trim() || details.clientName;
  const hasPreparedBy = Boolean(
    details.preparedByName ||
      details.preparedByTitle ||
      details.preparedByPhone ||
      details.preparedByEmail,
  );

  const split = splitModulesAcrossPages(
    details.selectedModules,
    hasProblemStatementContent(details.problemStatementText),
  );
  const commercialPage = MODULE_SECTION_START_PAGE + split.pageCount;
  const termsPage = commercialPage + 1;

  const moduleSharedProps = {
    clientName: details.clientName,
    preparedDate: details.preparedDate,
    validityDays: details.validityDays,
    shomvobLogoSrc: SHOMVOB_LOGO_SRC,
  };

  return (
    <main className="print-stage bg-[#e5e5e5] pt-10">
      <div className="print-hide mx-auto mb-6 flex w-full max-w-[210mm] items-center justify-between px-4 text-sm">
        <Link
          href="/combined-builder"
          className="font-medium text-[#0c3d20]/70 transition hover:text-[#0c3d20]"
        >
          ← Edit combined proposal
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#0c3d20]/50">
          HRIS + device preview
        </span>
      </div>

      <PageFrame label="Cover">
        <CoverPage
          clientName={details.clientName}
          clientLogoSrc={logoDataUrl ?? undefined}
          documentTitle={details.documentTitle}
          preparedDate={details.preparedDate}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
          preparedBy={
            hasPreparedBy
              ? {
                  name: details.preparedByName,
                  title: details.preparedByTitle,
                  phone: details.preparedByPhone,
                  email: details.preparedByEmail,
                }
              : undefined
          }
        />
      </PageFrame>

      <PageFrame label="Letter from COO">
        <CombinedLetter
          clientName={details.clientName}
          addresseeName={addresseeName}
          recipientName={details.recipientName}
          recipientTitle={details.recipientTitle}
          preparedDate={details.preparedDate}
          meetingDateReference={
            details.meetingDateReference || details.preparedDate
          }
          keyBenefits={details.keyBenefits}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
          signatureSrc={SIGNATURE_SRC}
        />
      </PageFrame>

      <PageFrame label="Module Overview">
        <Moduleoverview
          {...moduleSharedProps}
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
      </PageFrame>

      {split.pageCount === 2 ? (
        <PageFrame label="Module Overview (continued)">
          <Moduleoverview
            {...moduleSharedProps}
            variant="continued"
            selectedModuleIds={split.secondPageModuleIds}
            problemStatementHeading={details.problemStatementHeading}
            problemStatementHtml={details.problemStatementText}
            pageNumber={MODULE_SECTION_START_PAGE + 1}
          />
        </PageFrame>
      ) : null}

      <PageFrame label="Commercial Terms">
        <CombinedCommercial
          clientName={details.clientName}
          addresseeName={addresseeName}
          details={details}
          pageNumber={commercialPage}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </PageFrame>

      <PageFrame label="Terms & Conditions">
        <CombinedTerms
          clientName={details.clientName}
          vatPercent={details.vatPercent}
          warrantyPeriod={details.warrantyPeriod}
          paymentTerms={details.paymentTerms}
          deliveryCity={details.deliveryCity}
          deliveryLeadTime={details.deliveryLeadTime}
          validityDays={details.validityDays}
          pageNumber={termsPage}
          shomvobLogoSrc={SHOMVOB_LOGO_SRC}
        />
      </PageFrame>

      <CombinedPrintPdfButton details={details} />
    </main>
  );
}
