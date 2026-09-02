/**
 * Section 3 (Module Overview) pagination — the single source of truth for how
 * many modules land on the first page, how many overflow onto a second one,
 * and which page carries the problem statement callout.
 *
 * Section 3 used to be a hard one-page format: the form blocked any selection
 * over 8 modules (6 with a problem statement). Those two numbers are still the
 * "everything fits on one page" boundary — but past it the section now spills
 * onto a continuation page instead of being rejected, so a rep can select
 * every module on offer.
 *
 * The split below is hand-tuned for how the page actually looks at each count,
 * not derived from a formula — treat the table as the spec:
 *
 *   Selected (N)   Problem stmt   Page 1      Page 2
 *   ------------   ------------   ---------   ----------------------
 *   0–8            no             all         —
 *   0–6            yes            all + PS    —
 *   7              yes            5           2 + PS
 *   8              yes            6           2 + PS
 *   9–11           either         6           N−6 (+ PS if present)
 *   12–14          either         8           N−8 (+ PS if present)
 *
 * Two rules the table encodes: page 1 holds 6 modules through the middle of
 * the range and only steps up to 8 once the total reaches 12, and once the
 * section overflows the problem statement always moves to page 2 — it never
 * stays behind on a page 1 that's already full of modules.
 */

import { MODULE_HIGHLIGHTS } from "./module-highlights";

/**
 * Modules that stay in module-highlights.ts — so an already-saved proposal
 * that selected one still renders — but are no longer offered in the
 * builder's checkbox list.
 */
export const HIDDEN_MODULE_IDS: readonly string[] = ["policy-management"];

/** What the module-selection UI offers today: 14 of the 15 defined modules. */
export const SELECTABLE_MODULES = MODULE_HIGHLIGHTS.filter(
  (module) => !HIDDEN_MODULE_IDS.includes(module.id),
);

/** Hard ceiling — no page of the module section ever renders more than this. */
export const MODULE_MAX_PER_PAGE = 8;

/** The section fits on a single page up to these counts (original limits). */
const SINGLE_PAGE_MAX_WITHOUT_PROBLEM_STATEMENT = 8;
const SINGLE_PAGE_MAX_WITH_PROBLEM_STATEMENT = 6;

/** Cover = 1, COO letter = 2, so the module section starts here. */
export const MODULE_SECTION_START_PAGE = 3;

export interface ModulePageSplit {
  /** Modules rendered on the section's first page. */
  firstPageModuleIds: string[];
  /** Modules pushed to the continuation page — empty when the section fits one page. */
  secondPageModuleIds: string[];
  /** False when there is no problem statement at all, or when it fits on page 1. */
  problemStatementOnSecondPage: boolean;
  pageCount: 1 | 2;
}

/**
 * Tiptap reports an empty editor as "<p></p>", not "" — strip tags before
 * deciding whether a problem statement is really present.
 */
export function hasProblemStatementContent(
  html: string | undefined | null,
): boolean {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

/** Page-1 module count once the section is known to overflow — see the table. */
function firstPageCapacity(total: number): number {
  if (total === 7) return 5; // only reachable with a problem statement
  if (total <= 11) return 6;
  return MODULE_MAX_PER_PAGE;
}

export function splitModulesAcrossPages(
  selectedModuleIds: string[],
  hasProblemStatement: boolean,
): ModulePageSplit {
  const total = selectedModuleIds.length;
  const singlePageMax = hasProblemStatement
    ? SINGLE_PAGE_MAX_WITH_PROBLEM_STATEMENT
    : SINGLE_PAGE_MAX_WITHOUT_PROBLEM_STATEMENT;

  if (total <= singlePageMax) {
    return {
      firstPageModuleIds: [...selectedModuleIds],
      secondPageModuleIds: [],
      problemStatementOnSecondPage: false,
      pageCount: 1,
    };
  }

  // A third page can't be needed: 15 defined modules minus an 8-module first
  // page leaves 7, still within MODULE_MAX_PER_PAGE.
  const firstPageCount = firstPageCapacity(total);

  return {
    firstPageModuleIds: selectedModuleIds.slice(0, firstPageCount),
    secondPageModuleIds: selectedModuleIds.slice(firstPageCount),
    problemStatementOnSecondPage: hasProblemStatement,
    pageCount: 2,
  };
}

/** How many pages Section 3 occupies — what later sections offset from. */
export function moduleSectionPageCount(
  selectedModuleIds: string[],
  hasProblemStatement: boolean,
): 1 | 2 {
  return splitModulesAcrossPages(selectedModuleIds, hasProblemStatement)
    .pageCount;
}
