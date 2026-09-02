/**
 * Moduleoverview — Section 3 of the Shomvob proposal format. Renders exactly
 * ONE A4 page; the section itself may run to two of them.
 *
 * Matches: shomvob_proposal_format.md — fixed title, fixed static description
 * (client name is the only dynamic part), then the module grid.
 *
 * This component does no pagination of its own: it renders whatever module
 * list it's handed, including an empty one. Which modules belong on which
 * page — and which page carries the problem statement — is decided by
 * lib/module-page-layout.ts and applied by the caller
 * (Previewmoduleoverviewpage.tsx). Set `variant="continued"` for the second
 * page: it drops the title, meta line, and intro paragraph, keeping only the
 * eyebrow and a "(continued)" module heading.
 *
 * Layout is always a strict 2-column grid. Odd module counts intentionally
 * leave the second cell of the final row empty.
 *
 * Page numbering is no longer fixed document-wide, since this section is 1 or
 * 2 pages: Cover=1, Letter=2, Solution=3(–4), Commercial=4 or 5. Sections
 * after this one derive their number from moduleSectionPageCount().
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
  /** Up to MODULE_MAX_PER_PAGE ids from MODULE_HIGHLIGHTS — the ones belonging
   * on THIS page. The caller splits the full selection; see module-page-layout.ts. */
  selectedModuleIds: string[];
  /** Omit (or leave empty) to render no callout on this page. */
  problemStatementHeading?: string;
  problemStatementHtml?: string;
  /** Defaults to 3 — the section's first page. A continuation page is 4. */
  pageNumber?: number;
  shomvobLogoSrc?: string;
  /**
   * "primary" (default) renders the section's full header — title, meta line,
   * and intro paragraph. "continued" is the compact second page: eyebrow plus
   * a "(continued)" module heading, leaving the space for content.
   */
  variant?: "primary" | "continued";
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
  variant = "primary",
}: ModuleoverviewProps) {
  const isContinued = variant === "continued";
  const modules = selectedModuleIds
    .map((id) => MODULE_HIGHLIGHTS.find((m) => m.id === id))
    .filter((m): m is (typeof MODULE_HIGHLIGHTS)[number] => Boolean(m));

  const hasProblemStatement = Boolean(
    problemStatementHtml && stripHtml(problemStatementHtml).length > 0
  );

  return (
    <LetterheadFrame clientName={clientName} pageNumber={pageNumber} shomvobLogoSrc={shomvobLogoSrc}>
      <div className="font-sans">
        <div className="mb-[3.5mm] text-[8.6pt] font-bold uppercase tracking-[0.16em] text-brand_green">
          Proposal — Shomvob HR Management
        </div>

        {isContinued ? null : (
          <>
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
          </>
        )}

        {modules.length > 0 ? (
          <>
            <h2
              className={`mb-[3.5mm] text-[12.5pt] font-bold text-brand_green ${
                isContinued
                  ? "border-b-[1.5pt] border-brand_green pb-[3.5mm]"
                  : ""
              }`}
            >
              {isContinued ? "Module Highlights (continued)" : "Module Highlights"}
            </h2>

            <div className="grid grid-cols-2 gap-x-[7mm]">
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
          </>
        ) : null}

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
      </div>
    </LetterheadFrame>
  );
}