import knowledgeBase from "./knowledge_base.json";

/**
 * Maps a knowledge base module id to the slide registry key that renders it.
 * Modules not listed here don't have a dedicated slide component yet and
 * are simply skipped when building a presentation.
 */
export const MODULE_SLIDE_MAP: Record<string, string> = {
  "employee-management": "employee-management",
  attendance: "attendance",
  leave: "leave",
  payroll: "payroll",
  schedule: "schedule",
  recruitment: "recruitment",
  dashboard: "dashboard",
};

export const MANDATORY_START_SLIDES = ["title", "intro", "about"];
export const MANDATORY_END_SLIDES = ["thankyou"];

function getModuleNameToIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const module of knowledgeBase.modules) {
    map[module.name] = module.id;
  }
  return map;
}

/** Converts module display names (as used in the UI) to knowledge base ids. */
export function moduleNamesToIds(moduleNames: string[]): string[] {
  const nameToId = getModuleNameToIdMap();
  return moduleNames
    .map((name) => nameToId[name])
    .filter((id): id is string => Boolean(id));
}

/**
 * Builds the ordered list of slide keys for a presentation: the mandatory
 * opening slides, one slide per selected module (in knowledge base order,
 * skipping modules without a dedicated slide), then the mandatory closing
 * slide.
 */
export function generateSlidePlan(selectedModuleIds: string[]): string[] {
  const knowledgeBaseOrder = knowledgeBase.modules.map((module) => module.id);
  const selectedSet = new Set(selectedModuleIds);

  const moduleSlideKeys = knowledgeBaseOrder
    .filter((id) => selectedSet.has(id) && MODULE_SLIDE_MAP[id])
    .map((id) => MODULE_SLIDE_MAP[id]);

  return [...MANDATORY_START_SLIDES, ...moduleSlideKeys, ...MANDATORY_END_SLIDES];
}

/** Builds the temporary preview page path for a set of selected module ids. */
export function buildPreviewPath(selectedModuleIds: string[]): string {
  const params = new URLSearchParams();
  if (selectedModuleIds.length > 0) {
    params.set("modules", selectedModuleIds.join(","));
  }
  const query = params.toString();
  return query ? `/preview?${query}` : "/preview";
}

/** Parses the comma-separated `modules` query param back into an id list. */
export function parseModuleIdsParam(param: string | undefined | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Module ids that currently have a dedicated slide component available. */
export const MODULES_WITH_SLIDES = new Set(Object.keys(MODULE_SLIDE_MAP));
