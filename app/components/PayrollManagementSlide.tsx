import Image from "next/image";

const features = [
  {
    number: "01",
    title: "Late Deduction",
    copy: "Automatically calculate salary deductions for late arrivals.",
    icon: "clock",
  },
  {
    number: "02",
    title: "Leave Deduction",
    copy: "Apply leave-based deductions according to company policies.",
    icon: "leave",
  },
  {
    number: "03",
    title: "Payroll Generation",
    copy: "Generate accurate payroll with attendance and leave data.",
    icon: "generate",
  },
  {
    number: "04",
    title: "Tax Certificate",
    copy: "Generate employee tax certificates with a single click.",
    icon: "certificate",
    highlight: true,
  },
];

function FeatureIcon({ type }: { type: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "clock" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2M8 3.5h1.6M14.4 3.5H16" />
        </>
      )}
      {type === "leave" && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M8 3v4m8-4v4M3.5 9.5h17" />
          <path d="m9 15 2.2 2.2L16 13" />
        </>
      )}
      {type === "generate" && (
        <>
          <rect x="4" y="3.5" width="13" height="17" rx="2" />
          <path d="M7.5 8h6m-6 3.5h6m-6 3.5h4" />
          <path d="M17 15.5 19.5 18 17 20.5" />
        </>
      )}
      {type === "certificate" && (
        <>
          <rect x="3.5" y="4" width="17" height="12" rx="2" />
          <circle cx="8" cy="10" r="2" />
          <path d="M6.3 14.2c.4-1.3 1-1.9 1.7-1.9s1.3.6 1.7 1.9M13 8h5m-5 3.5h5" />
          <path d="m9.5 18 1.5 1.5L14 16" />
        </>
      )}
    </svg>
  );
}

export default function PayrollManagementSlide() {
  return (
    <section className="relative grid h-screen w-full grid-cols-[65%_35%] overflow-hidden bg-[#f3f0e5] text-[#092d19]">
      <main className="relative p-[clamp(2rem,4vw,4.5rem)]">
        <div className="rounded-xl bg-white px-4 py-2 shadow-sm w-fit">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={120}
            height={28}
          />
        </div>

        <div className="mt-[clamp(1.5rem,2.6vw,2.5rem)]">
          <span className="text-[clamp(0.55rem,0.65vw,0.72rem)] font-bold uppercase tracking-[0.22em] text-[#28a143]">
            Module 05 &middot; Payroll
          </span>
          <h1 className="mt-2 text-[clamp(2.1rem,3.4vw,3.9rem)] font-bold leading-none tracking-tight">
            Payroll Management
          </h1>
          <p className="mt-3 max-w-lg text-[clamp(0.75rem,0.95vw,1.05rem)] leading-relaxed text-[#496454]">
            Attendance and leave data flow straight into payroll &mdash;
            accurate, automatic, and audit-ready.
          </p>
        </div>

        <div className="mt-[clamp(1.75rem,3vw,3rem)] grid grid-cols-2 gap-[clamp(0.75rem,1.2vw,1.3rem)]">
          {features.map((feature) => (
            <article
              key={feature.number}
              className={`relative flex items-start gap-[clamp(0.8rem,1.2vw,1.3rem)] overflow-hidden rounded-2xl border p-[clamp(0.95rem,1.4vw,1.5rem)] shadow-sm ${
                feature.highlight
                  ? "border-[#edb713] bg-white"
                  : "border-[#0c3d20]/10 bg-white"
              }`}
            >
              <span className="absolute right-3 top-2 text-[clamp(1.5rem,2.2vw,2.6rem)] font-black text-[#0c3d20]/[0.06]">
                {feature.number}
              </span>
              <div
                className={`flex h-[clamp(2.7rem,3.6vw,4rem)] w-[clamp(2.7rem,3.6vw,4rem)] shrink-0 items-center justify-center rounded-xl ${
                  feature.highlight
                    ? "bg-[#edb713] text-[#0c3d20]"
                    : "bg-[#0c3d20] text-[#edb713]"
                }`}
              >
                <FeatureIcon type={feature.icon} />
              </div>
              <div className="relative">
                {feature.highlight && (
                  <span className="mb-1 inline-flex w-fit rounded-full bg-[#edb713]/15 px-2.5 py-0.5 text-[clamp(0.44rem,0.52vw,0.58rem)] font-bold uppercase tracking-[0.14em] text-[#a3780a]">
                    Requirement covered
                  </span>
                )}
                <h2 className="text-[clamp(0.78rem,1vw,1.1rem)] font-bold leading-tight">
                  {feature.title}
                </h2>
                <p className="mt-1.5 text-[clamp(0.55rem,0.66vw,0.74rem)] leading-relaxed text-[#496454]">
                  {feature.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </main>

      <aside className="relative flex flex-col overflow-hidden bg-[#0c3d20] px-[clamp(1.5rem,2.6vw,2.5rem)] py-[clamp(2rem,3.4vw,3.4rem)] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #edb713 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-[280px] w-[280px] rounded-full bg-[#28a143]/40 blur-[70px]" />

        <div className="relative z-10 flex h-full flex-col">
          <Image
            src="/resources/300_ltd_logo.svg"
            alt="300 Ltd"
            width={125}
            height={45}
            className="h-10 w-auto"
          />

          <div className="mt-[clamp(1.5rem,2.6vw,2.5rem)]">
            <span className="inline-flex rounded-full bg-[#edb713] px-3.5 py-1.5 text-[clamp(0.48rem,0.58vw,0.65rem)] font-bold uppercase tracking-[0.18em] text-[#0c3d20]">
              Payroll, connected
            </span>
            <p className="mt-4 text-[clamp(0.75rem,0.98vw,1.05rem)] leading-relaxed text-white/70">
              No more manual handoffs between attendance sheets and salary
              runs &mdash; one pipeline, start to finish.
            </p>
          </div>

          {/* mini payslip mockup */}
          <div className="relative mt-auto overflow-hidden rounded-2xl bg-white/95 p-[clamp(1rem,1.5vw,1.5rem)] text-[#092d19] shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-dashed border-[#0c3d20]/20 pb-3">
              <span className="text-[clamp(0.6rem,0.72vw,0.8rem)] font-bold uppercase tracking-[0.1em]">
                Payslip Preview
              </span>
              <span className="rounded-full bg-[#28a143]/15 px-2.5 py-0.5 text-[clamp(0.46rem,0.55vw,0.6rem)] font-bold uppercase tracking-[0.1em] text-[#1c7a3a]">
                Auto-generated
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-[clamp(0.58rem,0.7vw,0.78rem)]">
              <div className="flex items-center justify-between">
                <dt className="text-[#5c6f63]">Base Salary</dt>
                <dd className="font-semibold">৳ 22,000</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#5c6f63]">Late Deduction</dt>
                <dd className="font-semibold text-[#b3401a]">&minus; ৳ 300</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#5c6f63]">Leave Deduction</dt>
                <dd className="font-semibold text-[#b3401a]">&minus; ৳ 500</dd>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-[#0c3d20]/20 pt-2">
                <dt className="font-bold">Net Payable</dt>
                <dd className="font-bold text-[#1c7a3a]">৳ 21,200</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>
    </section>
  );
}
