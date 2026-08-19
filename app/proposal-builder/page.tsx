import Image from "next/image";
import Link from "next/link";
import Clientdetails2 from "../components/Clientdetails2";

export default function ProposalBuilderPage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#03110a] text-white">
      {/* Static gradient background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, #1a4d2e 0%, #0a2318 40%, #03110a 100%)",
        }}
      />
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <Link href="/proposal-builder" className="inline-flex items-center gap-3">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={140}
            height={34}
            className="rounded-lg bg-var[--color-brand_gray] px-3 py-2 shadow-lg"
          />
        </Link>
        <p className="text-sm font-medium text-white/70">Proposal builder</p>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-4 md:px-10">
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

        {/* <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/20 md:p-8"> */}
          <Clientdetails2 />
        {/* </div> */}
      </div>
    </main>
  );
}
