/**
 * DeviceLetter — page 2 of the biometric device proposal.
 *
 * The HRIS proposal's Letterfromcoo.tsx is not reusable here: its subject line
 * hardcodes "SaaS Based Human Resource Information System", its body is four
 * fixed HRIS sections (Solution Overview / No Upfront Cost / Ongoing Support),
 * and it addresses a title rather than a person. The device letter can address
 * a named recipient (both name and title are optional) and carries a Key
 * Benefits list instead. What the two do
 * share — the letterhead chrome, the date/To/Subject block, the signature
 * block — comes from LetterheadFrame, so only the copy differs.
 *
 * Source: public/resources/Proposal_For_Fingerprint_Device.pdf, page 2.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";

const DEFAULT_SIGNATURE_SRC = "/resources/hasib_bhai_sig.png";

export interface DeviceLetterProps {
  /** Footer label and the subject line's trailing name. */
  clientName: string;
  /** Letter "To," company. Resolve `letterAddresseeName ?? clientName` before
   * passing it in — this component renders what it is given, same as the
   * HRIS letter. */
  addresseeName: string;
  /** Both optional — the "To," block drops whichever is absent and keeps the
   * addressee company, which is always present. */
  recipientName?: string;
  recipientTitle?: string;
  preparedDate: Date | string;
  keyBenefits: string[];
  /** Fixed 4-page format, but kept a prop so the page order stays visible at
   * the call site rather than buried here. */
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

export default function DeviceLetter({
  clientName,
  addresseeName,
  recipientName,
  recipientTitle,
  preparedDate,
  keyBenefits,
  pageNumber = 2,
  signatureSrc = DEFAULT_SIGNATURE_SRC,
  shomvobLogoSrc,
}: DeviceLetterProps) {
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

      <div className="mb-[6mm] text-[9.8pt] font-bold text-brand_ink">
        Subject: Proposal for Biometric Attendance Device for {clientName}.
      </div>

      <div className="text-[9.6pt] leading-[1.68] text-[#333]">
        <p className="mb-[4mm] text-justify">Dear Sir,</p>

        <p className="mb-[4mm] text-justify">
          Shomvob Technologies Limited is pleased to propose an integrated
          Biometric Attendance Device solution for {addresseeName}, connected
          with the Shomvob cloud-based HR and Payroll software. This solution
          will help ensure accurate and real-time attendance tracking, prevent
          proxy check-ins, reduce manual HR workload, and improve payroll
          accuracy. Attendance data will automatically sync with the Shomvob HR
          platform, allowing HR teams to manage attendance, leave, overtime,
          and payroll more efficiently.
        </p>

        {keyBenefits.length > 0 ? (
          <>
            <h4 className="mb-[2.5mm] mt-[5mm] text-[9.8pt] font-bold text-brand_green_deep">
              Key Benefits
            </h4>
            <ul className="mb-[4mm]">
              {keyBenefits.map((benefit) => (
                <li key={benefit} className="relative mb-[1.8mm] pl-[5mm]">
                  <span className="absolute left-[1mm] top-[1.6mm] h-[1.4mm] w-[1.4mm] rounded-full bg-brand_green" />
                  {benefit}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <p className="mb-[4mm] text-justify">
          Shomvob Technologies Limited is committed to supporting{" "}
          {addresseeName} in building a more efficient, secure, and transparent
          HR operation through smart digital solutions.
        </p>

        <p className="mb-[4mm] text-justify">
          We are thrilled at the opportunity to partner with {addresseeName} and
          help optimize your HR operations with our cutting-edge technology.
          Please reach out for further details or any clarifications you may
          need.
        </p>
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
