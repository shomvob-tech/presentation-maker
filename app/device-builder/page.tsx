import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DeviceBuilderForm from "@/app/components/device/DeviceBuilderForm";

export const metadata: Metadata = {
  title: "Device Proposal Builder | Shomvob HR",
  description:
    "Build a client-ready biometric attendance device proposal and quotation.",
};

export default function DeviceBuilderPage() {
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
        <p className="text-sm font-medium text-white/70">Device proposal builder</p>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-4 md:px-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#edb713]">
            Biometric attendance device
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Build a device proposal
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/70 md:text-lg">
            Four pages — cover, letter, itemised quotation, and terms. Preview,
            print, or download the finished document without an email step.
          </p>
        </div>

        <DeviceBuilderForm />
      </div>
    </main>
  );
}
