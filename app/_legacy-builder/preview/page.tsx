import { generateSlidePlan, parseModuleIdsParam } from "@/lib/points-generator";
import { SLIDE_COMPONENTS } from "../components/slide-registry";

type PreviewPageProps = {
  searchParams: Promise<{ modules?: string | string[] }>;
};

export default async function PreviewPage({ searchParams }: PreviewPageProps) {
  const resolvedSearchParams = await searchParams;
  const modulesParam = Array.isArray(resolvedSearchParams.modules)
    ? resolvedSearchParams.modules[0]
    : resolvedSearchParams.modules;

  const selectedModuleIds = parseModuleIdsParam(modulesParam);
  const slidePlan = generateSlidePlan(selectedModuleIds);

  return (
    <div className="flex flex-col">
      {slidePlan.map((slideKey, index) => {
        const SlideComponent = SLIDE_COMPONENTS[slideKey];
        if (!SlideComponent) return null;
        return <SlideComponent key={`${slideKey}-${index}`} />;
      })}
    </div>
  );
}
