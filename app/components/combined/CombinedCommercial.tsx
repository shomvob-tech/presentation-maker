/**
 * CombinedCommercial — the commercial page of the combined proposal, and the
 * only genuinely new page in this format.
 *
 * One itemised table carrying both halves of the deal, grouped by how each
 * line bills. The grouping is the whole point: a single grand total summing a
 * monthly subscription with one-off hardware reads as a one-time price when
 * most of it recurs every month. So the table totals the two halves
 * separately and the only figure that adds them — "First invoice" — says in
 * the row beneath it exactly what it is.
 *
 * Shape is the device quotation's eight columns rather than the HRIS
 * proposal's two-column label/value table, because only the itemised form can
 * carry hardware. The HRIS fees become line items in it: the subscription is
 * one month at the MRC, and field tracking is headcount x per-user fee, which
 * prints the real monthly figure instead of the HRIS page's "Per User X BDT".
 *
 * All figures are ex-VAT; VAT is a terms clause, as in the HRIS proposal.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";
import { formatQuoteAmount, lineTotal } from "@/lib/device-quote";
import {
  firstInvoiceTotal,
  monthlyTotal,
  oneTimeLines,
  oneTimeTotal,
  recurringLines,
  type QuoteLine,
} from "@/lib/combined-quote";
import type { CombinedProposalDetails } from "@/lib/combined-session";

export interface CombinedCommercialProps {
  clientName: string;
  addresseeName: string;
  details: CombinedProposalDetails;
  /** Required — the solution section is 1 or 2 pages, so this can't default. */
  pageNumber: number;
  introParagraph?: string;
  shomvobLogoSrc?: string;
}

const headCellClass =
  "bg-brand_green px-[2mm] py-[1.9mm] text-left text-[7.6pt] font-bold uppercase tracking-[0.03em] text-white";
const bodyCellClass =
  "border-b border-[#dcdcdc] px-[2mm] py-[1.9mm] align-top text-[8.2pt] text-[#3a3a3a]";
const groupCellClass =
  "bg-[#eef6ef] px-[2mm] py-[1.8mm] text-[7.6pt] font-bold uppercase tracking-[0.1em] text-brand_green_deep";
const subtotalLabelClass =
  "px-[2mm] py-[1.9mm] text-right text-[8.6pt] font-bold text-brand_ink";
const subtotalValueClass =
  "px-[2mm] py-[1.9mm] text-right text-[8.6pt] font-bold text-brand_green_deep";

function defaultIntroParagraph(addresseeName: string): string {
  return `As a special consideration for building a long-term relationship with ${addresseeName}, Shomvob Technologies Limited proposes the following commercial terms, covering both the HRIS subscription and the biometric attendance hardware.`;
}

function LineRows({
  lines,
  startIndex,
}: {
  lines: QuoteLine[];
  startIndex: number;
}) {
  return (
    <>
      {lines.map((line, index) => (
        <tr key={line.key}>
          <td className={bodyCellClass}>{startIndex + index}</td>
          <td className={`${bodyCellClass} font-bold text-brand_ink`}>
            {line.description}
          </td>
          <td className={bodyCellClass}>{line.brand}</td>
          <td className={bodyCellClass}>{line.modelNo}</td>
          <td className={bodyCellClass}>{line.uom}</td>
          <td className={`${bodyCellClass} text-right`}>{line.quantity}</td>
          <td className={`${bodyCellClass} text-right`}>
            {formatQuoteAmount(line.unitPrice)}
          </td>
          <td className={`${bodyCellClass} text-right font-bold text-brand_green_deep`}>
            {formatQuoteAmount(lineTotal(line))}
          </td>
        </tr>
      ))}
    </>
  );
}

export default function CombinedCommercial({
  clientName,
  addresseeName,
  details,
  pageNumber,
  introParagraph,
  shomvobLogoSrc,
}: CombinedCommercialProps) {
  const intro = introParagraph ?? defaultIntroParagraph(addresseeName);

  const recurring = recurringLines(details);
  const oneTime = oneTimeLines(details);
  const monthly = monthlyTotal(details);
  const upfront = oneTimeTotal(details);
  const firstInvoice = firstInvoiceTotal(details);

  return (
    <LetterheadFrame
      clientName={clientName}
      pageNumber={pageNumber}
      shomvobLogoSrc={shomvobLogoSrc}
    >
      <div className="font-sans">
        <div className="mb-[3mm] text-[8.6pt] font-bold uppercase tracking-[0.16em] text-brand_green">
          Proposed Financial
        </div>

        <h1 className="mb-[3.5mm] text-[16pt] font-extrabold text-brand_ink">
          Commercial Terms &amp; Conditions
        </h1>

        <p className="mb-[3.5mm] text-[9.4pt] leading-[1.55] text-[#3a3a3a]">{intro}</p>

        <table className="mb-[4mm] w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className={`${headCellClass} w-[8mm]`}>SN</th>
              <th className={headCellClass}>Description</th>
              <th className={`${headCellClass} w-[20mm]`}>Brand</th>
              <th className={`${headCellClass} w-[22mm]`}>Model No</th>
              <th className={`${headCellClass} w-[13mm]`}>UoM</th>
              <th className={`${headCellClass} w-[12mm] !text-right`}>Qnty</th>
              <th className={`${headCellClass} w-[22mm] !text-right`}>Unit Price</th>
              <th className={`${headCellClass} w-[24mm] !text-right`}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className={groupCellClass}>
                Recurring — billed monthly
              </td>
            </tr>
            <LineRows lines={recurring} startIndex={1} />
            <tr>
              <td colSpan={6} />
              <td className={subtotalLabelClass}>Monthly total</td>
              <td className={subtotalValueClass}>{formatQuoteAmount(monthly)}</td>
            </tr>

            <tr>
              <td colSpan={8} className={groupCellClass}>
                One-time — hardware, installation &amp; rollout
              </td>
            </tr>
            <LineRows lines={oneTime} startIndex={recurring.length + 1} />
            <tr>
              <td colSpan={6} />
              <td className={subtotalLabelClass}>One-time total</td>
              <td className={subtotalValueClass}>{formatQuoteAmount(upfront)}</td>
            </tr>
          </tbody>
        </table>

        {/* Deliberately not a "Grand Total" row inside the table — these two
            figures answer different questions and are labelled accordingly. */}
        <div className="mb-[4mm] flex justify-end">
          <table className="w-[92mm] border-collapse">
            <tbody>
              <tr>
                <td className="border-t-[1.5pt] border-brand_green px-[2mm] py-[2.4mm] text-[9.4pt] font-bold text-brand_ink">
                  First invoice
                  <span className="block text-[7.8pt] font-normal text-[#6a6a6a]">
                    One-time total plus the first month
                  </span>
                </td>
                <td className="border-t-[1.5pt] border-brand_green px-[2mm] py-[2.4mm] text-right align-top text-[11pt] font-extrabold text-brand_green_deep">
                  {formatQuoteAmount(firstInvoice)}
                </td>
              </tr>
              <tr>
                <td className="px-[2mm] py-[1.6mm] text-[9pt] font-bold text-brand_ink">
                  Thereafter
                </td>
                <td className="px-[2mm] py-[1.6mm] text-right text-[9pt] font-bold text-brand_green_deep">
                  {formatQuoteAmount(monthly)} / month
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[8.6pt] leading-[1.5] text-[#6a6a6a]">
          All figures are in BDT
          {details.vatPercent > 0 ? " and exclude VAT and AIT" : ""}. Billing,
          payment, warranty and delivery terms are set out on the following
          page.
        </p>
      </div>
    </LetterheadFrame>
  );
}
