import Image from "next/image";
import ClientLogo from "./ClientLogo";

const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const features = [
  {
    number: "01",
    title: "Flexible Shift Creation",
    copy: "Define shift timings and combine them into reusable weekly or rotating patterns.",
    icon: "shift",
  },
  {
    number: "02",
    title: "Branch & Department Customization",
    copy: "Configure different schedules for departments, branches, or employee groups.",
    icon: "branch",
  },
  {
    number: "03",
    title: "Bulk & Individual Assignment",
    copy: "Assign one employee or hundreds to a schedule in a few clicks.",
    icon: "bulk",
  },
  {
    number: "04",
    title: "Drag-and-Drop Rescheduling",
    copy: "See the full week at a glance and reassign anyone, anytime.",
    icon: "drag",
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
      {type === "shift" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l2.6 1.6" />
          <path d="M16.5 3.8 18 5.3M6 5.3 7.5 3.8" />
        </>
      )}
      {type === "branch" && (
        <>
          <circle cx="6" cy="5" r="2" />
          <circle cx="6" cy="19" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M6 7v10M6 12h10" />
        </>
      )}
      {type === "bulk" && (
        <>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M3.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2M15 14.5c2.8-.4 4.6.9 5.3 3.5" />
        </>
      )}
      {type === "drag" && (
        <>
          <rect x="3.5" y="4" width="7.5" height="7.5" rx="1.3" />
          <rect x="13" y="4" width="7.5" height="7.5" rx="1.3" />
          <rect x="3.5" y="13.5" width="7.5" height="7.5" rx="1.3" />
          <path d="M15.5 16.5h5m-2.4-2.4 2.4 2.4-2.4 2.4" />
        </>
      )}
    </svg>
  );
}

export default function ScheduleRosterSlide() {
  return (
    <section
      data-module="schedule"
      className="relative h-screen w-full overflow-hidden bg-[#0c3d20] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "calc(100% / 7) 100%",
        }}
      />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-[380px] w-[380px] rounded-full bg-[#edb713] opacity-[0.14] blur-[110px]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[3%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-white/[0.045]"
      >
        11
      </span>

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5.5%]">
        <div className="max-w-[68%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#edb713]">
            Module 06 &middot; Scheduling
          </span>
          <h1 className="mt-2 text-[clamp(2.15rem,3.8vw,4.3rem)] font-bold leading-none tracking-tight">
            Schedule &amp; Roster
          </h1>
          <p className="mt-3 max-w-[620px] text-[clamp(0.78rem,1.05vw,1.15rem)] leading-relaxed text-white/65">
            Build shift patterns once and roll them out across branches in
            a few clicks.
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
          <ClientLogo size="sm" />
        </div>
      </header>

      {/* decorative week ribbon */}
      <div className="relative z-10 mx-[5.5%] mt-[clamp(1.5rem,2.6vw,2.5rem)] grid grid-cols-7 overflow-hidden rounded-xl border border-white/10">
        {days.map((day, index) => (
          <div
            key={day}
            className={`flex items-center justify-center gap-2 border-r border-white/10 py-2.5 text-[clamp(0.5rem,0.6vw,0.68rem)] font-bold uppercase tracking-[0.15em] last:border-r-0 ${
              index === 3
                ? "bg-[#edb713] text-[#0c3d20]"
                : "bg-white/[0.05] text-white/50"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-[clamp(1.5rem,2.6vw,2.5rem)] grid grid-cols-4 gap-[clamp(0.75rem,1.2vw,1.35rem)] px-[5.5%] pb-[6%]">
        {features.map((feature) => (
          <article
            key={feature.number}
            className="relative flex flex-col overflow-hidden rounded-2xl bg-white/95 p-[clamp(1rem,1.5vw,1.5rem)] text-[#092d19] shadow-xl shadow-black/15"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c3d20] text-[#edb713]">
              <FeatureIcon type={feature.icon} />
            </div>
            <div className="mb-1.5 text-[clamp(0.46rem,0.55vw,0.6rem)] font-bold uppercase tracking-[0.16em] text-[#28a143]">
              Feature {feature.number}
            </div>
            <h2 className="text-[clamp(0.78rem,1vw,1.1rem)] font-bold leading-tight">
              {feature.title}
            </h2>
            <p className="mt-2 text-[clamp(0.55rem,0.66vw,0.74rem)] leading-relaxed text-[#4c5f53]">
              {feature.copy}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
