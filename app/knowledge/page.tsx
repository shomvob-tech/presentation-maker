import KnowledgeBaseExplorer from "@/app/components/KnowledgeBaseExplorer";
import knowledgeBase from "@/lib/knowledge_base.json";
import slidePoints from "@/lib/slide_points.json";

export default function KnowledgePage() {
  return (
    <KnowledgeBaseExplorer
      knowledgeBase={knowledgeBase}
      slidePoints={slidePoints}
    />
  );
}
