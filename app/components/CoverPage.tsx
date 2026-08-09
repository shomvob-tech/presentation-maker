/**
 * CoverPage — Section 1 of the Shomvob proposal format.
 *
 * A fixed, physical A4 page (210mm x 297mm). This is NOT a viewport-relative
 * slide like the old `h-screen w-full` components — it renders at its true
 * print size always, and the builder/preview UI is responsible for scaling
 * it visually (see ScaledPreview pattern discussed separately). Do not wrap
 * this in vh/vw-based sizing.
 *
 * Matches: shomvob_proposal_format.md — Section 1, v1.1
 *
 * Static elements (not props): the side letterhead bars, the gold rule, the
 * green divider, the stats strip values, and the Shomvob HR logo/name in the
 * footer. Everything client-specific is a prop.
 */

const DEFAULT_TITLE = "Workforce Management Ecosystem";
const SHOMVOB_LOGO_SRC = "/shomvob-hr-logo.png";

const DEFAULT_STATS: CoverStat[] = [
  { value: "25+", label: "Organizations Served" },
  { value: "98%+", label: "Platform Availability" },
  { value: "4+", label: "Years Experience" },
  { value: "100%", label: "Payroll On Time" },
];

export type CoverStat = {
  value: string;
  label: string;
};

export interface CoverPageProps {
  /** Client's full legal/display name, e.g. "Terraprime Hotels & Resorts Ltd." */
  clientName: string;
  /** Client logo — data URL or public path. Transparent background recommended. */
  clientLogoSrc: string;
  /** Defaults to "Workforce Management Ecosystem" when omitted or blank. */
  documentTitle?: string;
  /** Proposal date. Accepts a Date or an already-formatted string. */
  preparedDate: Date | string;
  /** Override the 4-stat credibility strip. Defaults to the standard set. */
  stats?: CoverStat[];
  /** Escape hatch if Shomvob's own logo path differs per-deployment. */
  shomvobLogoSrc?: string;
}

function formatProposalDate(date: Date | string): string {
  if (typeof date === "string") {
    // YYYY-MM-DD from <input type="date"> — parse as local calendar date
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);
      return formatProposalDate(new Date(year, month - 1, day));
    }
    return date;
  }
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
}

export default function CoverPage({
  clientName,
  clientLogoSrc,
  documentTitle,
  preparedDate,
  stats = DEFAULT_STATS,
  shomvobLogoSrc = SHOMVOB_LOGO_SRC,
}: CoverPageProps) {
  const title = documentTitle?.trim() || DEFAULT_TITLE;
  const dateLabel = formatProposalDate(preparedDate);

  return (
    <div className="a4-page relative h-[297mm] w-[210mm] overflow-hidden bg-white">
      {/* Left letterhead bar — mirrors every interior page */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[7mm]">
        <div className="absolute inset-0 bg-brand_gray" />
        <div className="absolute inset-x-0 top-0 h-[34mm] bg-brand_green" />
      </div>

      {/* Right letterhead bar — cover-only mirror, interior pages omit this */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[7mm]">
        <div className="absolute inset-0 bg-brand_gray" />
        <div className="absolute inset-x-0 top-0 h-[34mm] bg-brand_green" />
      </div>

      {/* Content column */}
      <div className="relative z-20 flex h-full flex-col items-center justify-between pb-[26mm] pt-[38mm]">
        <div className="flex flex-col items-center px-[30mm] text-center">
          <img
            src={clientLogoSrc}
            alt={`${clientName} logo`}
            className="mb-[9mm] max-h-[62mm] max-w-[80mm] object-contain"
          />

          <div className="mb-[5mm] h-[2pt] w-[18mm] bg-brand_gold" />

          <div className="mb-[3.5mm] text-[9.5pt] font-bold uppercase tracking-[0.16em] text-brand_green">
            Proposal
          </div>

          <h1 className="mb-[9mm] max-w-[120mm] text-[21pt] font-extrabold leading-[1.28] text-brand_ink">
            {title}
          </h1>

          <div className="mb-[7mm] h-px w-[36mm] bg-gradient-to-r from-transparent via-brand_green to-transparent" />

          <div className="text-[9.6pt] leading-[2] text-brand_muted">
            <div>
              Prepared for: <b className="text-brand_ink">{clientName}</b>
            </div>
            <div>
              Prepared by: <b className="text-brand_ink">Shomvob Technologies Limited</b>
            </div>
            <div>
              Date: <b className="text-brand_ink">{dateLabel}</b>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex items-center">
              {index > 0 && <div className="h-[9mm] w-px bg-[#e2e2e2]" />}
              <div className="px-[9mm] text-center">
                <div className="mb-[2mm] text-[14pt] font-bold leading-none text-brand_ink">
                  {stat.value}
                </div>
                <div className="text-[7.4pt] uppercase tracking-[0.05em] text-[#999]">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <img src={shomvobLogoSrc} alt="Shomvob HR" className="mb-[2mm] h-[11mm]" />
          <span className="text-[8pt] text-[#9a9a9a]">Shomvob Technologies Limited</span>
        </div>
      </div>
    </div>
  );
}