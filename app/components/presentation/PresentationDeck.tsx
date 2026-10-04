import { buildDeckPlan } from "@/lib/deck-catalog";
import { ClientPresentationBranding } from "../PresentationBrandingContext";
import { DECK_SLIDES } from "./deck-slides";

/**
 * Print geometry for a 16:9 deck. globals.css makes A4 the page size for the
 * whole app, so this overrides it — and only while a deck is on the page,
 * which a rule in a stylesheet could not promise: Next keeps a route's CSS
 * loaded after client-side navigation, and an A4 document printed afterwards
 * would come out 16:9. As a <style> element it unmounts with the deck.
 *
 * 13.333in × 7.5in is 1280 × 720 CSS pixels, the size globals.css already
 * gives every printed slide <section>. The flex column is dropped for print
 * so each slide is a plain block the page breaks can land between.
 */
const DECK_PRINT_CSS = `
@media print {
  @page {
    size: 13.333in 7.5in;
    margin: 0;
  }
  .deck-root {
    display: block !important;
  }
}
`;

/**
 * One client's deck: the opening slides, a slide set per selected module, and
 * the closing slide, in catalog order. Rendered by the builder's preview and
 * by the /300ltd sample, so the two cannot differ.
 *
 * Every slide is a direct child of `.deck-root`. The PDF route and the print
 * button count them there, and globals.css relies on the last one being
 * `section:last-child` to avoid a trailing blank page.
 */
export default function PresentationDeck({
  clientName,
  logoSrc,
  moduleIds,
}: {
  clientName: string;
  logoSrc: string | null;
  moduleIds: readonly string[];
}) {
  const plan = buildDeckPlan(moduleIds);

  return (
    <ClientPresentationBranding clientName={clientName} logoSrc={logoSrc}>
      <style>{DECK_PRINT_CSS}</style>
      <div
        data-deck-root
        data-slide-count={plan.length}
        className="deck-root flex flex-col"
      >
        {plan.map(({ key, slideNumber, moduleNumber }) => {
          const Slide = DECK_SLIDES[key];
          return (
            <Slide key={key} slideNumber={slideNumber} moduleNumber={moduleNumber} />
          );
        })}
      </div>
    </ClientPresentationBranding>
  );
}
