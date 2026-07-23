import slidePointsLibrary from "./slide_points.json" with { type: "json" };
import {
  buildPresentationContent,
  getModuleSlotCount,
  type GeneratedModuleContent,
  type PresentationContent,
  type SlidePointSlot,
} from "./presentation-content";
import { MODULES_WITH_SLIDES } from "./points-generator";

type PointLibraryEntry = {
  id: string;
  priority: number;
  title: string;
  description: string;
  businessBenefit: string;
  keywords: string[];
};

type GenerationRules = {
  minimumPoints: number;
  maximumPoints: number;
  preferHighestPriority: boolean;
  avoidDuplicateKeywords: boolean;
  rewriteTone: string;
  useBusinessBenefitsWhenRelevant: boolean;
};

type SlidePointsModule = {
  moduleId: string;
  moduleName: string;
  pointLibrary: PointLibraryEntry[];
  generationRules: GenerationRules;
  maxPointsPerSlide: number;
};

export type PointSelectionInput = {
  selectedModuleIds: string[];
  requirements?: string;
  notes?: string;
};

export type ScoredPoint = {
  point: PointLibraryEntry;
  score: number;
};

const slidePointsByModuleId = new Map<string, SlidePointsModule>(
  (slidePointsLibrary as SlidePointsModule[]).map((module) => [
    module.moduleId,
    module,
  ]),
);

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function buildContextText(requirements?: string, notes?: string): string {
  return [requirements, notes]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}

function keywordMatchesContext(keyword: string, contextText: string): boolean {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return false;

  if (contextText.includes(normalizedKeyword)) return true;

  return tokenize(contextText).some(
    (token) =>
      token.includes(normalizedKeyword) || normalizedKeyword.includes(token),
  );
}

/** Score how well a library point matches requirements + notes. */
export function scorePointAgainstContext(
  point: PointLibraryEntry,
  contextText: string,
): number {
  if (!contextText) return 0;

  let score = 0;
  const normalizedContext = normalizeText(contextText);
  const contextTokens = new Set(tokenize(contextText));

  for (const keyword of point.keywords) {
    if (keywordMatchesContext(keyword, normalizedContext)) {
      score += 10;
    } else {
      for (const token of contextTokens) {
        const normalizedKeyword = normalizeText(keyword);
        if (
          token.includes(normalizedKeyword) ||
          normalizedKeyword.includes(token)
        ) {
          score += 3;
          break;
        }
      }
    }
  }

  if (normalizedContext.includes(normalizeText(point.title))) {
    score += 5;
  }

  return score;
}

function sortScoredPoints(
  scoredPoints: ScoredPoint[],
  preferHighestPriority: boolean,
): ScoredPoint[] {
  return [...scoredPoints].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (!preferHighestPriority) return 0;
    return right.point.priority - left.point.priority;
  });
}

function keywordsOverlap(
  left: PointLibraryEntry,
  right: PointLibraryEntry,
): boolean {
  const leftKeywords = new Set(left.keywords.map(normalizeText));
  return right.keywords.some((keyword) => leftKeywords.has(normalizeText(keyword)));
}

function overlapsAnySelected(
  candidate: PointLibraryEntry,
  selected: PointLibraryEntry[],
): boolean {
  return selected.some((point) => keywordsOverlap(candidate, point));
}

function resolveDescription(
  point: PointLibraryEntry,
  score: number,
  rules: GenerationRules,
): string {
  if (rules.useBusinessBenefitsWhenRelevant && score > 0) {
    return point.businessBenefit;
  }

  return point.description;
}

function toGeneratedSlot(
  point: PointLibraryEntry,
  score: number,
  rules: GenerationRules,
): SlidePointSlot {
  return {
    title: point.title,
    description: resolveDescription(point, score, rules),
    sourcePointId: point.id,
  };
}

function getSlidePointsModule(moduleId: string): SlidePointsModule | undefined {
  return slidePointsByModuleId.get(moduleId);
}

