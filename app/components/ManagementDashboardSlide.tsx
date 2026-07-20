import Image from "next/image";

const stats = [
  { value: "600+", label: "Employees", icon: "people" },
  { value: "94%", label: "Live Attendance", icon: "pulse" },
  { value: "12", label: "Open Requisitions", icon: "requisition" },
  { value: "5", label: "Pending Increments", icon: "increment" },
];

const features = [
  {
    number: "01",
    title: "Customizable Widgets",
    copy: "HR and management choose exactly which metrics to track \u2014 attendance, leave, probation, increments, requests, and more.",
    icon: "widgets",
    highlight: true,
  },
  {
    number: "02",
    title: "Real-Time Attendance & Leave Overview",
    copy: "A live view of who's in, who's on leave, and workforce trends across every branch.",
    icon: "overview",
  },
  {
    number: "03",
    title: "Requisition & Increment Tracking at a Glance",
    copy: "See open hiring requests and pending increment approvals without digging through separate reports.",
    icon: "tracking",
    highlight: true,
  },
  {
    number: "04",
    title: "Centralized Workforce Insights",
    copy: "Monitor key HR metrics from a single, unified dashboard.",
    icon: "scale",
  },
];

function StatIcon({ type }: { type: string }) {
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
      {type === "people" && (
        <>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M3.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2M15 14.5c2.8-.4 4.6.9 5.3 3.5" />
        </>
      )}
      {type === "pulse" && <path d="M3 12h4l2-6 4 12 2-6h6" />}
      {type === "requisition" && (
        <>
          <rect x="5" y="4.5" width="11" height="15" rx="2" />
          <path d="M8 9h5m-5 3.5h5m-5 3.5h3" />
        </>
      )}
      {type === "increment" && (
        <>
          <path d="M4 19V13m5 6V9m5 10v-6m5 6V6" />
          <path d="m3 8 6-5 5 6 7-6" />
        </>
      )}
    </svg>
  );
}

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
      {type === "widgets" && (
        <>
          <rect x="4" y="4" width="7" height="7" rx="1.2" />
          <rect x="13" y="4" width="7" height="16" rx="1.2" />
          <rect x="4" y="13" width="7" height="7" rx="1.2" />
        </>
      )}
      {type === "overview" && (
        <>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path d="M3.5 9.5h17M8 13.5l2 2 4-4" />
        </>
      )}
      {type === "tracking" && (
        <>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m15.8 15.8 4 4" />
          <path d="M11 8v3l2.2 1.3" />
        </>
      )}
      {type === "scale" && (
        <>
          <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
          <path d="M4 7.5 12 12l8-4.5M12 12v9" />
        </>
      )}
    </svg>
  );
}

export default function ManagementDashboardSlide() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#f3f0e5] text-[#092d19]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full border-[70px] border-[#28a143]/10" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[3%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-[#0c3d20]/[0.035]"
      >
        14
      </span>

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
        <div className="max-w-[68%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#28a143]">
            Module 09 &middot; Visibility
          </span>
          <h1 className="mt-2 text-[clamp(2.1rem,3.7vw,4.2rem)] font-bold leading-none tracking-tight">
            Management Dashboard
          </h1>
          <p className="mt-3 max-w-[660px] text-[clamp(0.78rem,1.05vw,1.15rem)] leading-relaxed text-[#496454]">
            Stay on top of workforce health and every key HR workflow, in
            one customizable view.
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

      {/* mock dashboard KPI strip */}
      <div className="relative z-10 mx-[5.5%] mt-[clamp(1.5rem,2.6vw,2.5rem)] grid grid-cols-4 gap-[clamp(0.65rem,1vw,1.1rem)] rounded-2xl bg-[#0c3d20] p-[clamp(0.85rem,1.3vw,1.3rem)] shadow-xl shadow-black/10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-[clamp(0.7rem,1vw,1rem)] py-[clamp(0.6rem,0.9vw,0.9rem)]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edb713] text-[#0c3d20]">
              <StatIcon type={stat.icon} />
            </div>
            <div>
              <div className="text-[clamp(1rem,1.4vw,1.5rem)] font-black leading-none text-white">
                {stat.value}
              </div>
              <div className="mt-0.5 text-[clamp(0.48rem,0.56vw,0.62rem)] font-semibold uppercase tracking-[0.1em] text-white/50">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-[clamp(1.5rem,2.6vw,2.5rem)] grid grid-cols-2 grid-rows-2 gap-[clamp(0.75rem,1.2vw,1.35rem)] px-[5.5%] pb-[6%]">
        {features.map((feature) => (
          <article
            key={feature.number}
            className={`relative flex items-center gap-[clamp(0.9rem,1.4vw,1.5rem)] overflow-hidden rounded-2xl border p-[clamp(1rem,1.5vw,1.6rem)] shadow-sm ${
              feature.highlight
                ? "border-[#edb713] bg-white"
                : "border-[#0c3d20]/10 bg-white"
            }`}
          >
            <span className="absolute right-4 top-2 text-[clamp(2.2rem,3.6vw,4.2rem)] font-black leading-none text-[#0c3d20]/[0.055]">
              {feature.number}
            </span>
            <div
              className={`flex h-[clamp(3.2rem,4.5vw,5rem)] w-[clamp(3.2rem,4.5vw,5rem)] shrink-0 items-center justify-center rounded-2xl ${
                feature.highlight
                  ? "bg-[#edb713] text-[#0c3d20]"
                  : "bg-[#0c3d20] text-[#edb713]"
              }`}
            >
              <FeatureIcon type={feature.icon} />
            </div>
            <div className="relative">
              {feature.highlight}
              <h2 className="max-w-[92%] text-[clamp(0.82rem,1.08vw,1.22rem)] font-bold leading-tight">
                {feature.title}
              </h2>
              <p className="mt-2 max-w-[92%] text-[clamp(0.55rem,0.66vw,0.74rem)] leading-relaxed text-[#496454]">
                {feature.copy}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
