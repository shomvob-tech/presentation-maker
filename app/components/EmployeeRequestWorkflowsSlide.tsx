import { formatDeckNumber, type DeckSlideProps } from "@/lib/deck-catalog";
import ShomvobMark from "./ShomvobMark";

const pipeline = ["Request", "Review", "Approval", "Record"];

const features = [
  {
    number: "01",
    title: "Employee Requisition in a Few Clicks",
    copy: "Line/branch managers raise a request for a new hire directly in the system, routed straight to HR for approval.",
    icon: "requisition",
    highlight: true,
  },
  {
    number: "02",
    title: "Resignation, Self-Service",
    copy: "Employees submit resignation requests directly from the mobile app \u2014 no paper forms required.",
    icon: "resignation",
    highlight: true,
  },
  {
    number: "03",
    title: "Built-In Approval Workflow",
    copy: "Every request moves through a clear, auditable chain of approvals.",
    icon: "workflow",
  },
  {
    number: "04",
    title: "Complete Request History",
    copy: "HR keeps a full, searchable record of every requisition and resignation, from request to final decision.",
    icon: "history",
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
      {type === "requisition" && (
        <>
          <rect x="4" y="4.5" width="12" height="15" rx="2" />
          <path d="M7.5 9h5m-5 3.5h5m-5 3.5h3" />
          <path d="M16.5 15.5 19 18l4-4.5" transform="translate(-1 0)" />
        </>
      )}
      {type === "resignation" && (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
          <path d="M10 5h4" />
          <path d="M9 12.5h4m0 0-1.6-1.6M13 12.5l-1.6 1.6" />
        </>
      )}
      {type === "workflow" && (
        <>
          <circle cx="5" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="6" r="2" />
          <circle cx="12" cy="19" r="2" />
          <path d="M6.5 7.3 10.5 11M17.5 7.3 13.5 11M12 14v3" />
        </>
      )}
      {type === "history" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 1.8" />
          <path d="M3.8 9.5 3 5.8l3.5 1" />
        </>
      )}
    </svg>
  );
}

export default function EmployeeRequestWorkflowsSlide({
  slideNumber = 13,
  moduleNumber = 8,
}: DeckSlideProps) {
  return (
    <section
      data-module="recruitment"
      className="relative h-screen w-full overflow-hidden bg-[#0c3d20] text-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 -top-24 h-[360px] w-[360px] rounded-full bg-[#edb713] opacity-[0.13] blur-[110px]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[3%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-white/[0.045]"
      >
        {formatDeckNumber(slideNumber)}
      </span>

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5.5%]">
        <div className="max-w-[68%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#edb713]">
            Module {formatDeckNumber(moduleNumber)}{" "}&middot; Requests
          </span>
          <h1 className="mt-2 text-[clamp(2.05rem,3.6vw,4.1rem)] font-bold leading-none tracking-tight">
            Employee Request Workflows
          </h1>
          <p className="mt-3 max-w-[680px] text-[clamp(0.78rem,1.05vw,1.15rem)] leading-relaxed text-white/65">
            Every requisition and resignation follows one clear, trackable
            path &mdash; from request to final decision.
          </p>
        </div>

        <ShomvobMark tone="dark" />
      </header>

      {/* decorative approval pipeline */}
      <div className="relative z-10 mx-[5.5%] mt-[clamp(1.75rem,3vw,3rem)] flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-[clamp(1.25rem,2vw,2rem)] py-[clamp(0.85rem,1.3vw,1.3rem)]">
        {pipeline.map((stage, index) => (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edb713] text-[0.65rem] font-bold text-[#0c3d20]">
                {index + 1}
              </span>
              <span className="text-[clamp(0.58rem,0.7vw,0.8rem)] font-bold uppercase tracking-[0.14em] text-white/80">
                {stage}
              </span>
            </div>
            {index < pipeline.length - 1 && (
              <div className="mx-3 flex flex-1 items-center gap-1">
                <div className="h-px flex-1 bg-white/15" />
                <span className="text-white/30">&rarr;</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-[clamp(1.5rem,2.6vw,2.5rem)] grid grid-cols-2 grid-rows-2 gap-[clamp(0.75rem,1.2vw,1.35rem)] px-[5.5%] pb-[6%]">
        {features.map((feature) => (
          <article
            key={feature.number}
            className="relative flex items-center gap-[clamp(0.9rem,1.4vw,1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#071d10]/90 p-[clamp(0.95rem,1.4vw,1.5rem)]"
          >
            <span className="absolute right-4 top-2 text-[clamp(2.2rem,3.6vw,4.2rem)] font-black leading-none text-white/[0.04]">
              {feature.number}
            </span>
            <div
              className={`flex h-[clamp(3.2rem,4.5vw,5rem)] w-[clamp(3.2rem,4.5vw,5rem)] shrink-0 items-center justify-center rounded-2xl ${
                feature.highlight
                  ? "bg-[#edb713] text-[#0c3d20]"
                  : "bg-[#28a143] text-white"
              }`}
            >
              <FeatureIcon type={feature.icon} />
            </div>
            <div className="relative">
              {feature.highlight}
              <h2 className="max-w-[92%] text-[clamp(0.85rem,1.12vw,1.28rem)] font-bold leading-tight text-white">
                {feature.title}
              </h2>
              <p className="mt-2 max-w-[92%] text-[clamp(0.56rem,0.68vw,0.76rem)] leading-relaxed text-white/50">
                {feature.copy}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
