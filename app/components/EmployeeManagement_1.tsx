import Image from "next/image";

const capabilities = [
  {
    number: "01",
    title: "Automated probation tracking",
    detail:
      "Every probation timeline is monitored automatically, with alerts before confirmation dates so no employee is overlooked.",
    icon: "hourglass",
  },
  {
    number: "02",
    title: "One-click confirmation",
    detail:
      "Move employees from probation to permanent status in a single action, backed by a clear performance record.",
    icon: "promote",
  },
  {
    number: "03",
    title: "Department-scoped access",
    detail:
      "HR and line managers only see and manage employees within their own department or branch — role-based by design.",
    icon: "scope",
    highlight: true as const,
  },
  {
    number: "04",
    title: "Employment increment workflow",
    detail:
      "Raise, review, and approve salary or role increments through one structured, fully logged process.",
    icon: "increment",
    highlight: true as const,
  },
];

function CapabilityIcon({ type }: { type: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
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

export default function EmployeeManagement_1() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#eef3ee] text-[#0a321d]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[32%] bg-[#0c3d20]" />
      <div
        className="pointer-events-none absolute inset-y-0 left-[22%] w-[14%] bg-[#28a143]"
        style={{ clipPath: "polygon(0 0, 100% 0, 30% 100%, 0 100%)" }}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full border-[72px] border-[#edb713]/12" />

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%] pl-[34%]">
        <div className="max-w-[72%]">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#0c3d20] px-3 py-1 text-[clamp(0.5rem,0.62vw,0.7rem)] font-black uppercase tracking-[0.2em] text-[#edb713]">
              What it does
            </span>
            <span className="text-[clamp(0.5rem,0.62vw,0.7rem)] font-bold uppercase tracking-[0.18em] text-[#28a143]">
              Part 01 · For the company
            </span>
          </div>
          <h1 className="mt-4 text-[clamp(2.2rem,4.15vw,4.6rem)] font-bold leading-[0.95] tracking-tight">
            Employee Management
          </h1>
          <p className="mt-4 max-w-[720px] text-[clamp(0.72rem,0.95vw,1.05rem)] leading-relaxed text-[#496454]">
            One connected view of every employee&apos;s status, access, and
            growth — scoped to the right people across the organisation.
          </p>
        </div>

        <Image
          src="/resources/300_ltd_logo.svg"
          alt="300 Ltd"
          width={108}
          height={40}
          className="h-10 w-auto"
        />
      </header>

      <div className="absolute inset-x-[5.5%] bottom-[6%] top-[37%] z-10 grid grid-cols-2 gap-[clamp(0.65rem,1.05vw,1.1rem)] pl-[29%]">
        {capabilities.map((capability) => {
          const isGold = capability.highlight;

          return (
            <article
              key={capability.number}
              className={`relative flex items-center gap-[clamp(0.85rem,1.3vw,1.4rem)] overflow-hidden rounded-[1.25rem] border p-[clamp(0.85rem,1.25vw,1.35rem)] shadow-sm ${
                capability.highlight
                  ? "border-[#edb713] bg-white"
                  : "border-[#0c3d20]/10 bg-white"
              }`}
            >
              <span className="absolute right-3 top-1.5 text-[clamp(2.4rem,3.5vw,3.8rem)] font-black leading-none text-[#0c3d20]/[0.05]">
                {capability.number}
              </span>
              <div
                className={`flex h-[clamp(3.4rem,4.8vw,5.4rem)] w-[clamp(3.4rem,4.8vw,5.4rem)] shrink-0 items-center justify-center rounded-2xl ${
                  isGold
                    ? "bg-[#edb713] text-[#0c3d20]"
                    : "bg-[#0c3d20] text-[#edb713]"
                }`}
              >
                <CapabilityIcon type={capability.icon} />
              </div>
              <div className="relative min-w-0 flex-1">
                <h2 className="text-[clamp(0.95rem,1.28vw,1.45rem)] font-bold leading-snug">
                  {capability.title}
                </h2>
                <p className="mt-1.5 text-[clamp(0.68rem,0.88vw,1rem)] leading-snug text-[#496454]">
                  {capability.detail}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="absolute bottom-[6%] left-[4.8%] top-[31%] z-20 flex w-[24%] flex-col justify-between rounded-[1.8rem] border border-white/10 bg-[#072713] p-[clamp(1rem,1.7vw,1.8rem)] text-white shadow-2xl shadow-black/25">
        <div>
          <span className="text-[clamp(0.48rem,0.6vw,0.68rem)] font-bold uppercase tracking-[0.22em] text-[#edb713]">
            Workforce lifecycle
          </span>
          <p className="mt-3 text-[clamp(1.05rem,1.55vw,1.75rem)] font-bold leading-tight">
            From first record to long-term growth.
          </p>
        </div>

        <div className="space-y-3">
          {["Probation tracking", "Confirmation", "Access control", "Increments"].map(
            (item, index) => (
              <div key={item} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#28a143] text-[0.6rem] font-black text-white">
                  {index + 1}
                </span>
                <span className="text-[clamp(0.58rem,0.73vw,0.82rem)] font-semibold text-white/75">
                  {item}
                </span>
              </div>
            ),
          )}
        </div>

        <div className="rounded-xl bg-[#edb713] px-4 py-3 text-[#0c3d20]">
          <div className="text-[clamp(0.48rem,0.58vw,0.66rem)] font-black uppercase tracking-[0.18em]">
            Outcome
          </div>
          <div className="mt-1 text-[clamp(0.72rem,0.9vw,1rem)] font-bold">
            Controlled, compliant workforce management
          </div>
        </div>
      </aside>
    </section>
  );
}
