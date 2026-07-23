"use client";

import Image from "next/image";
import ClientLogo from "./ClientLogo";
import { useModuleSlideContent } from "./usePresentationContent";

const lifecycle = ["Onboarding", "Probation", "Confirmed", "Growth"];

const features = [
  {
    number: "01",
    title: "Automated Probation Tracking & Alerts",
    copy: "Every probation timeline is tracked automatically, with upcoming confirmation alerts so no employee falls through the cracks.",
    icon: "hourglass",
  },
  {
    number: "02",
    title: "One-Click Confirmation",
    copy: "Promote an employee from probation to permanent in a single click, backed by performance-based confirmation.",
    icon: "promote",
  },
  {
    number: "03",
    title: "Department-Scoped Management Access",
    copy: "HR and line/branch managers only see and manage employees within their own department or branch.",
    icon: "scope",
    highlight: true,
  },
  {
    number: "04",
    title: "Employment Increment Journey",
    copy: "Raise, review, and approve salary or role increments through one structured, logged workflow.",
    icon: "increment",
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
      {type === "hourglass" && (
        <>
          <path d="M6 3.5h12M6 20.5h12" />
          <path d="M7.5 3.5v3.2c0 2 1.4 3.3 4.5 5.3 3.1-2 4.5-3.3 4.5-5.3V3.5M7.5 20.5v-3.2c0-2 1.4-3.3 4.5-5.3 3.1 2 4.5 3.3 4.5 5.3v3.2" />
        </>
      )}
      {type === "promote" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8 12.3 2.6 2.6 5.7-6" />
        </>
      )}
      {type === "scope" && (
        <>
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" />
          <circle cx="12" cy="14.5" r="1.4" />
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

export default function EmployeeManagementSlide() {
  const moduleContent = useModuleSlideContent("employee-management");
  const renderedFeatures = features.map((feature, index) => ({
    ...feature,
    title: moduleContent?.points[index]?.title ?? feature.title,
    copy: moduleContent?.points[index]?.description ?? feature.copy,
  }));

  return (
    <section
      data-module="employee-management"
      className="relative h-screen w-full overflow-hidden bg-[#f3f0e5] text-[#092d19]"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[#28a143]/8"
        style={{ clipPath: "polygon(0 0, 26% 0, 8% 100%, 0 100%)" }}
      />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-[360px] w-[360px] rounded-full border-[70px] border-[#edb713]/10" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[3%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-[#0c3d20]/[0.035]"
      >
        12
      </span>

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5.5%]">
        <div className="max-w-[68%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#28a143]">
            Module &middot; Workforce Lifecycle
          </span>
          <h1 className="mt-2 text-[clamp(2.15rem,3.8vw,4.3rem)] font-bold leading-none tracking-tight">
            Employee Management
          </h1>
          <p className="mt-3 max-w-[660px] text-[clamp(0.78rem,1.05vw,1.15rem)] leading-relaxed text-[#496454]">
            One connected view of every employee&apos;s status, access, and
            growth &mdash; scoped to the right people.
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
            <ClientLogo size="sm" />
          </div>
        </div>
      </header>

      {/* lifecycle progress strip */}
      <div className="relative z-10 mx-[5.5%] mt-[clamp(1.5rem,2.6vw,2.5rem)] flex items-center">
        {lifecycle.map((stage, index) => (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ${
                  index <= 1
                    ? "bg-[#0c3d20] text-[#edb713]"
                    : "bg-white text-[#0c3d20]/40 ring-1 ring-[#0c3d20]/15"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`text-[clamp(0.55rem,0.66vw,0.75rem)] font-bold uppercase tracking-[0.12em] ${
                  index <= 1 ? "text-[#0c3d20]" : "text-[#0c3d20]/40"
                }`}
              >
                {stage}
              </span>
            </div>
            {index < lifecycle.length - 1 && (
              <div
                className={`mx-3 h-px flex-1 ${
                  index === 0 ? "bg-[#0c3d20]/25" : "bg-[#0c3d20]/12"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-[clamp(1.5rem,2.6vw,2.5rem)] grid grid-cols-2 grid-rows-2 gap-[clamp(0.75rem,1.2vw,1.35rem)] px-[5.5%] pb-[6%]">
        {renderedFeatures.map((feature) => (
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
              <h2 className="max-w-[92%] text-[clamp(0.85rem,1.12vw,1.28rem)] font-bold leading-tight">
                {feature.title}
              </h2>
              <p className="mt-2 max-w-[92%] text-[clamp(0.56rem,0.68vw,0.76rem)] leading-relaxed text-[#496454]">
                {feature.copy}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
