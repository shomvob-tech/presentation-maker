"use client";

/**
 * Home page document picker.
 *
 * Replaces the three stacked pairs of buttons the home page grew as document
 * types were added — six competing calls to action, and a row taller every
 * time a flow ships. This is a segmented switch instead: pick the type, get
 * one primary CTA and one sample link. Adding a fourth document type is a new
 * entry in PROPOSAL_TYPES, not another row.
 *
 * Animation is CSS, matching the rest of the home page — framer-motion is in
 * the bundle but only the legacy WheelSection uses it, and a tab swap does not
 * justify pulling it onto this route.
 */

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";

type ProposalType = {
  id: string;
  /** Segment label — kept short; the switch is a single row on mobile. */
  label: string;
  /** One line, under the switch. Says what the document actually contains. */
  description: string;
  builderHref: string;
  ctaLabel: string;
  samplePath: string;
  sampleLabel: string;
};

const PROPOSAL_TYPES: ProposalType[] = [
  {
    id: "hris",
    label: "HRIS",
    description: "Cover, COO letter, module overview and commercial terms.",
    builderHref: "/proposal-builder",
    ctaLabel: "Start a new proposal",
    samplePath: "/resources/Sample_prop.pdf",
    sampleLabel: "View sample proposal",
  },
  {
    id: "sla",
    label: "SLA",
    description: "Thirteen articles, service features and authorised signatories.",
    builderHref: "/sla-builder",
    ctaLabel: "Start an SLA",
    samplePath: "/resources/Sample_sla.pdf",
    sampleLabel: "View sample SLA",
  },
  {
    id: "device",
    // Shortened from "Device quotation" when the fourth type landed —
    // four full-length labels do not fit the switch at phone width.
    label: "Device",
    description: "Itemised hardware quotation with delivery and warranty terms.",
    builderHref: "/device-builder",
    ctaLabel: "Start a device proposal",
    samplePath: "/resources/sample_device_prop.pdf",
    sampleLabel: "View sample quotation",
  },
  {
    id: "combined",
    label: "HRIS + Device",
    description:
      "Everything in the HRIS proposal plus itemised attendance hardware.",
    builderHref: "/combined-builder",
    ctaLabel: "Start a combined proposal",
    samplePath: "/resources/sample_device_prop.pdf",
    sampleLabel: "View sample quotation",
  },
  {
    id: "presentation",
    label: "Presentation",
    description:
      "A 16:9 pitch deck — Shomvob's introduction, then the slides for each module.",
    builderHref: "/presentation-builder",
    ctaLabel: "Start a presentation",
    // A live route rather than a PDF: the sample is the deck component itself.
    samplePath: "/300ltd",
    sampleLabel: "View sample presentation",
  },
];

export default function ProposalTypeChooser() {
  const [activeId, setActiveId] = useState(PROPOSAL_TYPES[0].id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = PROPOSAL_TYPES.findIndex((type) => type.id === activeId);
  const active = PROPOSAL_TYPES[activeIndex];

  /** Wraps at both ends, which is what the tablist pattern expects. */
  function selectAndFocus(index: number) {
    const count = PROPOSAL_TYPES.length;
    const next = ((index % count) + count) % count;

    setActiveId(PROPOSAL_TYPES[next].id);
    tabRefs.current[next]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowRight: activeIndex + 1,
      ArrowDown: activeIndex + 1,
      ArrowLeft: activeIndex - 1,
      ArrowUp: activeIndex - 1,
      Home: 0,
      End: PROPOSAL_TYPES.length - 1,
    };

    const target = moves[event.key];
    if (target === undefined) return;

    event.preventDefault();
    selectAndFocus(target);
  }

  return (
    <div className="flex flex-col items-center">
      <div
        role="tablist"
        aria-label="Document type"
        onKeyDown={handleKeyDown}
        className="flex w-full max-w-md flex-wrap items-center justify-center gap-1 rounded-2xl border border-white/10 bg-white/[0.045] p-1.5 shadow-lg shadow-black/20 backdrop-blur-sm sm:w-auto sm:max-w-none sm:flex-nowrap"
      >
        {PROPOSAL_TYPES.map((type, index) => {
          const isActive = type.id === activeId;

          return (
            <button
              key={type.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`proposal-type-${type.id}`}
              aria-selected={isActive}
              aria-controls="proposal-type-panel"
              // Roving tabindex: the switch is one Tab stop, arrows move within it.
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(type.id)}
              className={`flex-1 basis-[calc(50%-2px)] whitespace-nowrap rounded-xl px-4 py-3 text-sm sm:basis-auto transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#5cd47e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#03110a] sm:flex-none sm:px-6 ${
                isActive
                  ? "bg-[#edb713] font-bold text-[#0c3d20] shadow-md shadow-black/25"
                  : "font-medium text-white/65 hover:bg-white/[0.06] hover:text-white/90"
              }`}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      <div
        // Keyed on the active id so the CSS entrance replays on every switch.
        key={active.id}
        id="proposal-type-panel"
        role="tabpanel"
        aria-labelledby={`proposal-type-${active.id}`}
        className="home-panel-swap mt-7 flex flex-col items-center"
      >
        <p className="mb-6 max-w-md text-sm text-white/55 md:text-base">
          {active.description}
        </p>

        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <Link
            href={active.builderHref}
            className="home-button-sheen rounded-xl bg-[#edb713] px-8 py-4 text-base font-semibold text-[#0c3d20] shadow-lg shadow-black/20 transition hover:bg-[#f5c832] hover:shadow-xl"
          >
            <span className="relative z-10">{active.ctaLabel}</span>
          </Link>

          <a
            href={active.samplePath}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded text-base font-medium text-white/70 underline decoration-white/25 underline-offset-[6px] transition hover:text-white hover:decoration-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5cd47e] focus-visible:ring-offset-4 focus-visible:ring-offset-[#03110a]"
          >
            {active.sampleLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
