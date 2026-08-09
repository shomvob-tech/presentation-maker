/**
 * Moduleoverview — Section 3 of the Shomvob proposal format, one-page only.
 *
 * Matches: shomvob_proposal_format.md, as amended by the one-page decision —
 * fixed title, fixed static description (client name is the only dynamic
 * part), and exactly 3 or 6 modules depending on whether a problem statement
 * is present. That count is enforced by Clientdetails2.tsx's validation, not
 * by this component — it trusts whatever module list it's handed.
 *
 * Because Section 3 is now always exactly one page, the whole document's
 * page numbering is fixed: Cover=1, Letter=2, Solution=3, Commercial=4. The
 * `pageNumber` prop still exists (defaults to 3) rather than being hardcoded
 * internally, in case that ever changes.
 *
 * `problemStatementHtml` is rendered via dangerouslySetInnerHTML — it comes
 * from Richtexteditor (Tiptap) in Clientdetails2.tsx, entered by your own
 * sales team, not from an untrusted public form. If this content path ever
 * accepts input from outside the org, sanitize with something like DOMPurify
 * before rendering.
 */

import LetterheadFrame from "@/app/components/Letterheadframe";
import { MODULE_HIGHLIGHTS } from "@/lib/module-highlights";

const PAGE_TITLE = "Built Around How You Work";

export interface ModuleoverviewProps {
  /** Footer + "Prepared for" meta line — the cover's client name, not the letter's addressee. */
  clientName: string;
  preparedDate: Date | string;
  /** Defaults to 30. */
  validityDays?: number;
  /** Exactly 3 or 6 ids from MODULE_HIGHLIGHTS — validated upstream in the form. */
  selectedModuleIds: string[];
  /** Omit (or leave empty) for no problem statement — modules expand to 6. */
  problemStatementHeading?: string;
  problemStatementHtml?: string;
  /** Defaults to 3 — see note above about fixed page numbering. */
  pageNumber?: number;
  shomvobLogoSrc?: string;
}

function formatMetaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "long" });
  return `${day} ${month}, ${d.getFullYear()}`;
}

function defaultDescription(clientName: string): string {
  return `Shomvob HR brings your selected modules together into one connected system for ${clientName} — designed to work as a whole, not as separate tools bolted on afterward. Data entered once in any module flows automatically through approvals, reporting, and payroll, so information never needs to be re-entered by hand. The modules below reflect what's most relevant to your team today, with room to add more as you grow.`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function Moduleoverview({
  clientName,
  preparedDate,
  validityDays = 30,
  selectedModuleIds,
  problemStatementHeading,
  problemStatementHtml,
  pageNumber = 3,
  shomvobLogoSrc,
}: ModuleoverviewProps) {
  const modules = selectedModuleIds
    .map((id) => MODULE_HIGHLIGHTS.find((m) => m.id === id))
    .filter((m): m is (typeof MODULE_HIGHLIGHTS)[number] => Boolean(m));

  const hasProblemStatement = Boolean(
    problemStatementHtml && stripHtml(problemStatementHtml).length > 0
  );

  // 3 modules -> single row, 3 columns (avoids the 2-column orphan row).
  // 6 modules -> 2 columns, 3 rows. These are the only two counts the form
  // ever produces, so no need for a more generic column-count function.
  const gridColsClass = modules.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <LetterheadFrame clientName={clientName} pageNumber={pageNumber} shomvobLogoSrc={shomvobLogoSrc}>
      <div className="mb-[3.5mm] text-[8.6pt] font-bold uppercase tracking-[0.16em] text-brand_green">
        Proposal — Shomvob HR Management
      </div>

      <h1 className="text-[20pt] font-extrabold leading-[1.18] text-brand_ink">
        {PAGE_TITLE}
      </h1>

      <div className="mb-[4mm] mt-[4mm] border-b-[1.5pt] border-brand_green pb-[4mm] text-[9.3pt] text-brand_muted">
        Prepared for: <b className="text-brand_ink">{clientName}</b> &nbsp;
        Date: <b className="text-brand_ink">{formatMetaDate(preparedDate)}</b> &nbsp;
        Valid for: <b className="text-brand_ink">{validityDays} days</b>
      </div>

      <p className="mb-[5mm] text-justify text-[9.8pt] leading-[1.62] text-[#3a3a3a]">
        {defaultDescription(clientName)}
      </p>

      <h2 className="mb-[3.5mm] text-[12.5pt] font-bold text-brand_green">
        Module Highlights
      </h2>

      <div className={`grid gap-x-[7mm] ${gridColsClass}`}>
        {modules.map((module) => (
          <div key={module.id} className="mb-[4mm]">
            <h3 className="mb-[1.8mm] text-[9.8pt] font-bold text-brand_ink">
              {module.label}
            </h3>
            <ul>
              {module.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="relative mb-[1.4mm] pl-[3mm] text-[8.6pt] leading-[1.45] text-[#444]"
                >
                  <span className="absolute left-0 top-0 font-bold text-brand_green">•</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {hasProblemStatement ? (
        <div className="mt-[3mm]">
          {problemStatementHeading ? (
            <h2 className="mb-[3.5mm] text-[12.5pt] font-bold text-brand_green">
              {problemStatementHeading}
            </h2>
          ) : null}
          <div
            className="border-l-[3pt] border-brand_green bg-[#eef6ef] px-[5mm] py-[4mm] text-[9pt] leading-[1.55] text-[#333] [&_li]:ml-[4mm] [&_li]:list-disc [&_p]:mb-[2mm] [&_p:last-child]:mb-0 [&_strong]:text-brand_ink [&_ul]:mb-[2mm]"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: problemStatementHtml! }}
          />
        </div>
      ) : null}
    </LetterheadFrame>
  );
}