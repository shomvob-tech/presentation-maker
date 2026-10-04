/**
 * The presentation deck: which modules a rep can pick, which slides each one
 * contributes, and the order they run in.
 *
 * This is the only list. The builder's checkboxes, the preview, the PDF
 * route's page count, and the /300ltd sample all read it — the legacy
 * slide-registry.tsx was a second list that drifted from the live deck, and
 * that is not repeated here.
 *
 * Slide copy is static: every slide component owns its own text. Per deck,
 * only the client name, the client logo, and the slide and module numbers
 * change. Nothing in this file imports React, so the export route can count
 * slides without pulling the components in.
 */

export type DeckSlideKey =
  | "title"
  | "intro"
  | "about"
  | "employee-management-capabilities"
  | "employee-management-workflow"
  | "onboarding-capabilities"
  | "onboarding-journey"
  | "attendance"
  | "leave"
  | "payroll"
  | "schedule"
  | "requests"
  | "dashboard"
  | "thank-you";

export type DeckModule = {
  id: string;
  name: string;
  /** One line under the checkbox — what the module's slides actually show. */
  summary: string;
  /** In deck order. Two modules get a capability slide and a workflow slide. */
  slides: DeckSlideKey[];
};

/** In deck order — selection never reorders the slides. */
export const DECK_MODULES: readonly DeckModule[] = [
  {
    id: "employee-management",
    name: "Employee Management",
    summary:
      "Probation, confirmation, scoped access and increments, then the setup workflow.",
    slides: ["employee-management-capabilities", "employee-management-workflow"],
  },
  {
    id: "onboarding",
    name: "Employee Onboarding",
    summary: "What HR prepares before day one, then the employee's first login.",
    slides: ["onboarding-capabilities", "onboarding-journey"],
  },
  {
    id: "attendance",
    name: "Attendance Management",
    summary: "One-tap and GPS check-in feeding payroll, with app screenshots.",
    slides: ["attendance"],
  },
  {
    id: "leave",
    name: "Leave Management",
    summary: "Policies, split leave and self-service, with app screenshots.",
    slides: ["leave"],
  },
  {
    id: "payroll",
    name: "Payroll Management",
    summary: "Deductions, pay cycles, structures and bonuses through to payslips.",
    slides: ["payroll"],
  },
  {
    id: "schedule",
    name: "Schedule & Roster",
    summary: "Shift patterns built once and rolled out across branches.",
    slides: ["schedule"],
  },
  {
    id: "requests",
    name: "Employee Request Workflows",
    summary: "Requisitions and resignations, from request to final decision.",
    slides: ["requests"],
  },
  {
    id: "dashboard",
    name: "Management Dashboard",
    summary: "Workforce KPIs and every HR workflow in one view.",
    slides: ["dashboard"],
  },
];

export const DECK_MODULE_IDS: readonly string[] = DECK_MODULES.map(
  (module) => module.id,
);

/** In every deck, whatever is selected: title, Shomvob introduction, about. */
export const OPENING_SLIDES: readonly DeckSlideKey[] = ["title", "intro", "about"];
export const CLOSING_SLIDES: readonly DeckSlideKey[] = ["thank-you"];

export type DeckSlidePlan = {
  key: DeckSlideKey;
  /** 1-based position in the deck. */
  slideNumber: number;
  /** 1-based position among the selected modules; absent on opening and closing slides. */
  moduleNumber?: number;
};

/**
 * The ordered slide list for a selection. Unknown ids are ignored rather than
 * thrown on, so a stale id in storage costs a slide, not the whole preview.
 */
export function buildDeckPlan(moduleIds: readonly string[]): DeckSlidePlan[] {
  const selected = new Set(moduleIds);
  const entries: Omit<DeckSlidePlan, "slideNumber">[] = OPENING_SLIDES.map(
    (key) => ({ key }),
  );

  let moduleNumber = 0;
  for (const deckModule of DECK_MODULES) {
    if (!selected.has(deckModule.id)) continue;

    moduleNumber += 1;
    for (const key of deckModule.slides) entries.push({ key, moduleNumber });
  }

  for (const key of CLOSING_SLIDES) entries.push({ key });

  return entries.map((entry, index) => ({ ...entry, slideNumber: index + 1 }));
}

/**
 * What the deck passes every slide. Only four slides print a number; the rest
 * ignore these. Both are optional because the /generic page and the parked
 * wizard render slides without them, and those four slides then fall back to
 * the numbers they always printed.
 */
export type DeckSlideProps = {
  slideNumber?: number;
  moduleNumber?: number;
};

/** "07" — the two-digit form the slides print their numbers in. */
export function formatDeckNumber(value: number): string {
  return String(value).padStart(2, "0");
}
