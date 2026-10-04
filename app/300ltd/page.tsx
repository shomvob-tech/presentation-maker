import type { Metadata } from "next";
import PresentationDeck from "../components/presentation/PresentationDeck";
import { DECK_MODULE_IDS } from "@/lib/deck-catalog";

export const metadata: Metadata = {
  title: "Sample Presentation | Shomvob HR",
  description: "A sample Shomvob HR pitch deck with every module included.",
};

/**
 * The sample deck the home page links to: the presentation builder's output
 * for 300 Ltd with every module ticked. It renders the same component as
 * /presentation-preview, so the sample always shows what reps get.
 */
export default function ThreeHundredLtdPresentation() {
  return (
    <PresentationDeck
      clientName="300 Ltd"
      logoSrc="/resources/300_ltd_logo.svg"
      moduleIds={DECK_MODULE_IDS}
    />
  );
}
