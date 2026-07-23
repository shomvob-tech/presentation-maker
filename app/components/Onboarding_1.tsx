import ClientLogo from "./ClientLogo";

const capabilities = [
  {
    number: "01",
    title: "Create a ready-to-work profile",
    detail:
      "Turn an approved requisition into one complete employee record before the first day.",
    icon: "profile",
  },
  {
    number: "02",
    title: "Assign the right access",
    detail:
      "Set role, department, branch, and app permissions so every employee sees only what they need.",
    icon: "access",
  },
  {
    number: "03",
    title: "Bangla-first for blue-collar workforce",
    detail:
      "Mobile app opens in Bangla by default — built for factory and field teams who need simple self-service.",
    icon: "language",
    highlight: true as const,
  },
  {
    number: "04",
    title: "Start the employee lifecycle",
    detail:
      "Set probation dates and alerts from day one, keeping confirmation milestones visible to HR.",
    icon: "timeline",
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
      {type === "profile" && (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.8 19c.6-3.6 2.3-5.4 5.2-5.4s4.6 1.8 5.2 5.4" />
          <path d="M17 8h4m-2-2v4M16 15h5M16 18h3" />
        </>
      )}
      {type === "access" && (
        <>
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M7.5 9V7a4.5 4.5 0 0 1 9 0v2M12 13v3" />
          <circle cx="12" cy="13" r="1" />
        </>
      )}
      {type === "language" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3.5 9h17M3.5 15h17M12 3c2.1 2.5 3.1 5.5 3.1 9s-1 6.5-3.1 9c-2.1-2.5-3.1-5.5-3.1-9S9.9 5.5 12 3Z" />
        </>
      )}
      {type === "timeline" && (
        <>
          <path d="M4 7h16M7 3.5V7m10-3.5V7" />
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="m8 14 2.2 2.2L16.5 10" />
        </>
      )}
    </svg>
  );
}

export default function Onboarding_1() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#f4f1e7] text-[#0a321d]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[36%] bg-[#0c3d20]" />
      <div
        className="pointer-events-none absolute inset-y-0 right-[28%] w-[17%] bg-[#28a143]"
        style={{ clipPath: "polygon(70% 0, 100% 0, 30% 100%, 0 100%)" }}
      />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-[360px] w-[360px] rounded-full border-[70px] border-[#edb713]/15" />

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
        <div className="max-w-[62%]">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#edb713] px-3 py-1 text-[clamp(0.5rem,0.62vw,0.7rem)] font-black uppercase tracking-[0.2em]">
              Employee Onboarding
            </span>
            <span className="text-[clamp(0.5rem,0.62vw,0.7rem)] font-bold uppercase tracking-[0.18em] text-[#28a143]">
              Part 01 · Capability
            </span>
          </div>
          <h1 className="mt-4 text-[clamp(2.2rem,4.15vw,4.6rem)] font-bold leading-[0.95] tracking-tight">
            What you can do
            <span className="block text-[#28a143]">before day one.</span>
          </h1>
          <p className="mt-4 max-w-[690px] text-[clamp(0.72rem,0.95vw,1.05rem)] leading-relaxed text-[#496454]">
            Prepare people, permissions, and key milestones in one structured
            onboarding flow.
          </p>
        </div>

        <ClientLogo size="md" />
      </header>

      <div className="absolute inset-x-[5.5%] bottom-[6%] top-[37%] z-10 grid grid-cols-2 gap-[clamp(0.65rem,1.05vw,1.1rem)] pr-[29%]">
        {capabilities.map((capability, index) => {
          const isGold = index === 1 || index === 2;

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

      <aside className="absolute bottom-[6%] right-[4.8%] top-[31%] z-20 flex w-[24%] flex-col justify-between rounded-[1.8rem] border border-white/10 bg-[#072713] p-[clamp(1rem,1.7vw,1.8rem)] text-white shadow-2xl shadow-black/25">
        <div>
          <span className="text-[clamp(0.48rem,0.6vw,0.68rem)] font-bold uppercase tracking-[0.22em] text-[#edb713]">
            One connected setup
          </span>
          <p className="mt-3 text-[clamp(1.05rem,1.55vw,1.75rem)] font-bold leading-tight">
            From approved position to productive employee.
          </p>
        </div>

        <div className="space-y-3">
          {["Requisition", "Employee record", "Access & probation"].map(
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
            Ready before the first shift
          </div>
        </div>
      </aside>
    </section>
  );
}
