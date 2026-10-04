/**
 * CombinedTerms — last page of the combined proposal.
 *
 * Carries every term in the document — the commercial ones (VAT, billing
 * cadence, scope changes) first, then the hardware ones.
 *
 * They were briefly split across two pages, with the commercial clauses next
 * to the figures they qualify. Measuring killed that: the commercial page ran
 * to 240mm of its 247mm with only three hardware rows, so a fourth item would
 * have been silently clipped, while this page sat barely half full. One list
 * also removes the risk of the two contradicting each other on payment.
 *
 * Clauses are transcribed from the device proposal; only the four values that
 * genuinely move between quotations are props. The closing callout differs
 * from the standalone device page on purpose: that one cites "the
 * subscription agreement in force", which is wrong in a document that is
 * itself proposing the subscription.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";

export interface CombinedTermsProps {
  clientName: string;
  /** Drives the VAT clause. 0 prints an "excluding VAT & AIT" note instead. */
  vatPercent: number;
  warrantyPeriod: string;
  paymentTerms: string;
  deliveryCity: string;
  deliveryLeadTime: string;
  /** Required — the solution section is 1 or 2 pages. */
  pageNumber: number;
  /** Defaults to 30. */
  validityDays?: number;
  shomvobLogoSrc?: string;
}

type Clause = { label: string; body: string };

export default function CombinedTerms({
  clientName,
  vatPercent,
  warrantyPeriod,
  paymentTerms,
  deliveryCity,
  deliveryLeadTime,
  pageNumber,
  validityDays = 30,
  shomvobLogoSrc,
}: CombinedTermsProps) {
  const clauses: Clause[] = [
    {
      label: "VAT & AIT",
      body:
        vatPercent > 0
          ? `${vatPercent}% VAT will be added on the total invoice amount. All figures in this proposal exclude VAT and AIT.`
          : "All figures in this proposal exclude VAT and AIT.",
    },
    {
      label: "Billing",
      body: "The monthly subscription is billed from the month the platform goes live. Hardware, installation and rollout are billed once, on the first invoice.",
    },
    {
      label: "Scope Changes",
      body: "Any additional features, modules or devices requested after rollout will be subject to additional charges, based on scope and requirements.",
    },
    {
      label: "Warranty",
      body: `${warrantyPeriod} on all quoted hardware items. Warranty will be void due to burn, physical damage, mishandling and/or natural disaster (i.e. lightning, fire, flood, etc.).`,
    },
    {
      label: "Payment",
      body: paymentTerms,
    },
    {
      label: "Delivery Time and Process",
      body: `Goods will be delivered at the premises within ${deliveryCity} city at Shomvob's own cost. Tentative delivery time: ${deliveryLeadTime} from the date of issuing the work order with advance payment. Delivery time may increase due to manufacturing lead time and/or shipment and customs clearing time.`,
    },
    {
      label: "Cable & Accessories",
      body: "Client's part.",
    },
    {
      label: "Installation",
      body: "As per client request.",
    },
    {
      label: "Client's Part",
      body: "All power connectivity, server, network, civil works, and surge protection/grounding will be provided by the client (as required).",
    },
    {
      label: "Service and Support",
      body: "Platform maintenance and technical support are included in the monthly subscription. Onsite hardware service is not included; for onsite service and support, service charges are applicable.",
    },
    {
      label: "Validity",
      body: `This proposal remains valid for ${validityDays} days from the date on the cover.`,
    },
  ];

  return (
    <LetterheadFrame
      clientName={clientName}
      pageNumber={pageNumber}
      shomvobLogoSrc={shomvobLogoSrc}
      className="a4-page-last"
    >
      <div className="font-sans">
        <div className="mb-[3mm] text-[8.6pt] font-bold uppercase tracking-[0.16em] text-brand_green">
          Scope &amp; Obligations
        </div>

        <h1 className="mb-[5mm] text-[16pt] font-extrabold text-brand_ink">
          Terms and Conditions
        </h1>

        <ol className="text-[9.1pt] leading-[1.58] text-[#333]">
          {clauses.map((clause, index) => (
            <li key={clause.label} className="relative mb-[3.4mm] pl-[7mm]">
              <span className="absolute left-0 font-bold text-brand_green_deep">
                {index + 1}.
              </span>
              <b className="text-brand_ink">{clause.label.toUpperCase()}:</b>{" "}
              {clause.body}
            </li>
          ))}
        </ol>

        <div className="mt-[7mm] border-l-[3pt] border-brand_green bg-[#eef6ef] px-[5mm] py-[3.5mm] text-[9pt] leading-[1.55] text-[#333]">
          <b className="text-brand_ink">One connected system</b> — the devices
          quoted here report directly into the Shomvob HR platform proposed in
          this document. Attendance captured at the device flows through leave,
          overtime and payroll for {clientName} without a separate integration
          step or a manual export.
        </div>
      </div>
    </LetterheadFrame>
  );
}
