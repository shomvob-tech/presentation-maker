import Image from "next/image";

/**
 * Design 1 — "Split Panel Classic"
 * A refined, restyled take on the original deck's title slide: dark green
 * gradient backdrop, left-aligned headline column, right-aligned tilted
 * phone mockup with a soft gold glow.
 */
export default function TitleSlideDesignOne() {
  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-[#02140b] via-[#0a3d22] to-[#166536] text-white">
      {/* decorative dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* soft gold glow behind the phone mockup */}
      <div className="pointer-events-none absolute right-[8%] top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-[#edb713] opacity-20 blur-[110px]" />

      {/* top-left brand badge */}
      <div className="relative z-10 flex items-center px-[6%] pt-10">
        <div className="rounded-xl bg-white/95 px-4 py-2 shadow-lg">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={140}
            height={33}
          />
        </div>
      </div>

      {/* main content */}
      <div className="relative z-10 flex flex-1 items-center px-[6%]">
        <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
          {/* left: headline column */}
          <div className="flex max-w-xl flex-col gap-6">
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-[#edb713]">
              HR Modernization Proposal
            </span>
            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white lg:text-6xl">
              Building a Smarter HR Ecosystem for 300 Ltd
            </h1>
            <div className="h-[3px] w-16 rounded-full bg-[#edb713]" />
            <p className="text-lg leading-relaxed text-white/70">
              A unified, mobile-first HR platform built around 300 Ltd&apos;s
              workforce &mdash; from attendance to payroll, in one place.
            </p>
          </div>

          {/* right: tilted phone mockup */}
          <div className="flex items-center justify-center">
            <div className="rotate-[-6deg] rounded-[2.4rem] bg-neutral-900 p-2.5 shadow-2xl shadow-black/60">
              <div className="overflow-hidden rounded-[2rem]">
                <Image
                  src="/resources/Login.png"
                  alt="Shomvob HR mobile login screen mockup"
                  width={260}
                  height={525}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom-left signature wordmark */}
      <div className="relative z-10 flex items-baseline gap-3 px-[6%] pb-10">
        <span className="text-4xl font-bold tracking-tight text-white">
          300
        </span>
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
          Ltd
        </span>
      </div>
    </section>
  );
}
