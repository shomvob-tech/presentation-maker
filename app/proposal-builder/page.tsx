import Image from "next/image";
import Link from "next/link";
import Clientdetails2 from "../components/Clientdetails2";

export default function ProposalBuilderPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0c3d20] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[#062b16]"
        style={{ clipPath: "polygon(0 0, 40% 0, 25% 100%, 0% 100%)" }}
      />
      <div className="pointer-events-none absolute -right-24 top-0 h-[360px] w-[360px] rounded-full bg-[#edb713] opacity-15 blur-[100px]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <Link href="/proposal-builder" className="inline-flex items-center gap-3">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={140}
            height={34}
            className="rounded-lg bg-white/95 px-3 py-2 shadow-lg"
          />
        </Link>
        <p className="text-sm font-medium text-white/70">Proposal builder</p>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-4 md:px-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#edb713]">
            Proposal builder
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Client &amp; commercial details
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/75 md:text-lg">
            Enter the details for this proposal. The cover page preview uses
            the client name, logo, title, and date you provide here.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/20 md:p-8">
          <Clientdetails2 />
        </div>
      </div>
    </main>
  );
}
