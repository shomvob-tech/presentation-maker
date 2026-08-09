/**
 * LetterheadFrame — shared chrome for every interior page (Sections 2, 3, 4).
 * The cover page does NOT use this — it has its own standalone chrome in
 * CoverPage.tsx (mirrored side bars, no logo-in-header, no top-right deco).
 *
 * Matches: shomvob_proposal_format.md — "Global Design Rules > Letterhead
 * Chrome", mm values ported directly from the working PDF templates
 * (Terraprime v2 / Taza Hair Oil) for exact visual parity.
 *
 * Usage: wrap a page's content in this frame. It handles the left sidebar
 * bar, the top-right decorative square cluster, the Shomvob logo, and the
 * footer. You only need to supply the content and footer identity info.
 */

const SHOMVOB_LOGO_SRC = "/shomvob-hr-logo.png";

export interface FooterContact {
  name: string;
  team?: string;
  email?: string;
  phone?: string;
}

export interface LetterheadFrameProps {
  /** Client's full/display name, used in the footer's right-hand label. */
  clientName: string;
  /** 1-indexed page number shown in the footer. */
  pageNumber: number;
  /**
   * Only the LAST page of a proposal replaces the footer's left side with
   * the sales contact's details instead of "Shomvob Technologies Ltd".
   * Omit on every other page.
   */
  footerContact?: FooterContact;
  /** Escape hatch if the Shomvob logo path differs per-deployment. */
  shomvobLogoSrc?: string;
  children: React.ReactNode;
}

function TopRightDecoration() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 z-10 h-[48mm] w-[70mm] overflow-hidden">
      <span className="absolute right-[26mm] top-[2mm] h-[22mm] w-[22mm] rounded-[3mm] bg-brand_green opacity-[0.14]" />
      <span className="absolute right-[34mm] top-[16mm] h-[9mm] w-[9mm] rounded-[3mm] bg-brand_green opacity-[0.16]" />
      <span className="absolute right-[8mm] top-[6mm] h-[16mm] w-[16mm] rounded-[3mm] bg-brand_green opacity-[0.10]" />
      <span className="absolute right-[20mm] top-[30mm] h-[14mm] w-[14mm] rounded-[3mm] bg-brand_green opacity-[0.12]" />
      <span className="absolute right-[6mm] top-[22mm] h-[11mm] w-[11mm] rounded-[3mm] bg-brand_green opacity-[0.20]" />
    </div>
  );
}

function FooterBar({ clientName, pageNumber, footerContact }: Pick<LetterheadFrameProps, "clientName" | "pageNumber" | "footerContact">) {
  const leftLabel = footerContact
    ? [footerContact.name, footerContact.team, footerContact.email, footerContact.phone]
        .filter(Boolean)
        .join(" · ")
    : "Shomvob Technologies Ltd";

  return (
    <div className="absolute bottom-[9mm] left-[20mm] right-[16mm] z-20 flex justify-between text-[7.6pt] text-[#9a9a9a]">
      <span>{leftLabel}</span>
      <span>
        Proposal for {clientName} — Page {pageNumber}
      </span>
    </div>
  );
}

export default function LetterheadFrame({
  clientName,
  pageNumber,
  footerContact,
  shomvobLogoSrc = SHOMVOB_LOGO_SRC,
  children,
}: LetterheadFrameProps) {
  return (
    <div className="a4-page relative h-[297mm] w-[210mm] overflow-hidden bg-white">
      {/* Left sidebar bar — interior pages only get the left one */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[7mm]">
        <div className="absolute inset-0 bg-brand_gray" />
        <div className="absolute inset-x-0 top-0 h-[34mm] bg-brand_green" />
      </div>

      <TopRightDecoration />

      <img
        src={shomvobLogoSrc}
        alt="Shomvob HR"
        className="absolute left-[20mm] top-[14mm] z-20 h-[11mm]"
      />

      <div className="absolute bottom-[16mm] left-[20mm] right-[16mm] top-[34mm] z-20">
        {children}
      </div>

      <FooterBar clientName={clientName} pageNumber={pageNumber} footerContact={footerContact} />
    </div>
  );
}