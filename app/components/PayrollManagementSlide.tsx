import Image from "next/image";

const features = [
  {
    number: "01",
    title: "Late Deduction",
    copy: "Automatically calculate late penalties from attendance records.",
    icon: "clock",
  },
  {
    number: "02",
    title: "Leave Deduction",
    copy: "Apply policy-based deductions when paid leave is unavailable.",
    icon: "leave",
  },
  {
    number: "03",
    title: "Absent Deduction",
    copy: "Convert unapproved absences into accurate payroll adjustments.",
    icon: "absent",
  },
  {
    number: "04",
    title: "Flexible Deduction",
    copy: "Deduct from salary or leave balance based on company policy.",
    icon: "adjust",
  },
  {
    number: "05",
    title: "Flexible Pay Cycles",
    copy: "Run monthly, bi-weekly, fixed-date, or hourly payroll.",
    icon: "cycle",
  },
  {
    number: "06",
    title: "Flexible Pay Structure",
    copy: "Calculate compensation by pay grade or individual salary.",
    icon: "structure",
  },
  {
    number: "07",
    title: "Bonus Management",
    copy: "Add overtime, attendance, and custom bonuses in one place.",
    icon: "bonus",
  },
  {
    number: "08",
    title: "Payroll Generation",
    copy: "Generate final payroll from attendance, leave, and pay rules.",
    icon: "generate",
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
      {type === "absent" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.5 8.5 7 7m0-7-7 7" />
        </>
      )}
      {type === "adjust" && (
        <>
          <path d="M4 7h16M7 4v6m10 4v6M4 17h16" />
          <circle cx="7" cy="7" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </>
      )}
      {type === "cycle" && (
        <>
          <path d="M20 7h-5V2" />
          <path d="M19 7a8 8 0 1 0 1 7" />
          <path d="M12 8v4l3 2" />
        </>
      )}
      {type === "structure" && (
        <>
          <path d="m12 3 8 4-8 4-8-4 8-4Z" />
          <path d="m4 12 8 4 8-4M4 17l8 4 8-4" />
        </>
      )}
      {type === "bonus" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v10m3-8.2c-.7-.7-1.7-1-3-1-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1" />
        </>
      )}
      {type === "generate" && (
        <>
          <rect x="4" y="3.5" width="13" height="17" rx="2" />
          <path d="M7.5 8h6m-6 3.5h6m-6 3.5h4" />
          <path d="M17 15.5 19.5 18 17 20.5" />
        </>
      )}
    </svg>
  );
}

