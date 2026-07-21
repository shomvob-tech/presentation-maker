import Image from "next/image";
import Link from "next/link";
import ClientDetailsForm from "../components/ClientDetailsForm";

const steps = [
  { label: "Start", status: "done" as const },
  { label: "Client details", status: "current" as const },
  { label: "Validate options", status: "upcoming" as const },
  { label: "Generate", status: "upcoming" as const },
];

export default function NewPresentationPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0c3d20] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[#062b16]"
        style={{ clipPath: "polygon(0 0, 40% 0, 25% 100%, 0% 100%)" }}
      />
      <div className="pointer-events-none absolute -right-24 top-0 h-[360px] w-[360px] rounded-full bg-[#edb713] opacity-15 blur-[100px]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={140}
            height={34}
            className="rounded-lg bg-white/95 px-3 py-2 shadow-lg"
          />
        </Link>
        <Link
          href="/300ltd"
          className="text-sm font-medium text-white/70 transition-colors hover:text-[#edb713]"
        >
          300 Ltd example →
        </Link>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-4 md:px-10">
        <nav aria-label="Progress" className="mb-10">
          <ol className="flex items-center gap-2 md:gap-4">
            {steps.map((step, index) => (
              <li key={step.label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.status === "done"
                      ? "bg-[#edb713] text-[#0c3d20]"
                      : step.status === "current"
                        ? "bg-white text-[#0c3d20]"
                        : "bg-white/15 text-white/50"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    step.status === "upcoming" ? "text-white/45" : "text-white"
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 ? (
                  <span className="hidden h-px flex-1 bg-white/20 sm:block" />
                ) : null}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#edb713]">
            Step 2 of 4
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Client details
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/75 md:text-lg">
            Capture what you learned on the demo call. These details feed the
            AI content generator and help tailor the presentation to the
            client&apos;s needs.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/20 md:p-8">
          <ClientDetailsForm />
        </div>
      </div>
    </main>
  );
}
