/**
 * Commercialterms — Section 4 of the Shomvob proposal format.
 *
 * Matches: shomvob_proposal_format.md — Section 4.
 *
 * This is always the LAST page of a proposal (fixed section order per the
 * spec: Cover, Letter, Solution, Commercial). Two things follow from that:
 *
 *  1. `pageNumber` has no default here, unlike Letterfromcoo's `pageNumber = 2`.
 *     Section 3 (Solution) is variable-length — 1 page for a simple scope,
 *     4+ for something like Taza Hair Oil's 6-module proposal — so whatever
 *     assembles the final document has to compute this page's real number
 *     and pass it in. There's no safe default to guess.
 *
 *  2. The footer always shows Letterheadframe's default "Shomvob Technologies
 *     Ltd" label — this component intentionally never passes `footerContact`.
 *     A per-proposal sales contact used to be collected for this footer, but
 *     that information isn't needed in the PDF and was removed.
 *
 * `addresseeName` vs `clientName`: same split as Letterfromcoo. The
 * commercial table's "Client Name" row and the intro paragraph use
 * `addresseeName` (matches how the actual Terraprime proposal used "Terraprime
 * Group" here, not the cover's "Terraprime Hotels & Resorts Ltd."). Resolve
 * `letterAddresseeName ?? clientName` at the page level, same as the letter.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";

const DEFAULT_VAT_PERCENT = 5;

export interface CommercialTermsProps {
  /** Passed through to Letterheadframe's footer right-hand label. */
  clientName: string;
  /** Used in the intro paragraph and the table's "Client Name" row. */
  addresseeName: string;
  /** Required — Section 3's length varies, so this can't be defaulted. */
  pageNumber: number;

  employeeCount: number;
  mrcFee: number;
  /** Omit entirely to hide the "Software Rollout Charge" row. */
  rolloutCharge?: number;
  /** Omit entirely to hide the "Field Employee Tracking" row. */
  fieldTrackingFee?: number;
  /** Defaults to 5. */
  vatPercent?: number;

  /** Override the intro paragraph. Omit to use the canonical text. */
  introParagraph?: string;
  shomvobLogoSrc?: string;
}

function formatBdt(amount: number): string {
  return `${new Intl.NumberFormat("en-US").format(amount)} BDT`;
}

function defaultIntroParagraph(addresseeName: string): string {
  return `Shomvob Technology Limited delivers high-quality results at highly competitive prices. As a special consideration for building a long-term business relationship with ${addresseeName}, Shomvob Technologies Limited proposes the following attractive commercial terms.`;
}

export default function Commercialterms({
  clientName,
  addresseeName,
  pageNumber,
  employeeCount,
  mrcFee,
  rolloutCharge,
  fieldTrackingFee,
  vatPercent = DEFAULT_VAT_PERCENT,
  introParagraph,
  shomvobLogoSrc,
}: CommercialTermsProps) {
  const intro = introParagraph ?? defaultIntroParagraph(addresseeName);

  const termsAndConditions = [
    `${vatPercent}% VAT will be added on the total invoice amount.`,
    "Payment should be made through bank transfer or cheque in favor of Shomvob Technologies Ltd.",
    "Any additional features or modules requested after the trial-and-error period will be subject to additional charges, based on scope and requirements.",
  ];

  return (
    <LetterheadFrame
      clientName={clientName}
      pageNumber={pageNumber}
      shomvobLogoSrc={shomvobLogoSrc}
    >
      <div className="font-sans">
        <div className="mb-[3.5mm] text-[8.6pt] font-bold uppercase tracking-[0.16em] text-brand_green">
          Proposed Financial
        </div>

        <h1 className="mb-[4mm] text-[16pt] font-extrabold text-brand_ink">
          Commercial Terms &amp; Conditions
        </h1>

        <p className="mb-[5mm] text-[9.8pt] leading-[1.62] text-[#3a3a3a]">{intro}</p>

      <table className="mb-[6mm] w-full border-collapse">
        <tbody>
          <tr>
            <th className="bg-brand_green px-[4mm] py-[2.8mm] text-left text-[8.8pt] font-bold text-white">
              Category
            </th>
            <th className="bg-brand_green px-[4mm] py-[2.8mm] text-left text-[8.8pt] font-bold text-white">
              Details
            </th>
          </tr>
          <tr>
            <td className="w-[62mm] border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_ink">
              Client Name
            </td>
            <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] text-[#3a3a3a]">
              {addresseeName}
            </td>
          </tr>
          <tr>
            <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_ink">
              Number of Employees
            </td>
            <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] text-[#3a3a3a]">
              {employeeCount} Employees
            </td>
          </tr>
          <tr>
            <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_ink">
              HRIS Monthly Subscription Fee (MRC)
            </td>
            <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_green_deep">
              {formatBdt(mrcFee)}
            </td>
          </tr>
          {rolloutCharge !== undefined ? (
            <tr>
              <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_ink">
                Software Rollout Charge
              </td>
              <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_green_deep">
                {formatBdt(rolloutCharge)}
              </td>
            </tr>
          ) : null}
          <tr>
            <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_ink">
              Support
            </td>
            <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] text-[#3a3a3a]">
              Maintenance &amp; Technical Support Free
            </td>
          </tr>
          {fieldTrackingFee !== undefined ? (
            <tr>
              <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_ink">
                Field Employee Tracking (MRC)
              </td>
              <td className="border-b border-[#dcdcdc] px-[4mm] py-[2.8mm] align-top text-[9pt] font-bold text-brand_green_deep">
                Per User {formatBdt(fieldTrackingFee)}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2 className="mb-[3.5mm] text-[12.5pt] font-bold text-brand_green">
        Additional Services During Subscription
      </h2>
      <div className="mb-[6mm] border-l-[3pt] border-brand_green bg-[#eef6ef] px-[5mm] py-[3.5mm] text-[9pt] leading-[1.55] text-[#333]">
        <b className="text-brand_ink">Customization</b> — Any customization beyond the
        standard features will be subject to additional charges. A detailed
        feature-wise quotation will be shared after the requirement analysis is
        completed.
      </div>

      <h2 className="mb-[3.5mm] text-[12.5pt] font-bold text-brand_green">
        Terms and Conditions
      </h2>
        <ol className="text-[9pt] leading-[1.6] text-[#333]">
          {termsAndConditions.map((text, index) => (
            <li key={index} className="relative mb-[2.5mm] pl-[5mm]">
              <span className="absolute left-0 font-bold text-brand_green_deep">
                {index + 1}.
              </span>
              {text}
            </li>
          ))}
        </ol>
      </div>
    </LetterheadFrame>
  );
}