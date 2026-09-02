/**
 * LetterFromCoo — Section 2 of the Shomvob proposal format.
 *
 * Matches: shomvob_proposal_format.md — Section 2, and the original letter
 * text (letter_from_coo.txt) verbatim for all default paragraph content.
 *
 * Per spec: "The body paragraphs are largely static. Only the client name,
 * date, and recipient title are dynamic." Each paragraph below has an
 * optional override prop — leave it out and you get the original letter
 * text with just the name/date placeholders filled in. This is intentional:
 * the letter should almost never need custom copy per client, but the
 * escape hatch exists for the rare case it does.
 *
 * Depends on:
 *  - lib/company-stats.ts (COMPANY_STATS.organizationsServed, .foundedYear)
 *    — adjust the import path below if your Cursor agent placed this file
 *    somewhere else (e.g. config/company-stats.ts).
 *  - A signature image asset — defaults to /hasib-rahman-signature.png,
 *    override via `signatureSrc` if the real filename differs.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";
import { COMPANY_STATS } from "@/lib/company-stats";

const DEFAULT_RECIPIENT_TITLE = "Managing Director";
const DEFAULT_SIGNATURE_SRC = "/hasib-rahman-signature.png";

export interface LetterFromCooProps {
  /**
   * The client/company name from the first part of the form (cover page).
   * Used in the footer ("Proposal for [clientName] — Page N") and always
   * used for the "Subject:" line, regardless of `addresseeName`.
   */
  clientName: string;
  /**
   * Who the letter is addressed to. This is deliberately separate from
   * `clientName` — a proposal's cover/footer name and its letter's legal
   * addressee aren't always identical (e.g. "Terraprime Hotels & Resorts
   * Ltd." on the cover vs. "Terraprime Group" as the addressee). Resolve
   * `letterAddresseeName ?? clientName` before passing this in — this
   * component doesn't do that fallback itself, it just renders what it's given.
   */
  addresseeName: string;
  /** Defaults to "Managing Director". */
  recipientTitle?: string;
  /** The "Date:" line at the top of the letter. */
  preparedDate: Date | string;
  /** Powers "Following our meeting on [X]". Rendered as "Month DD" (no year), matching the original letter's convention. */
  meetingDateReference: Date | string;
  /** Defaults to 2 — override if section ordering ever changes. */
  pageNumber?: number;
  signatureSrc?: string;
  /** Escape hatch if the Shomvob logo path differs per-deployment. */
  shomvobLogoSrc?: string;
  /** Hides the "No Upfront Cost" section when a rollout charge is included. */
  includeRolloutCharge?: boolean;

  // Optional overrides — omit any of these to use the original letter text.
  openingParagraph?: string;
  solutionOverviewParagraph?: string;
  noUpfrontCostsParagraph?: string;
  ongoingSupportParagraph?: string;
  closingParagraph?: string;
}

function formatFullDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return `${day} ${month}, ${d.getFullYear()}`;
}

/** "August 06" — no year, matching the original letter's phrasing. */
function formatMeetingDateReference(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return `${month} ${day}`;
}

function defaultOpeningParagraph(): string {
  return `Shomvob Technologies Limited, a leading provider of cloud-based HR and Payroll solutions, is pleased to offer a SaaS Based Human Resource Information System (HRIS) solution. Since ${COMPANY_STATS.foundedYear}, we've helped over ${COMPANY_STATS.organizationsServed} organizations streamline HR operations with secure and scalable technology.`;
}

function defaultSolutionOverviewParagraph(addresseeName: string, meetingDateLabel: string): string {
  return `Following our meeting on ${meetingDateLabel}, we are excited to propose a fully managed, cloud-based HRIS solution for ${addresseeName}. Our SaaS HRIS system is designed for seamless access from anywhere, minimizing IT infrastructure requirements while ensuring robust, secure, and real-time access to your HR and payroll data.`;
}

const DEFAULT_NO_UPFRONT_COSTS_PARAGRAPH =
  "As a SaaS offering, our HRIS solution is hosted on the cloud, meaning there are no upfront costs for hardware or infrastructure. You only pay for what you use, with predictable subscription fees. This model ensures scalability as your organization grows, with the flexibility to add or reduce features based on your evolving needs.";

