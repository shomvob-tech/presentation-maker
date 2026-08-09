"use client";

import Image from "next/image";
import ClientLogo from "./ClientLogo";
import { usePresentationBranding } from "./PresentationBrandingContext";
import { useClientName } from "./useClientName";

/**
 * Design 3 — "Bold Geometric Card"
 * A more graphic, techy composition: diagonally split green background,
 * a chip-labelled headline block, and the phone mockup presented as a
 * floating white device card overlapping a decorative circle.
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

      {/* top-right brand badge */}
      <div className="relative z-10 flex justify-end px-[6%] pt-10">
        <div className="rounded-xl bg-white/95 px-4 py-2 shadow-lg">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={130}
            height={31}
          />
        </div>
      </div>

      {/* main content grid */}
      <div className="relative z-10 flex flex-1 items-center px-[6%]">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* left: headline block */}
          <div className="flex max-w-xl flex-col gap-6">
            <span className="inline-block rounded-full bg-[#edb713] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#0c3d20]">
              HR Ecosystem Proposal
            </span>
            <h1 className="text-5xl font-bold leading-[1.08] tracking-tight text-white lg:text-6xl">
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
          <div className="relative flex items-center justify-center py-10">
            <div className="pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-[#edb713]/15" />
            <div className="relative rotate-3 rounded-[2rem] bg-white/95 p-3 shadow-2xl shadow-black/50">
              <div className="overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/resources/Login.png"
                  alt="Shomvob HR mobile login screen mockup"
                  width={240}
                  height={484}
                  priority
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
