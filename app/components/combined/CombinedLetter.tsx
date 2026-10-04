/**
 * CombinedLetter — page 2 of the combined HRIS + device proposal.
 *
 * Reconciles the two existing letters rather than concatenating them. Taken
 * element by element against proposal_format.md Section 2 (the HRIS rules)
 * and the device letter:
 *
 *  - Recipient block uses the device shape (name / title / company, both
 *    optional) because it is a superset of the HRIS one (title / company).
 *  - The opening paragraph is the HRIS one with the hardware named in it.
 *  - "Solution Overview" and "Ongoing Support & Updates" are HRIS verbatim.
 *  - "No Upfront Costs & Scalable Solution" is DROPPED. It states there are
 *    no upfront hardware costs, which directly contradicts a document that
 *    quotes hardware. The HRIS flow already suppresses it whenever a rollout
 *    charge is set; here it can never be correct.
 *  - The device letter's "committed to supporting X" paragraph is DROPPED as
 *    redundant: its closing paragraph is byte-identical to the HRIS one, so
 *    the two together said the same thing twice.
 *  - The hardware paragraph is compressed from the device letter's five lines
 *    to two, keeping all four claims (devices on site, direct platform
 *    connection, automatic sync, flow through to leave/overtime/payroll).
 *  - Key Benefits sit under the hardware heading with no heading of their
 *    own, which is what keeps six bullets on the page.
 *
 * Those two drops are what buy back the room; the page is designed to hold
 * all six benefit bullets so that any subset a rep picks also fits.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";
import { COMPANY_STATS } from "@/lib/company-stats";

const DEFAULT_SIGNATURE_SRC = "/resources/hasib_bhai_sig.png";

export interface CombinedLetterProps {
  /** Footer label and the subject line's trailing name. */
  clientName: string;
  /** Letter "To," company. Resolve `letterAddresseeName ?? clientName` at the
   * call site, as the other two letters expect. */
  addresseeName: string;
  /** Both optional — the "To," block drops whichever is absent. */
  recipientName?: string;
  recipientTitle?: string;
  preparedDate: Date | string;
  /** Rendered "Month DD", matching the original letter's phrasing. */
  meetingDateReference: Date | string;
  keyBenefits: string[];
  pageNumber?: number;
  signatureSrc?: string;
  shomvobLogoSrc?: string;
}

function formatFullDate(date: Date | string): string {
  const parsed =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(
          Number(date.slice(0, 4)),
          Number(date.slice(5, 7)) - 1,
          Number(date.slice(8, 10)),
        )
      : new Date(date);

  if (Number.isNaN(parsed.getTime())) return String(date);

  const day = parsed.getDate().toString().padStart(2, "0");
  const month = parsed.toLocaleDateString("en-US", { month: "long" });
  return `${day} ${month}, ${parsed.getFullYear()}`;
}

/** "August 06" — no year, matching the original letter's phrasing. */
function formatMeetingDate(date: Date | string): string {
  const parsed =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(
          Number(date.slice(0, 4)),
          Number(date.slice(5, 7)) - 1,
          Number(date.slice(8, 10)),
        )
      : new Date(date);

  if (Number.isNaN(parsed.getTime())) return String(date);

  const day = parsed.getDate().toString().padStart(2, "0");
  const month = parsed.toLocaleDateString("en-US", { month: "long" });
  return `${month} ${day}`;
}

