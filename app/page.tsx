import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#0c3d20] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[#062b16]"
        style={{ clipPath: "polygon(0 0, 55% 0, 35% 100%, 0% 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[#137a3c]/30"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 50% 100%, 70% 0)" }}
      />
      <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#edb713] opacity-20 blur-[120px]" />

      <header className="relative z-10 flex items-center justify-between px-8 py-8 md:px-12">
        <Image
          src="/resources/shomvob_hr_text.png"
          alt="Shomvob HR"
          width={150}
          height={36}
          className="rounded-lg bg-white/95 px-4 py-2 shadow-lg"
        />
        <Link
          href="/300ltd"
          className="text-sm font-medium text-white/70 transition-colors hover:text-[#edb713]"
        >
          300 Ltd deck →
        </Link>
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-20 pt-8 text-center md:px-12">
        <p className="mb-4 inline-block rounded-full border border-[#edb713]/40 bg-[#edb713]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#edb713]">
          Presentation Maker v2.0beta
        </p>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Build polished HR decks in minutes
        </h1>

        <p className="mt-6 max-w-xl text-lg text-white/75 md:text-xl">
          Create client-ready presentations with Shomvob branding — tailored
          slides, consistent design, export-ready output.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/new"
            className="rounded-xl bg-[#edb713] px-8 py-4 text-base font-semibold text-[#0c3d20] shadow-lg shadow-black/20 transition hover:bg-[#f5c832] hover:shadow-xl"
          >
            Make new presentation
          </Link>
          <Link
            href="/knowledge"
            className="rounded-xl border border-white/25 px-8 py-4 text-base font-medium text-white/90 transition hover:border-white/50 hover:bg-white/5"
          >
            View current knowledge base and slide points
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-8 py-6 text-center text-sm text-white/50 md:px-12">
        Powered by{" "}
        <span className="font-medium text-[#edb713]">Shomvob Technologies</span>
      </footer>
    </main>
  );
}
