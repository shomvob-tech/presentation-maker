import PreviewCommercialTermsPage from "@/app/components/Previewcommercial";
import PreviewLetterPage from "@/app/components/PreviewLetterPage";
import PreviewModuleOverviewPage from "@/app/components/Previewmoduleoverviewpage";
import PreviewPage from "@/app/components/PreviewPage";
import PrintPdfButton from "@/app/components/PrintPdfButton";

export default function ProposalPreviewPage() {
  return (
    <>
      <PreviewPage />
      <PreviewLetterPage />
      <PreviewModuleOverviewPage />
      <PreviewCommercialTermsPage />
      
    </>
  );
}
