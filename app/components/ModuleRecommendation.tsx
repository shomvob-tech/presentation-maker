"use client";

import {
  recommendModules,
  type ClientDetailsInput,
  type ModuleRecommendationResult,
} from "@/lib/module-recommendation";

type ModuleRecommendationProps = {
  clientDetails: ClientDetailsInput;
};

export function getModuleRecommendation(
  clientDetails: ClientDetailsInput,
): ModuleRecommendationResult {
  return recommendModules(clientDetails);
}

export default function ModuleRecommendation({
  clientDetails,
}: ModuleRecommendationProps) {
  const recommendation = getModuleRecommendation(clientDetails);

  return (
    <div className="rounded-xl border border-[#137a3c]/30 bg-[#137a3c]/10 px-5 py-4">
      <p className="text-sm font-medium text-[#0c3d20]">Recommended modules</p>
      <p className="mt-1 text-xs text-[#0c3d20]/65">
        Matched from requirements against knowledge base module names.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-white/80 p-4 text-xs text-[#0c3d20]">
        {JSON.stringify(recommendation, null, 2)}
      </pre>
    </div>
  );
}