export default function PayrollManagementSlide() {
  return (
    <section
      data-module="payroll"
      className="relative h-screen w-full overflow-hidden bg-[#f3f0e5] text-[#092d19]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32%] bg-[#0c3d20]" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[32%] opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #edb713 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="pointer-events-none absolute -right-20 -top-28 h-[420px] w-[420px] rounded-full bg-[#28a143]/25 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-[340px] w-[340px] rounded-full border-[65px] border-[#28a143]/10" />

      <header className="absolute inset-x-[5.5%] top-[4.5%] z-20 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="rounded-lg bg-white px-3 py-2">
              <Image
                src="/resources/shomvob_hr_text.png"
                alt="Shomvob HR"
                width={120}
                height={28}
              />
            </div>

          </div>
          <Image
            src="/resources/300_ltd_logo.svg"
            alt="300 Ltd"
            width={115}
            height={42}
            className="h-10 w-auto"
          />
        </div>

        <div className="mt-[clamp(1rem,1.8vw,1.75rem)]">
          <h1 className="text-[clamp(2.2rem,3.6vw,4.1rem)] font-black leading-none tracking-[-0.04em]">
            Payroll Management
          </h1>
          <p className="mt-3 max-w-[650px] text-[clamp(0.72rem,0.92vw,1.02rem)] leading-relaxed text-white/70">
            Attendance and leave data flow straight into payroll &mdash;
            accurate, automatic, and audit-ready.
          </p>
        </div>
      </header>

      <main className="absolute bottom-[5.5%] left-[5.5%] right-[5.5%] top-[28%] z-20 grid grid-cols-[minmax(0,1.75fr)_minmax(0,0.9fr)] gap-[clamp(1rem,1.6vw,1.75rem)]">
        <div className="grid min-h-0 grid-cols-2 grid-rows-4 gap-[clamp(0.55rem,0.8vw,0.85rem)]">
          {features.map((feature) => (
            <article
              key={feature.number}
              className={`relative flex min-h-0 items-center gap-[clamp(0.65rem,0.9vw,0.95rem)] overflow-hidden rounded-xl border p-[clamp(0.65rem,0.9vw,0.95rem)] shadow-sm ${
                feature.highlight
                  ? "border-[#edb713] bg-[#fff9df]"
                  : "border-[#0c3d20]/10 bg-white"
              }`}
            >
              <span className="absolute right-3 top-1.5 text-[clamp(1.35rem,1.8vw,2rem)] font-black text-[#0c3d20]/[0.06]">
                {feature.number}
              </span>
              <div
                className={`flex h-[clamp(2.35rem,2.8vw,3rem)] w-[clamp(2.35rem,2.8vw,3rem)] shrink-0 items-center justify-center rounded-lg ${
                  feature.highlight
                    ? "bg-[#edb713] text-[#0c3d20]"
                    : "bg-[#0c3d20] text-[#edb713]"
                }`}
              >
                <FeatureIcon type={feature.icon} />
              </div>
              <div className="relative min-w-0">
                <h2 className="pr-5 text-[clamp(0.75rem,0.92vw,1.02rem)] font-bold leading-tight">
                  {feature.title}
                </h2>
                <p className="mt-1 text-[clamp(0.52rem,0.61vw,0.68rem)] leading-snug text-[#496454]">
                  {feature.copy}
                </p>
              </div>
            </article>
          ))}
        </div>

        <aside className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white p-[clamp(1rem,1.35vw,1.4rem)] shadow-[0_18px_50px_rgba(9,45,25,0.18)]">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#edb713]" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-[#0c3d20] px-3 py-1.5 text-[clamp(0.46rem,0.55vw,0.62rem)] font-bold uppercase tracking-[0.16em] text-[#edb713]">
                Payroll, connected
              </span>
              <p className="mt-3 text-[clamp(0.62rem,0.76vw,0.84rem)] leading-relaxed text-[#496454]">
              No more manual handoffs between attendance sheets and salary
              runs &mdash; one pipeline, start to finish.
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edb713] text-[#0c3d20]">
              <FeatureIcon type="generate" />
            </div>
          </div>

          <div className="mt-[clamp(0.75rem,1vw,1rem)] grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-[#f3f0e5] px-3 py-2">
              <span className="block text-[clamp(0.42rem,0.5vw,0.56rem)] font-bold uppercase tracking-[0.12em] text-[#718076]">
                Pay cycle
              </span>
              <strong className="mt-0.5 block text-[clamp(0.6rem,0.72vw,0.8rem)]">
                Monthly
              </strong>
            </div>
            <div className="rounded-lg bg-[#f3f0e5] px-3 py-2">
              <span className="block text-[clamp(0.42rem,0.5vw,0.56rem)] font-bold uppercase tracking-[0.12em] text-[#718076]">
                Pay basis
              </span>
              <strong className="mt-0.5 block text-[clamp(0.6rem,0.72vw,0.8rem)]">
                Pay-grade based
              </strong>
            </div>
          </div>

          {/* mini payslip mockup */}
          <div className="relative mt-[clamp(0.75rem,1vw,1rem)] flex min-h-0 flex-1 flex-col rounded-xl border border-[#0c3d20]/10 bg-[#fbfaf6] p-[clamp(0.85rem,1.1vw,1.15rem)]">
            <div className="flex items-center justify-between border-b border-dashed border-[#0c3d20]/20 pb-3">
              <span className="text-[clamp(0.6rem,0.72vw,0.8rem)] font-bold uppercase tracking-[0.1em]">
                Payslip Preview
              </span>
              <span className="rounded-full bg-[#28a143]/15 px-2.5 py-0.5 text-[clamp(0.46rem,0.55vw,0.6rem)] font-bold uppercase tracking-[0.1em] text-[#1c7a3a]">
                Auto-generated
              </span>
            </div>
            <dl className="mt-3 flex flex-1 flex-col justify-between text-[clamp(0.56rem,0.68vw,0.76rem)]">
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
              <div className="flex items-center justify-between">
                <dt className="text-[#5c6f63]">Absent Deduction</dt>
                <dd className="font-semibold text-[#b3401a]">&minus; ৳ 700</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[#5c6f63]">Overtime Bonus</dt>
                <dd className="font-semibold text-[#1c7a3a]">+ ৳ 1,200</dd>
              </div>
            </dl>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0c3d20] px-4 py-3 text-white">
            <span className="text-[clamp(0.56rem,0.68vw,0.76rem)] font-bold uppercase tracking-[0.12em] text-white/65">
              Net Payable
            </span>
            <strong className="text-[clamp(1rem,1.3vw,1.45rem)] text-[#edb713]">
              ৳ 21,700
            </strong>
          </div>
        </aside>
      </main>
    </section>
  );
}
