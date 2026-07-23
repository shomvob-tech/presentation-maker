import Image from "next/image";
import ClientLogo from "./ClientLogo";

const features = [
  {
    number: "01",
    title: "Bangla & English Mobile Experience",
    copy: "Easy language switching for better accessibility.",
    icon: "language",
    accent: "green",
  },
  {
    number: "02",
    title: "Simple & Secure Login",
    copy: "Quick login with a user-friendly experience.",
    icon: "lock",
    accent: "gold",
  },
  {
    number: "03",
    title: "Role-Based Access",
    copy: "Employees only see features relevant to their role.",
    icon: "role",
    accent: "gold",
  },
  {
    number: "04",
    title: "Single Access Point",
    copy: "Attendance, leave, requisitions, payslips, and HR services from one app.",
    icon: "grid",
    accent: "green",
  },
];

function FeatureIcon({ type }: { type: string }) {
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
      {type === "language" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.5 3.2 5.5 3.2 9s-1 6.5-3.2 9c-2.2-2.5-3.2-5.5-3.2-9S9.8 5.5 12 3Z" />
        </>
      )}
      {type === "lock" && (
        <>
          <rect x="4.5" y="10" width="15" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </>
      )}
      {type === "role" && (
        <>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M9 6V4h6v2M8 11h3m-3 4h5" />
          <circle cx="16.5" cy="12" r="1.5" />
          <path d="M14.5 17c.3-1.7 1-2.6 2-2.6s1.7.9 2 2.6" />
        </>
      )}
      {type === "grid" && (
        <>
          <rect x="4" y="4" width="5" height="5" rx="1" />
          <rect x="15" y="4" width="5" height="5" rx="1" />
          <rect x="4" y="15" width="5" height="5" rx="1" />
          <rect x="15" y="15" width="5" height="5" rx="1" />
          <path d="M9 6.5h6M6.5 9v6m11-6v6M9 17.5h6" />
        </>
      )}
    </svg>
  );
}

export default function EmployeeLoginSlide() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#f3f0e5] text-[#092d19]">
      <div className="pointer-events-none absolute -right-28 -top-28 h-[390px] w-[390px] rounded-full border-[75px] border-[#edb713]/15" />
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[23%] bg-[#28a143]/10"
        style={{ clipPath: "polygon(0 0, 100% 0, 45% 100%, 0 100%)" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[3%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-[#0c3d20]/[0.035]"
      >
        06
      </span>

      <header className="absolute inset-x-[5.5%] top-[5%] z-20 flex items-start justify-between">
        <div className="max-w-[70%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#28a143]">
            Employee experience
          </span>
          <h1 className="mt-2 text-[clamp(2.25rem,4vw,4.5rem)] font-bold leading-none tracking-tight">
            Employee Login
          </h1>
          <p className="mt-3 max-w-[760px] text-[clamp(0.78rem,1.08vw,1.18rem)] leading-relaxed text-[#496454]">
            A Bangla-first mobile experience that gets every employee logged
            in and self-serving from day one.
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

      <div className="absolute inset-x-[5.5%] bottom-[6%] top-[29%] z-10 overflow-hidden rounded-[2rem] bg-[#0c3d20] p-[clamp(1rem,1.8vw,2rem)] shadow-2xl shadow-[#0c3d20]/20">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[#28a143]/20"
          style={{ clipPath: "polygon(73% 0, 100% 0, 100% 100%, 92% 100%)" }}
        />

        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-[clamp(0.75rem,1.2vw,1.25rem)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#edb713]" />
              <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.23em] text-[#edb713]">
                Feature highlights
              </span>
            </div>

          </div>

          <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-[clamp(0.65rem,1.05vw,1.1rem)]">
            {features.map((feature) => {
              const isGold = feature.accent === "gold";

              return (
                <article
                  key={feature.number}
                  className="relative flex items-center gap-[clamp(0.9rem,1.4vw,1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#071d10]/90 p-[clamp(0.9rem,1.35vw,1.45rem)]"
                >
                  <span className="absolute right-4 top-2 text-[clamp(2.4rem,4vw,4.5rem)] font-black leading-none text-white/[0.035]">
                    {feature.number}
                  </span>
                  <div
                    className={`flex h-[clamp(3.3rem,4.7vw,5.2rem)] w-[clamp(3.3rem,4.7vw,5.2rem)] shrink-0 items-center justify-center rounded-2xl ${
                      isGold
                        ? "bg-[#edb713] text-[#0c3d20]"
                        : "bg-[#28a143] text-white"
                    }`}
                  >
                    <FeatureIcon type={feature.icon} />
                  </div>
                  <div className="relative">
                    <div
                      className={`mb-1.5 text-[clamp(0.48rem,0.58vw,0.65rem)] font-bold uppercase tracking-[0.18em] ${
                        isGold ? "text-[#edb713]" : "text-[#5ae47a]"
                      }`}
                    >
                      Feature {feature.number}
                    </div>
                    <h2 className="max-w-[92%] text-[clamp(0.88rem,1.18vw,1.35rem)] font-bold leading-tight text-white">
                      {feature.title}
                    </h2>
                    <p className="mt-2 max-w-[90%] text-[clamp(0.58rem,0.72vw,0.82rem)] leading-relaxed text-white/50">
                      {feature.copy}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
