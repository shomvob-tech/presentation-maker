import Image from "next/image";

/**
 * Design 2 — "Centered Editorial"
 * A quiet, keynote-style composition: near-black green backdrop, a giant
 * faint "300" watermark for depth, and a single centered column (kicker,
 * headline, phone mockup) rather than a left/right split.
 */
export default function TitleSlideDesignTwo() {
  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#040f09] text-white">
      {/* giant faint watermark numeral for depth */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[-4%] top-1/2 -translate-y-1/2 select-none text-[42rem] font-bold leading-none text-white/[0.035]"
      >
        300
      </span>

      {/* footer brand bar */}
      <div className="absolute inset-x-0 bottom-10 z-10 flex items-center justify-center gap-5">
        <div className="rounded-lg bg-white/95 px-3 py-1.5 shadow-md">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={110}
            height={26}
          />
        </div>
        <div className="h-6 w-px bg-white/20" />
        <span className="text-lg font-bold tracking-tight text-white/70">
          300 <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Ltd</span>
        </span>
      </div>

      {/* centered content column */}
      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-7 px-[6%] text-center">
        <span className="rounded-full border border-[#edb713]/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#edb713]">
          HR Modernization Proposal
        </span>

        <h1 className="text-5xl font-bold leading-[1.15] tracking-tight lg:text-6xl">
          Building a Smarter HR Ecosystem
          <br />
          <span className="text-[#edb713]">for 300 Ltd</span>
        </h1>

        <div className="h-[2px] w-16 rounded-full bg-white/25" />

        <p className="max-w-lg text-base leading-relaxed text-white/60">
          One connected platform for attendance, leave, payroll, and
          employee self-service &mdash; designed around how 300 Ltd
          actually works.
        </p>

        {/* small centered phone mockup, framed simply */}
        <div className="mt-4 rounded-[2rem] border-2 border-[#edb713]/50 bg-black/20 p-2 shadow-2xl shadow-black/50">
          <div className="overflow-hidden rounded-[1.6rem]">
            <Image
              src="/resources/Login.png"
              alt="Shomvob HR mobile login screen mockup"
              width={200}
              height={404}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