/**
 * Select library points for one module. Returns sparse slots aligned to the
 * slide's fixed slot count; mergeModulePoints fills any gaps with defaults.
 */
export function selectPointsForModule(
  moduleId: string,
  input: Pick<PointSelectionInput, "requirements" | "notes"> = {},
): GeneratedModuleContent | null {
  if (!MODULES_WITH_SLIDES.has(moduleId)) return null;

  const slidePoints = getSlidePointsModule(moduleId);
  const slotCount = getModuleSlotCount(moduleId);
  if (!slidePoints || slotCount === 0) return null;

  const contextText = buildContextText(input.requirements, input.notes);
  const rules = slidePoints.generationRules;
  const targetCount = Math.min(slotCount, rules.maximumPoints);

  const scoredPoints = sortScoredPoints(
    slidePoints.pointLibrary.map((point) => ({
      point,
      score: scorePointAgainstContext(point, contextText),
    })),
    rules.preferHighestPriority,
  );

  const selected: PointLibraryEntry[] = [];
  const selectedScores = new Map<string, number>();

  for (const { point, score } of scoredPoints) {
    if (selected.length >= targetCount) break;

    if (
      rules.avoidDuplicateKeywords &&
      overlapsAnySelected(point, selected)
    ) {
      continue;
    }

    selected.push(point);
    selectedScores.set(point.id, score);
  }

  if (selected.length < targetCount) {
    for (const { point, score } of scoredPoints) {
      if (selected.length >= targetCount) break;
      if (selected.some((entry) => entry.id === point.id)) continue;
      selected.push(point);
      selectedScores.set(point.id, score);
    }
  }

  const points: Array<SlidePointSlot | undefined> = Array.from(
    { length: slotCount },
    () => undefined,
  );

  selected.slice(0, targetCount).forEach((point, index) => {
    points[index] = toGeneratedSlot(
      point,
      selectedScores.get(point.id) ?? 0,
      rules,
    );
  });

  return { moduleId, points };
}

/** Select points for every selected module that has a slide template. */
export function selectPointsForPresentation(
  input: PointSelectionInput,
): GeneratedModuleContent[] {
  return input.selectedModuleIds
    .map((moduleId) =>
      selectPointsForModule(moduleId, {
        requirements: input.requirements,
        notes: input.notes,
      }),
    )
    .filter((module): module is GeneratedModuleContent => module !== null);
}

/** End-to-end: select from slide_points.json, merge with slide defaults. */
export function generatePresentationContent(
  input: PointSelectionInput,
): PresentationContent {
  const generatedModules = selectPointsForPresentation(input);

  return buildPresentationContent({
    selectedModuleIds: input.selectedModuleIds,
    requirements: input.requirements,
    notes: input.notes,
    generatedModules,
  });
}

/** Lightweight self-check for manual or script-based verification. */
export function runPointSelectionSelfTest(): void {
  const attendance = selectPointsForModule("attendance", {
    requirements: "GPS attendance for field staff and payroll integration",
    notes: "Focus on mobile check-in",
  });

  if (!attendance || attendance.points.length !== 4) {
    throw new Error("Attendance selection should produce four slots.");
  }

  const firstPoint = attendance.points[0];
  if (!firstPoint?.sourcePointId) {
    throw new Error("Expected first attendance slot to be filled from library.");
  }

  const leave = selectPointsForModule("leave", {
    requirements: "employee self-service leave balance",
  });

  if (!leave || leave.points.filter(Boolean).length < 3) {
    throw new Error("Leave selection should fill at least three slots.");
  }

  const presentation = generatePresentationContent({
    selectedModuleIds: ["attendance", "payroll"],
    requirements: "automated payroll and late deductions",
    notes: "Factory workforce",
  });

  if (!presentation.modules.attendance || !presentation.modules.payroll) {
    throw new Error("Generated presentation should include attendance and payroll.");
  }

  if (presentation.modules.payroll.points.length !== 8) {
    throw new Error("Payroll slide should keep eight fixed slots after merge.");
  }
}
