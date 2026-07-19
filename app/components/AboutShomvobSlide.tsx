import Image from "next/image";

const strengths = [
  {
    label: "Workforce consulting experience",
    copy: "Four-plus years helping companies solve hiring and manpower challenges across industries.",
    icon: "briefcase",
  },
  {
    label: "Large-scale workforce operations",
    copy: "Supporting organizations with staffing, bulk hiring, payroll, and resource augmentation.",
    icon: "people",
  },
  {
    label: "Built from operational insight",
    copy: "Experience from working with 1,500+ companies shaped the Shomvob workforce platform.",
    icon: "insight",
  },
];

const stats = [
  { value: "4+", label: "Years", detail: "Workforce experience" },
  { value: "1,500+", label: "Clients", detail: "Across industries" },
  { value: "30,000+", label: "Placed", detail: "Job seekers connected" },
  { value: "98%+", label: "Availability", detail: "Reliable operations" },
  { value: "100%", label: "Payroll", detail: "Consistent execution" },
];

const clients = [
  "foodpanda",
  "pandamart",
  "SINGER",
  "Aarong",
  "Domino’s",
  "ArtNature",
  "ShopUp",
];

function StrengthIcon({ type }: { type: string }) {
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
      {type === "briefcase" && (
        <>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M8 7V5h8v2M3 12h18M10 12v2h4v-2" />
        </>
      )}
      {type === "people" && (
        <>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2" />
          <path d="M3.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2M15 15c2.8-.4 4.6.9 5.3 3.5" />
        </>
      )}
      {type === "insight" && (
        <>
          <path d="M8.4 15.5A6 6 0 1 1 15.6 15.5c-.9.6-1.3 1.2-1.4 2H9.8c-.1-.8-.5-1.4-1.4-2Z" />
          <path d="M9.5 21h5M12 3V1M4.2 6.2 2.8 4.8M19.8 6.2l1.4-1.4" />
        </>
      )}
    </svg>
  );
}

export default function AboutShomvobSlide() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#03120b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(40,161,67,0.18),transparent_42%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div className="pointer-events-none absolute left-0 top-0 h-2 w-[38%] bg-[#edb713]" />

      <header className="absolute inset-x-[5.5%] top-[5%] z-20 flex items-center justify-between">
        <Image
          src="/resources/shomvob_hr_text.png"
          alt="Shomvob HR"
          width={130}
          height={31}
        />
        <Image
          src="/resources/300_ltd_logo.svg"
          alt="300 Ltd"
          width={110}
          height={40}
          className="h-10 w-auto"
        />
      </header>

      <div className="absolute inset-x-[5.5%] top-[14%] z-10 text-center">
        <span className="text-[clamp(0.55rem,0.68vw,0.75rem)] font-bold uppercase tracking-[0.25em] text-[#edb713]">
          Why Shomvob
        </span>
        <h1 className="mt-2 text-[clamp(2.2rem,3.8vw,4.25rem)] font-bold leading-none tracking-tight">
          Built from real workforce operations.
        </h1>
        <p className="mt-3 text-[clamp(0.75rem,1vw,1.1rem)] text-[#77c98a]">
          Not just software—practical experience translated into a stronger HR
          system.
        </p>
      </div>

      <div className="absolute inset-x-[5.5%] top-[31%] z-10 grid grid-cols-3 gap-4">
        {strengths.map((strength) => (
          <article
            key={strength.label}
            className="rounded-2xl border border-white/10 bg-white/[0.055] p-[clamp(0.9rem,1.35vw,1.5rem)] shadow-xl shadow-black/15 backdrop-blur-sm"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#28a143]/30 bg-[#28a143]/15 text-[#45d66b]">
              <StrengthIcon type={strength.icon} />
            </div>
            <h2 className="text-[clamp(0.82rem,1.05vw,1.2rem)] font-bold">
              {strength.label}
            </h2>
            <p className="mt-2 text-[clamp(0.58rem,0.72vw,0.8rem)] leading-relaxed text-white/52">
              {strength.copy}
            </p>
          </article>
        ))}
      </div>

      <div className="absolute inset-x-[5.5%] top-[55%] z-10 grid grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#28a143]/20 bg-[#071f13] px-3 py-[clamp(0.7rem,1vw,1.1rem)] text-center"
          >
            <div className="text-[clamp(1.35rem,2vw,2.3rem)] font-black tracking-tight text-[#45d66b]">
              {stat.value}
            </div>
            <div className="text-[clamp(0.65rem,0.82vw,0.9rem)] font-bold">
              {stat.label}
            </div>
            <div className="mt-1 text-[clamp(0.48rem,0.58vw,0.65rem)] text-white/38">
              {stat.detail}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-x-[5.5%] bottom-[8%] z-10">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[clamp(0.5rem,0.62vw,0.7rem)] font-semibold uppercase tracking-[0.22em] text-white/35">
            Trusted by leading teams across Bangladesh
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.96]">
          {clients.map((client) => (
            <div
              key={client}
              className="flex h-[clamp(3.5rem,5vw,5.4rem)] items-center justify-center border-r border-[#0c3d20]/10 px-3 text-center text-[clamp(0.65rem,0.9vw,1rem)] font-black tracking-tight text-[#16472a] last:border-r-0"
            >
              {client}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
