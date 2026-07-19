import Image from "next/image";

const challenges = [
  {
    number: "01",
    title: "No real-time attendance visibility",
    copy: "HR lacks one live view of attendance across the workforce.",
    icon: "visibility",
  },
  {
    number: "02",
    title: "Blue-collar workforce needs",
    copy: "The employee experience must be simple, mobile, and Bangla-first.",
    icon: "mobile",
  },
  {
    number: "03",
    title: "Leave across branches",
    copy: "Requests and approvals are difficult to manage consistently.",
    icon: "leave",
  },
  {
    number: "04",
    title: "Attendance and payroll are linked",
    copy: "Manual handoffs create delays and increase payroll risk.",
    icon: "payroll",
  },
  {
    number: "05",
    title: "Limited workforce insights",
    copy: "Important patterns stay hidden without connected HR data.",
    icon: "insight",
  },
  {
    number: "06",
    title: "Limited management visibility",
    copy: "Leaders need a clear, decision-ready view of workforce activity.",
    icon: "dashboard",
  },
];

function ChallengeIcon({ type }: { type: string }) {
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
      {type === "visibility" && (
        <>
          <path d="M2.5 12s3.4-5.2 9.5-5.2 9.5 5.2 9.5 5.2-3.4 5.2-9.5 5.2S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.7" />
          <path d="m18.2 5.8 2-2M5.8 5.8l-2-2" />
        </>
      )}
      {type === "mobile" && (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
          <path d="M10 5h4m-3 13.5h2" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
      {type === "leave" && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M8 3v4m8-4v4M3.5 9.5h17M8 14h3m2.5 0H17" />
        </>
      )}
      {type === "payroll" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9h10M7 13h4m-4 3h3m4-3 3 3 4-5" />
        </>
      )}
      {type === "insight" && (
        <>
          <path d="M4 20V10m5 10V5m5 15v-7m5 7V8" />
          <path d="m3 8 5-5 5 6 7-6" />
        </>
      )}
      {type === "dashboard" && (
        <>
          <rect x="3" y="3.5" width="18" height="17" rx="2" />
          <path d="M3 9h18M9 9v11m3-4 2-2 2 1 2-3" />
        </>
      )}
    </svg>
  );
}

export default function HrChallengesSlide() {
  return (
    <section className="relative grid h-screen w-full grid-cols-[35%_65%] overflow-hidden bg-[#f4f1e7] text-[#092d19]">
      <aside className="relative overflow-hidden bg-[#0c3d20] px-[15%] py-[12%] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.11]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #edb713 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-[360px] w-[360px] rounded-full border-[70px] border-[#28a143]/30" />
        <div
          className="pointer-events-none absolute inset-0 bg-[#28a143]/25"
          style={{ clipPath: "polygon(0 72%, 100% 52%, 100% 100%, 0 100%)" }}
        />

        <div className="relative z-10 flex h-full flex-col">
          <Image
            src="/resources/300_ltd_logo.svg"
            alt="300 Ltd"
            width={132}
            height={48}
            className="h-12 w-auto self-start"
          />

          <div className="my-auto">
            <span className="inline-flex rounded-full bg-[#edb713] px-4 py-1.5 text-[clamp(0.52rem,0.65vw,0.72rem)] font-bold uppercase tracking-[0.2em] text-[#0c3d20]">
              The case for change
            </span>
            <h1 className="mt-5 text-[clamp(2rem,3.45vw,3.9rem)] font-bold leading-[1.05] tracking-tight">
              HR challenges of a growing multi-brand organization
            </h1>
            <div className="mt-6 h-1.5 w-20 rounded-full bg-[#edb713]" />
            <p className="mt-5 max-w-sm text-[clamp(0.72rem,0.95vw,1.05rem)] leading-relaxed text-white/60">
              As 300 Ltd grows, disconnected processes make visibility,
              consistency, and timely decisions harder.
            </p>
          </div>

          <div className="text-[clamp(0.48rem,0.58vw,0.65rem)] font-semibold uppercase tracking-[0.2em] text-white/35">
            Six connected operational concerns
          </div>
        </div>
      </aside>

      <main className="relative p-[clamp(2rem,4vw,4.5rem)]">
        <header className="flex items-center justify-between">
          <div>
            <span className="text-[clamp(0.52rem,0.65vw,0.72rem)] font-bold uppercase tracking-[0.22em] text-[#28a143]">
              What HR sees today
            </span>
            <h2 className="mt-2 text-[clamp(1.5rem,2.2vw,2.5rem)] font-bold tracking-tight">
              Growth is exposing the gaps.
            </h2>
          </div>
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <Image
              src="/resources/shomvob_hr_text.png"
              alt="Shomvob HR"
              width={120}
              height={28}
            />
          </div>
        </header>

        <div className="mt-[clamp(1.5rem,3vw,3rem)] grid h-[72%] grid-cols-2 grid-rows-3 gap-[clamp(0.65rem,1.1vw,1.2rem)]">
          {challenges.map((challenge, index) => (
            <article
              key={challenge.number}
              className={`group relative flex items-center gap-[clamp(0.75rem,1.2vw,1.3rem)] overflow-hidden rounded-2xl border border-[#0c3d20]/10 p-[clamp(0.8rem,1.25vw,1.35rem)] shadow-sm ${
                index === 1 || index === 4
                  ? "bg-[#e8f2e8]"
                  : "bg-white"
              }`}
            >
              <span className="absolute right-3 top-2 text-[clamp(1.5rem,2.4vw,2.8rem)] font-black text-[#0c3d20]/[0.055]">
                {challenge.number}
              </span>
              <div className="flex h-[clamp(2.9rem,4vw,4.5rem)] w-[clamp(2.9rem,4vw,4.5rem)] shrink-0 items-center justify-center rounded-2xl bg-[#0c3d20] text-[#edb713]">
                <ChallengeIcon type={challenge.icon} />
              </div>
              <div className="relative">
                <h3 className="max-w-[90%] text-[clamp(0.78rem,1.02vw,1.15rem)] font-bold leading-tight">
                  {challenge.title}
                </h3>
                <p className="mt-2 max-w-[92%] text-[clamp(0.55rem,0.68vw,0.76rem)] leading-relaxed text-[#496454]">
                  {challenge.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </main>
    </section>
  );
}