export default function CombinedLetter({
  clientName,
  addresseeName,
  recipientName,
  recipientTitle,
  preparedDate,
  meetingDateReference,
  keyBenefits,
  pageNumber = 2,
  signatureSrc = DEFAULT_SIGNATURE_SRC,
  shomvobLogoSrc,
}: CombinedLetterProps) {
  return (
    <LetterheadFrame
      clientName={clientName}
      pageNumber={pageNumber}
      shomvobLogoSrc={shomvobLogoSrc}
    >
      <div className="mb-[5mm] text-[9.3pt] text-brand_muted">
        Date: {formatFullDate(preparedDate)}
      </div>

      <div className="mb-[4mm] text-[9.8pt] leading-[1.55] text-[#333]">
        To,
        {recipientName ? (
          <>
            <br />
            <b className="text-brand_ink">{recipientName}</b>
          </>
        ) : null}
        {recipientTitle ? (
          <>
            <br />
            {recipientTitle}
          </>
        ) : null}
        <br />
        <b className="text-brand_ink">{addresseeName}</b>
      </div>

      <div className="mb-[4mm] text-[9.8pt] font-bold leading-[1.45] text-brand_ink">
        Subject: Proposal for SaaS Based Human Resource Information System
        &amp; Biometric Attendance Device for {clientName}.
      </div>

      <div className="text-[9.5pt] leading-[1.56] text-[#333]">
        <p className="mb-[3mm] text-justify">Dear Sir,</p>

        <p className="mb-[3mm] text-justify">
          Shomvob Technologies Limited, a leading provider of cloud-based HR
          and Payroll solutions, is pleased to offer a SaaS Based Human
          Resource Information System (HRIS) together with integrated biometric
          attendance hardware. Since {COMPANY_STATS.foundedYear}, we&apos;ve
          helped over {COMPANY_STATS.organizationsServed} organizations
          streamline HR operations with secure and scalable technology.
        </p>

        <h4 className="mb-[1.6mm] mt-[3.5mm] text-[9.8pt] font-bold text-brand_green_deep">
          Solution Overview
        </h4>
        <p className="mb-[3mm] text-justify">
          Following our meeting on {formatMeetingDate(meetingDateReference)}, we
          are excited to propose a fully managed, cloud-based HRIS solution for{" "}
          {addresseeName}. Our SaaS HRIS system is designed for seamless access
          from anywhere, minimizing IT infrastructure requirements while
          ensuring robust, secure, and real-time access to your HR and payroll
          data.
        </p>

        <h4 className="mb-[1.6mm] mt-[3.5mm] text-[9.8pt] font-bold text-brand_green_deep">
          Biometric Attendance Hardware
        </h4>
        <p className="mb-[2.5mm] text-justify">
          Alongside the platform, we propose biometric attendance devices
          installed at your premises and connected directly to the Shomvob HR
          system. Punches sync automatically into attendance, leave, overtime
          and payroll — no manual export.
        </p>

        {keyBenefits.length > 0 ? (
          <ul className="mb-[3.5mm]">
            {keyBenefits.map((benefit) => (
              <li key={benefit} className="relative mb-[1.2mm] pl-[5mm]">
                <span className="absolute left-[1mm] top-[1.5mm] h-[1.3mm] w-[1.3mm] rounded-full bg-brand_green" />
                {benefit}
              </li>
            ))}
          </ul>
        ) : null}

        <h4 className="mb-[1.6mm] mt-[3.5mm] text-[9.8pt] font-bold text-brand_green_deep">
          Ongoing Support &amp; Updates
        </h4>
        <p className="mb-[3mm] text-justify">
          With Shomvob SaaS HRIS, you benefit from continuous system updates and
          feature enhancements, ensuring that your organization always has
          access to the latest tools and capabilities without additional effort
          or cost. Our dedicated support team is available to assist with any
          queries or issues, ensuring smooth operation of the system.
        </p>

        <p className="mb-[3mm] text-justify">
          We are thrilled at the opportunity to partner with {addresseeName} and
          help optimize your HR operations with our cutting-edge technology.
          Please reach out for further details or any clarifications you may
          need.
        </p>
      </div>

      <div className="mt-[5mm]">
        <img src={signatureSrc} alt="Signature" className="mb-[1mm] ml-[-2mm] h-[15mm]" />
        <div className="text-[9.8pt] font-bold text-brand_ink">Hasib Rahman</div>
        <div className="text-[9pt] text-[#555]">Chief Operating Officer</div>
        <div className="text-[9pt] text-[#555]">Shomvob Technologies Limited</div>
      </div>
    </LetterheadFrame>
  );
}
