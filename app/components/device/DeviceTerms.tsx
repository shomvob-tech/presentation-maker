/**
 * DeviceTerms — page 4, and the last page, of the biometric device proposal.
 *
 * Source: public/resources/Proposal_For_Fingerprint_Device.pdf, page 4. The
 * seven clauses are transcribed from it; only the four values that genuinely
 * move between quotations — warranty period, payment mode, delivery city,
 * delivery lead time — are props. The other three clauses (cable and
 * accessories, installation, client's part, service and support) have been
 * identical across quotations and stay static here, the same way
 * Commercialterms.tsx keeps its three HRIS clauses static.
 *
 * Carries `a4-page-last` so globals.css drops the trailing page break — see
 * the note there about why `:last-of-type` cannot be used instead.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";

export interface DeviceTermsProps {
  clientName: string;
  warrantyPeriod: string;
  paymentTerms: string;
  deliveryCity: string;
  deliveryLeadTime: string;
  pageNumber?: number;
  shomvobLogoSrc?: string;
}

type Clause = { label: string; body: string };

export default function DeviceTerms({
  clientName,
  warrantyPeriod,
  paymentTerms,
  deliveryCity,
  deliveryLeadTime,
  pageNumber = 4,
  shomvobLogoSrc,
}: DeviceTermsProps) {
  const clauses: Clause[] = [
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
      body: "Onsite service and support is not included. For onsite service and support, service charges are applicable.",
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
        <div className="mb-[3.5mm] text-[8.6pt] font-bold uppercase tracking-[0.16em] text-brand_green">
          Scope &amp; Obligations
        </div>

        <h1 className="mb-[6mm] text-[16pt] font-extrabold text-brand_ink">
          Terms and Conditions
        </h1>

        <ol className="text-[9.2pt] leading-[1.62] text-[#333]">
          {clauses.map((clause, index) => (
            <li key={clause.label} className="relative mb-[4mm] pl-[7mm]">
              <span className="absolute left-0 font-bold text-brand_green_deep">
                {index + 1}.
              </span>
              <b className="text-brand_ink">{clause.label.toUpperCase()}:</b>{" "}
              {clause.body}
            </li>
          ))}
        </ol>

        <div className="mt-[8mm] border-l-[3pt] border-brand_green bg-[#eef6ef] px-[5mm] py-[3.5mm] text-[9pt] leading-[1.55] text-[#333]">
          <b className="text-brand_ink">Platform integration</b> — the quoted
          devices report into the Shomvob HR platform. Attendance, leave,
          overtime, and payroll continue to be governed by the subscription
          agreement in force between Shomvob Technologies Limited and{" "}
          {clientName}; this quotation covers hardware and installation only.
        </div>
      </div>
    </LetterheadFrame>
  );
}
