import Image from "next/image";

const features = [
  {
    number: "01",
    title: "Centralized Leave Management",
    copy: "Manage all leave policies, requests, and approvals from one place.",
    icon: "hub",
  },
  {
    number: "02",
    title: "Automated Leave Tracking",
    copy: "Automatically monitor balances, accruals, and leave usage.",
    icon: "track",
  },
  {
    number: "03",
    title: "Bulk Approve Leaves",
    copy: "Review and approve multiple leave requests at once.",
    icon: "check",
    highlight: true,
  },
  {
    number: "04",
    title: "Integrated Holiday Calendar",
    copy: "Built-in public holidays for accurate leave planning.",
    icon: "calendar",
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
      {type === "hub" && (
        <>
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="17" r="2" />
          <circle cx="19" cy="17" r="2" />
          <path d="M12 7v4m0 0-6 4m6-4 6 4" />
        </>
      )}
      {type === "track" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v4.5l3 2" />
          <path d="M8.5 3.8 12 2l3.5 1.8" />
        </>
      )}
      {type === "check" && (
        <>
          <rect x="3.5" y="5" width="8" height="8" rx="1.6" />
          <path d="m5.3 9 1.7 1.7 3-3.4" />
          <rect x="12.5" y="10.5" width="8" height="8" rx="1.6" />
          <path d="m14.3 14.5 1.7 1.7 3-3.4" />
        </>
      )}
      {type === "calendar" && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M8 3v4m8-4v4M3.5 9.5h17" />
          <path d="M7.5 13.5h2m3 0h2m3 0h1m-11 4h2m3 0h2" />
        </>
      )}
    </svg>
  );
}

export default function LeaveManagementSlide() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#f3f0e5] text-[#092d19]">
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-[360px] w-[360px] rounded-full border-[70px] border-[#28a143]/10" />
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-[20%] bg-[#edb713]/10"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 55% 100%, 100% 0)" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[3%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-[#0c3d20]/[0.035]"
      >
        08
      </span>

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[6%]">
        <div className="max-w-[62%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#28a143]">
            Leave management &middot; Part 1 of 2
          </span>
          <h1 className="mt-2 text-[clamp(2.25rem,4vw,4.5rem)] font-bold leading-none tracking-tight">
            Leave Management
          </h1>
          <p className="mt-3 max-w-[640px] text-[clamp(0.78rem,1.08vw,1.18rem)] leading-relaxed text-[#496454]">
            Flexible leave policies with automated tracking and centralized
            administration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <Image
              src="/resources/shomvob_hr_text.png"
              alt="Shomvob HR"
              width={120}
              height={28}
            />
          </div>
          <div className="rounded-xl bg-[#0c3d20] px-4 py-2 shadow-sm">
            <Image
              src="/resources/300_ltd_logo.svg"
              alt="300 Ltd"
              width={92}
              height={33}
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 mt-[clamp(2rem,3.5vw,3.5rem)] grid grid-cols-4 gap-[clamp(0.75rem,1.2vw,1.4rem)] px-[5.5%]">
        {features.map((feature) => (
          <article
            key={feature.number}
            className={`relative flex flex-col overflow-hidden rounded-2xl border p-[clamp(1rem,1.5vw,1.6rem)] shadow-sm ${
              feature.highlight
                ? "border-[#edb713] bg-white"
                : "border-[#0c3d20]/10 bg-white"
            }`}
          >
            <span
              className={`absolute inset-x-0 top-0 h-1.5 ${
                feature.highlight ? "bg-[#edb713]" : "bg-[#28a143]"
              }`}
            />
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c3d20] text-[#edb713]">
                <FeatureIcon type={feature.icon} />
              </div>
              <span className="text-[clamp(1.4rem,2vw,2.2rem)] font-black text-[#0c3d20]/[0.08]">
                {feature.number}
              </span>
            </div>
            {feature.highlight && (
              <span className="mb-2 inline-flex w-fit rounded-full bg-[#edb713]/15 px-2.5 py-0.5 text-[clamp(0.46rem,0.55vw,0.6rem)] font-bold uppercase tracking-[0.14em] text-[#a3780a]">
                Requirement covered
              </span>
            )}
            <h2 className="text-[clamp(0.82rem,1.05vw,1.2rem)] font-bold leading-tight">
              {feature.title}
            </h2>
            <p className="mt-2 text-[clamp(0.56rem,0.68vw,0.78rem)] leading-relaxed text-[#496454]">
              {feature.copy}
            </p>
          </article>
        ))}
      </div>

      <div className="relative z-10 mt-[clamp(1.5rem,2.6vw,2.5rem)] flex items-center gap-3 px-[5.5%]">
        <div className="h-px flex-1 bg-[#0c3d20]/10" />
        <span className="text-[clamp(0.5rem,0.62vw,0.7rem)] font-semibold uppercase tracking-[0.18em] text-[#7c8f83]">
          Solves &middot; HR selects multiple leave requests while reviewing
        </span>
        <div className="h-px flex-1 bg-[#0c3d20]/10" />
      </div>
    </section>
  );
}
