import knowledgeBase from "./knowledge_base.json";

export type ClientDetailsInput = {
  clientName: string;
  clientEmail: string;
  requirements: string;
  notes: string;
};

export type ModuleRecommendationResult = {
  modules: string[];
};

type KnowledgeBaseModule = {
  name: string;
};

function tokenizeRequirements(requirements: string): string[] {
  return requirements
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
}

function moduleMatchesRequirements(
  moduleName: string,
  requirementsText: string,
  requirementWords: string[],
): boolean {
  const normalizedModuleName = moduleName.toLowerCase();

  if (requirementsText.includes(normalizedModuleName)) {
    return true;
  }

  return requirementWords.some(
    (word) =>
      word.includes(normalizedModuleName) ||
      normalizedModuleName.includes(word),
  );
}

export function recommendModules(
  clientDetails: ClientDetailsInput,
  modules: KnowledgeBaseModule[] = knowledgeBase.modules,
): ModuleRecommendationResult {
  const requirementsText = clientDetails.requirements.toLowerCase();
  const requirementWords = tokenizeRequirements(clientDetails.requirements);

  const matchedModules = modules
    .filter((module) =>
      moduleMatchesRequirements(
        module.name,
        requirementsText,
        requirementWords,
      ),
    )
    .map((module) => module.name);

  return { modules: matchedModules };
}

export function getAllModuleNames(
  modules: KnowledgeBaseModule[] = knowledgeBase.modules,
): string[] {
  return modules.map((module) => module.name);
}
