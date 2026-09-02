import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SlaBuilderForm from "@/app/components/sla/SlaBuilderForm";

export const metadata: Metadata = {
  title: "SLA Builder | Shomvob HR",
  description: "Build a client-ready Shomvob HR service level agreement.",
};

export default function SlaBuilderPage() {
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
        <p className="text-sm font-medium text-white/70">SLA builder</p>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-4 md:px-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#edb713]">
            Service Level Agreement
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Build a client-ready SLA
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/70 md:text-lg">
            Complete the agreement, service, commercial, and signatory details.
            Preview, print, or download the finished document without an email step.
          </p>
        </div>

        <SlaBuilderForm />
      </div>
    </main>
  );
}
