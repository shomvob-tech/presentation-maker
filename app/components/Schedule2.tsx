import Image from "next/image";

const features = [
  {
    number: "01",
    title: "Flexible shift creation",
    copy: "Define timings and combine them into reusable weekly or rotating patterns.",
    icon: "shift",
  },
  {
    number: "02",
    title: "Branch & department schedules",
    copy: "Configure different rosters for departments, branches, or employee groups.",
    icon: "branch",
  },
  {
    number: "03",
    title: "Bulk & individual assignment",
    copy: "Assign one employee or hundreds to a schedule in a few clicks.",
    icon: "bulk",
  },
  {
    number: "04",
    title: "Drag-and-drop rescheduling",
    copy: "See the full week at a glance and reassign anyone, anytime.",
    icon: "drag",
  },
];

function FeatureIcon({ type }: { type: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
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

export default function Schedule2() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0c3d20] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[#062b16]"
        style={{ clipPath: "polygon(0 0, 34% 0, 18% 100%, 0 100%)" }}
      />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-[380px] w-[380px] rounded-full bg-[#edb713] opacity-[0.14] blur-[110px]" />

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
        <div className="max-w-[55%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#edb713]">
            Module · Scheduling
          </span>
          <h1 className="mt-2 text-[clamp(2.15rem,3.8vw,4.3rem)] font-bold leading-none tracking-tight">
            Schedule &amp; Roster
          </h1>
          <p className="mt-3 max-w-[560px] text-[clamp(0.78rem,1.05vw,1.15rem)] leading-relaxed text-white/65">
            Build shift patterns once and manage the full weekly roster across
            branches from one visual grid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={120}
            height={28}
          />
          <Image
            src="/resources/300_ltd_logo.svg"
            alt="300 Ltd"
            width={92}
            height={33}
            className="h-8 w-auto"
          />
        </div>
      </header>

      <div className="absolute inset-x-[5.5%] bottom-[5.5%] top-[28%] z-10 grid grid-cols-[minmax(0,31%)_minmax(0,1fr)] gap-[clamp(0.85rem,1.4vw,1.5rem)]">
        <div className="flex min-h-0 flex-col gap-[clamp(0.55rem,0.9vw,0.95rem)]">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="flex flex-1 items-center gap-[clamp(0.7rem,1.05vw,1.1rem)] rounded-[1.1rem] border border-white/10 bg-[#071d10]/90 px-[clamp(0.75rem,1.1vw,1.15rem)] py-[clamp(0.65rem,0.95vw,1rem)]"
            >
              <div className="flex h-[clamp(2.4rem,3.2vw,3.6rem)] w-[clamp(2.4rem,3.2vw,3.6rem)] shrink-0 items-center justify-center rounded-xl bg-[#edb713] text-[#0c3d20]">
                <FeatureIcon type={feature.icon} />
              </div>
              <div className="min-w-0">
                <div className="text-[clamp(0.44rem,0.52vw,0.58rem)] font-bold uppercase tracking-[0.16em] text-[#5ae47a]">
                  {feature.number}
                </div>
                <h2 className="text-[clamp(0.78rem,1.02vw,1.12rem)] font-bold leading-snug">
                  {feature.title}
                </h2>
                <p className="mt-1 text-[clamp(0.56rem,0.7vw,0.78rem)] leading-snug text-white/55">
                  {feature.copy}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="relative min-h-0 overflow-hidden rounded-[1.35rem] border border-white/15 bg-white shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2 border-b border-[#e8ece9] bg-[#f7faf8] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 text-[clamp(0.5rem,0.62vw,0.68rem)] font-semibold text-[#496454]">
              Employee schedule roster
            </span>
          </div>

          <div className="relative h-[calc(100%-2.5rem)] w-full bg-white">
            <Image
              src="/resources/schedule_roster.png"
              alt="Weekly employee schedule roster showing shift assignments across departments"
              fill
              className="object-cover object-left-top"
              sizes="(max-width: 1280px) 65vw, 900px"
              priority
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent" />
        </div>
      </div>
    </section>
  );
}
