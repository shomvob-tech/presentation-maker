import PreviewCommercialTermsPage from "@/app/components/Previewcommercial";
import PreviewLetterPage from "@/app/components/PreviewLetterPage";
import PreviewPage from "@/app/components/PreviewPage";

export default function ProposalPreviewPage() {
  return (
    <>
      <PreviewPage />
      <PreviewLetterPage />
      <PreviewCommercialTermsPage />
    </>
  );
}