const DEFAULT_ONGOING_SUPPORT_PARAGRAPH =
  "With Shomvob SaaS HRIS, you benefit from continuous system updates and feature enhancements, ensuring that your organization always has access to the latest tools and capabilities without additional effort or cost. Our dedicated support team is available to assist with any queries or issues, ensuring smooth operation of the system.";

function defaultClosingParagraph(addresseeName: string): string {
  return `We are thrilled at the opportunity to partner with ${addresseeName} and help optimize your HR operations with our cutting-edge technology. Please reach out for further details or any clarifications you may need.`;
}

export default function LetterFromCoo({
  clientName,
  addresseeName,
  recipientTitle = DEFAULT_RECIPIENT_TITLE,
  preparedDate,
  meetingDateReference,
  pageNumber = 2,
  signatureSrc = DEFAULT_SIGNATURE_SRC,
  shomvobLogoSrc,
  includeRolloutCharge = false,
  openingParagraph,
  solutionOverviewParagraph,
  noUpfrontCostsParagraph,
  ongoingSupportParagraph,
  closingParagraph,
}: LetterFromCooProps) {
  const meetingDateLabel = formatMeetingDateReference(meetingDateReference);

  const opening = openingParagraph ?? defaultOpeningParagraph();
  const solutionOverview =
    solutionOverviewParagraph ?? defaultSolutionOverviewParagraph(addresseeName, meetingDateLabel);
  const noUpfrontCosts = noUpfrontCostsParagraph ?? DEFAULT_NO_UPFRONT_COSTS_PARAGRAPH;
  const ongoingSupport = ongoingSupportParagraph ?? DEFAULT_ONGOING_SUPPORT_PARAGRAPH;
  const closing = closingParagraph ?? defaultClosingParagraph(addresseeName);

  return (
    <LetterheadFrame
      clientName={clientName}
      pageNumber={pageNumber}
      shomvobLogoSrc={shomvobLogoSrc}
    >
      <div className="mb-[7mm] text-[9.3pt] text-brand_muted">
        Date: {formatFullDate(preparedDate)}
      </div>

      <div className="mb-[5mm] text-[9.8pt] leading-[1.55] text-[#333]">
        To,
        <br />
        {recipientTitle}
        <br />
        <b className="text-brand_ink">{addresseeName}</b>
      </div>

      <div className="mb-[6mm] text-[9.8pt] font-bold text-brand_ink">
        Subject: Proposal for SaaS Based Human Resource Information System for {clientName}.
      </div>

      <div className="text-[9.6pt] leading-[1.68] text-[#333]">
        <p className="mb-[4mm] text-justify">Dear Sir,</p>

        <p className="mb-[4mm] text-justify">{opening}</p>

        <h4 className="mb-[2mm] mt-[5mm] text-[9.8pt] font-bold text-brand_green_deep">
          Solution Overview
        </h4>
        <p className="mb-[4mm] text-justify">{solutionOverview}</p>

        {!includeRolloutCharge ? (
          <>
            <h4 className="mb-[2mm] mt-[5mm] text-[9.8pt] font-bold text-brand_green_deep">
              No Upfront Cost
            </h4>
            <p className="mb-[4mm] text-justify">{noUpfrontCosts}</p>
          </>
        ) : null}

        <h4 className="mb-[2mm] mt-[5mm] text-[9.8pt] font-bold text-brand_green_deep">
          Ongoing Support &amp; Updates
        </h4>
        <p className="mb-[4mm] text-justify">{ongoingSupport}</p>

        <p className="mb-[4mm] text-justify">{closing}</p>
      </div>

      <div className="mt-[8mm]">
        <img src={signatureSrc} alt="Signature" className="mb-[1mm] ml-[-2mm] h-[16mm]" />
        <div className="text-[9.8pt] font-bold text-brand_ink">Hasib Rahman</div>
        <div className="text-[9pt] text-[#555]">Chief Operating Officer</div>
        <div className="text-[9pt] text-[#555]">Shomvob Technologies Limited</div>
      </div>
    </LetterheadFrame>
  );
}