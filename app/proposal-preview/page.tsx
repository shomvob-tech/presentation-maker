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
      {/* Renders the "Save as PDF" button and, on ?print=1, opens the print
          dialog once the A4 pages have mounted. Without it the builder's
          "Print as PDF" only opens the preview. */}
      <PrintPdfButton />
    </>
  );
}
