"use client";

import Image from "next/image";
import ClientLogo from "./ClientLogo";
import { usePresentationBranding } from "./PresentationBrandingContext";
import ShomvobMark from "./ShomvobMark";
import { useClientName } from "./useClientName";

/**
 * The headline drops a size for long client names, so a long legal name still
 * fits beside the phone on a 16:9 slide instead of running off its bottom.
 */
function headlineSizeClass(clientName: string | null): string {
  const length = clientName?.length ?? 0;
  if (length > 60) return "text-4xl";
  if (length > 22) return "text-5xl";
  return "text-6xl";
}

/**
 * Design 3 — "Bold Geometric Card"
 * A more graphic, techy composition: diagonally split green background,
 * a chip-labelled headline block, and the phone mockup presented as a
 * floating white device card overlapping a decorative circle.
 *
 * The headline and the phone always share one row, the phone right beside
 * the headline. There is deliberately no breakpoint: a print engine can lay
 * the page out at any width, and when this was a responsive grid the phone
 * dropped under the headline in the PDF and was cut off at the slide's edge.
 */
export default function TitleSlideDesignThree() {
  const clientName = useClientName();
  const { useGenericCopy } = usePresentationBranding();

  return (
    <section
      data-slide="title"
      className="relative flex h-screen w-full flex-col overflow-hidden bg-[#0c3d20] text-white"
    >
      {/* diagonal color-block backdrop */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#062b16]"
        style={{ clipPath: "polygon(0 0, 42% 0, 20% 100%, 0% 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[#137a3c]/40"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 60% 100%, 78% 0)" }}
      />

      {/* decorative blurred gold blob */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#edb713] opacity-25 blur-[100px]" />

      {/* decorative dot grid, bottom-left */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #edb713 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* top-right brand mark */}
      <div className="relative z-10 flex justify-end px-[6%] pt-10">
        <ShomvobMark tone="dark" />
      </div>

      {/* main content — min-h-0 so the row can never push the client mark
          below off the slide */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center px-[6%]">
        <div className="flex items-center gap-[clamp(3rem,6vw,7rem)]">
          {/* left: headline block */}
          <div className="flex min-w-0 max-w-xl flex-col gap-6">
            <span className="inline-block rounded-full bg-[#edb713] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#0c3d20]">
              HR Ecosystem Proposal
            </span>
            <h1
              className={`${headlineSizeClass(useGenericCopy ? null : clientName)} font-bold leading-[1.08] tracking-tight text-white`}
            >
              {useGenericCopy
                ? "Building a Smarter HR Ecosystem"
                : `Building a Smarter HR Ecosystem for ${clientName}`}
            </h1>
            <div className="h-1.5 w-24 rounded-full bg-[#edb713]" />
            <p className="text-lg leading-relaxed text-white/70">
              {useGenericCopy ? (
                <>
                  Bringing everyday HR operations into one mobile-first
                  platform &mdash; built for how modern teams work.
                </>
              ) : (
                <>
                  Mapping {clientName}&apos;s HR challenges to a single
                  mobile-first platform &mdash; built for how the team already
                  works.
                </>
              )}
            </p>
          </div>

          {/* right: device card floating over a decorative circle */}
          <div className="relative flex shrink-0 items-center justify-center">
            <div className="pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-[#edb713]/15" />
            <div className="relative rotate-3 rounded-[2rem] bg-white/95 p-3 shadow-2xl shadow-black/50">
              <div className="overflow-hidden rounded-[1.5rem]">
                {/* Full size (484px) on a 720px-tall slide; shorter slides
                    shrink it to what is left between header and footer. */}
                <Image
                  src="/resources/Login.png"
                  alt="Shomvob HR mobile login screen mockup"
                  width={240}
                  height={484}
                  priority
                  className="h-[min(30.25rem,calc(100vh-15rem))] w-auto"
                />
              </div>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0c3d20] px-3 py-1 text-xs font-semibold text-white shadow-md">
                Employee Login Experience
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* bottom-left client mark */}
      <div className="relative z-10 flex flex-col gap-3 px-[6%] pb-10">
        <div className="h-px w-20 bg-[#edb713]/60" />
        <ClientLogo size="lg" className="self-start" />
      </div>
    </section>
  );
}
