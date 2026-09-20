/**
 * DeviceQuotation — page 3 of the biometric device proposal.
 *
 * The HRIS proposal's Commercialterms.tsx answers a different question. That
 * page is a two-column label/value table describing one subscription; this one
 * is an eight-column itemised quotation with per-line quantities and a grand
 * total. They share the eyebrow, the heading, and the brand table styling from
 * proposal_format.md, which is why both look like the same document.
 *
 * Source: public/resources/Proposal_For_Fingerprint_Device.pdf, page 3.
 *
 * The totals come from lib/device-quote.ts rather than being summed inline —
 * the builder shows a running grand total while the rep types, and the two
 * must not be able to disagree.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";
import type { DeviceLineItem } from "@/lib/device-session";
import {
  formatQuoteAmount,
  grandTotal,
  lineTotal,
  subTotal,
  vatAmount,
} from "@/lib/device-quote";

export interface DeviceQuotationProps {
  clientName: string;
  addresseeName: string;
  lineItems: DeviceLineItem[];
  /** 0 prints the source quotation's "Excluding VAT & AIT" note instead of a VAT row. */
  vatPercent: number;
  pageNumber?: number;
  introParagraph?: string;
  shomvobLogoSrc?: string;
}

function defaultIntroParagraph(addresseeName: string): string {
  return `Shomvob Technologies Limited proposes the following biometric attendance hardware and installation scope for ${addresseeName}. All devices quoted below integrate directly with the Shomvob HR platform, so attendance punches reach attendance, leave, overtime, and payroll without a manual export step.`;
}

const headCellClass =
  "bg-brand_green px-[2mm] py-[2.4mm] text-left text-[7.6pt] font-bold uppercase tracking-[0.03em] text-white";
const bodyCellClass = "border-b border-[#dcdcdc] px-[2mm] py-[2.4mm] align-top text-[8.2pt] text-[#3a3a3a]";
const totalLabelClass =
  "px-[2mm] py-[2.4mm] text-right text-[8.6pt] font-bold text-brand_ink";
const totalValueClass =
  "px-[2mm] py-[2.4mm] text-right text-[8.6pt] font-bold text-brand_green_deep";

export default function DeviceQuotation({
  clientName,
  addresseeName,
  lineItems,
  vatPercent,
  pageNumber = 3,
  introParagraph,
  shomvobLogoSrc,
}: DeviceQuotationProps) {
  const intro = introParagraph ?? defaultIntroParagraph(addresseeName);
  const net = subTotal(lineItems);
  const vat = vatAmount(lineItems, vatPercent);
  const total = grandTotal(lineItems, vatPercent);

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

        <table className="mb-[4mm] w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className={`${headCellClass} w-[8mm]`}>SN</th>
              <th className={headCellClass}>Description</th>
              <th className={`${headCellClass} w-[20mm]`}>Brand</th>
              <th className={`${headCellClass} w-[24mm]`}>Model No</th>
              <th className={`${headCellClass} w-[13mm]`}>UoM</th>
              <th className={`${headCellClass} w-[12mm] !text-right`}>Qnty</th>
              <th className={`${headCellClass} w-[22mm] !text-right`}>Unit Price</th>
              <th className={`${headCellClass} w-[24mm] !text-right`}>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={item.id}>
                <td className={bodyCellClass}>{index + 1}</td>
                <td className={`${bodyCellClass} font-bold text-brand_ink`}>
                  {item.description}
                </td>
                <td className={bodyCellClass}>{item.brand}</td>
                <td className={bodyCellClass}>{item.modelNo}</td>
                <td className={bodyCellClass}>{item.uom}</td>
                <td className={`${bodyCellClass} text-right`}>{item.quantity}</td>
                <td className={`${bodyCellClass} text-right`}>
                  {formatQuoteAmount(item.unitPrice)}
                </td>
                <td className={`${bodyCellClass} text-right font-bold text-brand_green_deep`}>
                  {formatQuoteAmount(lineTotal(item))}
                </td>
              </tr>
            ))}

            <tr>
              <td colSpan={6} className="px-[2mm] py-[2.4mm] align-top text-[8.2pt] italic text-[#6a6a6a]">
                {vatPercent > 0 ? "Prices exclude AIT." : "Excluding VAT & AIT"}
              </td>
              <td className={totalLabelClass}>Total</td>
              <td className={totalValueClass}>{formatQuoteAmount(net)}</td>
            </tr>

            {vatPercent > 0 ? (
              <tr>
                <td colSpan={6} />
                <td className={totalLabelClass}>VAT ({vatPercent}%)</td>
                <td className={totalValueClass}>{formatQuoteAmount(vat)}</td>
              </tr>
            ) : null}

            <tr>
              <td colSpan={6} />
              <td className={`${totalLabelClass} bg-[#eef6ef]`}>Grand Total</td>
              <td className={`${totalValueClass} bg-[#eef6ef]`}>
                {formatQuoteAmount(total)}
              </td>
            </tr>
          </tbody>
        </table>

        <p className="text-[8.4pt] leading-[1.55] text-[#6a6a6a]">
          All figures are in BDT. The quotation is subject to the terms and
          conditions on the following page.
        </p>
      </div>
    </LetterheadFrame>
  );
}
