import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PresentationBuilderForm from "@/app/components/presentation/PresentationBuilderForm";

export const metadata: Metadata = {
  title: "Presentation Builder | Shomvob HR",
  description:
    "Build a client-branded Shomvob HR pitch deck from the module slides the client needs.",
};

export default function PresentationBuilderPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#03110a] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 45% at 50% 0%, #1a4d2e 0%, #0a2318 42%, #03110a 100%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={140}
            height={34}
            className="rounded-lg px-3 py-2"
          />
        </Link>
        <p className="text-sm font-medium text-white/70">Presentation builder</p>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-4 md:px-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#edb713]">
            Pitch presentation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Build a presentation
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/70 md:text-lg">
            A 16:9 deck: the Shomvob introduction, the slides for each module
            you pick, and a closing slide, branded with the client&apos;s name
            and logo. Preview, print, or download it as a PDF.
          </p>
          <a
            href="/300ltd"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-white/70 underline decoration-white/25 underline-offset-[6px] transition hover:text-white hover:decoration-white/60"
          >
            See the 300 Ltd sample deck
          </a>
        </div>

        <PresentationBuilderForm />
      </div>
    </main>
  );
}
