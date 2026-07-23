import { SLIDE_DEFAULTS } from "./slide-defaults";

/** Text content for one point slot on a module slide. */
export type SlidePointContent = {
  title: string;
  description: string;
};

/**
 * One populated slot after selection/merge. `sourcePointId` traces back to
 * slide_points.json when the slot was filled from the library.
 */
export type SlidePointSlot = SlidePointContent & {
  sourcePointId?: string;
};

/** Built-in defaults for a module slide, taken from the current slide components. */
export type ModuleSlideDefaults = {
  moduleId: string;
  points: SlidePointContent[];
};

/** Sparse generated content for one module before merge with defaults. */
export type GeneratedModuleContent = {
  moduleId: string;
  points: Array<Partial<SlidePointSlot> | null | undefined>;
};

/** Merged, render-ready content for one module slide. */
export type ModuleSlideContent = {
  moduleId: string;
  slotCount: number;
  points: SlidePointSlot[];
};

/**
 * Full presentation content payload. Module headlines/subheadlines stay in slide
 * components for MVP; only point slots are dynamic here.
 */
export type PresentationContent = {
  selectedModuleIds: string[];
  requirements: string;
  notes: string;
  modules: Record<string, ModuleSlideContent>;
};

export type MergeModulePointsOptions = {
  moduleId: string;
  defaults: SlidePointContent[];
  generated?: Array<Partial<SlidePointSlot> | null | undefined>;
};

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readSourcePointId(
  point: Partial<SlidePointSlot> | null | undefined,
): string | undefined {
  if (!point || typeof point !== "object" || !("sourcePointId" in point)) {
    return undefined;
  }

  const value = point.sourcePointId;
  return hasText(value) ? value.trim() : undefined;
}

/** Returns true when a point has both title and description. */
export function isValidSlidePointContent(
  point: Partial<SlidePointContent> | null | undefined,
): point is SlidePointContent {
  return hasText(point?.title) && hasText(point?.description);
}

/** Slot count for a module based on its built-in slide defaults. */
export function getModuleSlotCount(moduleId: string): number {
  return getModuleSlideDefaults(moduleId)?.points.length ?? 0;
}

/** Default point content for a module slide, if one exists. */
export function getModuleSlideDefaults(
  moduleId: string,
): ModuleSlideDefaults | undefined {
  return SLIDE_DEFAULTS[moduleId];
}

/** All module defaults keyed by module id. */
export function getAllModuleSlideDefaults(): Record<string, ModuleSlideDefaults> {
  return SLIDE_DEFAULTS;
}

/**
 * Merge generated points into fixed slots. For each index, use the generated
 * point when valid; otherwise keep the default for that slot.
 */
export function mergeModulePoints({
  moduleId,
  defaults,
  generated = [],
}: MergeModulePointsOptions): ModuleSlideContent {
  const slotCount = defaults.length;
  const points: SlidePointSlot[] = defaults.map((defaultPoint, index) => {
    const rawCandidate = generated[index];

    if (isValidSlidePointContent(rawCandidate)) {
      const slot: SlidePointSlot = {
        title: rawCandidate.title.trim(),
        description: rawCandidate.description.trim(),
      };

      const sourcePointId = readSourcePointId(rawCandidate);
      if (sourcePointId) {
        slot.sourcePointId = sourcePointId;
      }

      return slot;
    }

    return {
      title: defaultPoint.title,
      description: defaultPoint.description,
    };
  });

  return { moduleId, slotCount, points };
}

/** Merge one module's generated content with its built-in defaults. */
export function mergeGeneratedModuleContent(
  generated: GeneratedModuleContent,
): ModuleSlideContent | null {
  const defaults = getModuleSlideDefaults(generated.moduleId);
  if (!defaults) return null;

  return mergeModulePoints({
    moduleId: generated.moduleId,
    defaults: defaults.points,
    generated: generated.points,
  });
}

/** Build render-ready content for selected modules, merging each with defaults. */
export function buildPresentationContent(input: {
  selectedModuleIds: string[];
  requirements?: string;
  notes?: string;
  generatedModules?: GeneratedModuleContent[];
}): PresentationContent {
  const generatedByModuleId = new Map(
    (input.generatedModules ?? []).map((module) => [module.moduleId, module]),
  );

  const modules: Record<string, ModuleSlideContent> = {};

  for (const moduleId of input.selectedModuleIds) {
    const defaults = getModuleSlideDefaults(moduleId);
    if (!defaults) continue;

    const generated = generatedByModuleId.get(moduleId);
    modules[moduleId] = mergeModulePoints({
      moduleId,
      defaults: defaults.points,
      generated: generated?.points,
    });
  }

  return {
    selectedModuleIds: input.selectedModuleIds,
    requirements: input.requirements?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    modules,
  };
}

/** Convenience helper: fully defaulted content with no generated overrides. */
export function buildDefaultPresentationContent(
  selectedModuleIds: string[],
  options: { requirements?: string; notes?: string } = {},
): PresentationContent {
  return buildPresentationContent({
    selectedModuleIds,
    requirements: options.requirements,
    notes: options.notes,
  });
}
