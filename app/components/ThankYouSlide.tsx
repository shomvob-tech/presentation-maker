import Image from "next/image";
import ClientLogo from "./ClientLogo";

export default function ThankYouSlide() {
  return (
    <section
      data-slide="thank-you"
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#04150c] text-white"
    >
      {/* bookend diagonal color-blocks, echoing the title slide */}
      <div
        className="pointer-events-none absolute inset-0 bg-[#0c3d20]"
        style={{ clipPath: "polygon(0 0, 38% 0, 16% 100%, 0 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[#137a3c]/35"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 64% 100%, 82% 0)" }}
      />

      {/* giant ghost numeral for depth, matching slide 2's motif */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[42rem] font-bold leading-none text-white/[0.035]"
      >
        /+\
      </span>

      <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#edb713] opacity-20 blur-[110px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex max-w-3xl flex-col items-center gap-7 px-[6%] text-center">
        <span className="rounded-full border border-[#edb713]/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#edb713]">
          Let&apos;s Build This, Together
        </span>

        <h1 className="text-6xl font-bold leading-[1.05] tracking-tight lg:text-7xl">
          Thank You.
        </h1>

        <div className="h-[3px] w-16 rounded-full bg-[#edb713]" />

        <p className="max-w-xl text-lg leading-relaxed text-white/65">
          A smarter, connected HR ecosystem for 300 Ltd, powered by Shomvob.
        </p>

        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white/80">
          <span className="h-2 w-2 rounded-full bg-[#28a143]" />
          Ready to move forward
        </span>
      </div>

      {/* closing signature bar */}
      <div className="absolute inset-x-0 bottom-[7%] z-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-5">
          <div className="rounded-lg bg-white/95 px-3 py-1.5 shadow-md">
            <Image
              src="/resources/shomvob_hr_text.png"
              alt="Shomvob HR"
              width={110}
              height={26}
            />
          </div>
          <div className="h-6 w-px bg-white/20" />
          <ClientLogo size="sm" />
        </div>
      </div>
    </section>
  );
}
