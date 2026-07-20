import Image from "next/image";

const journey = [
  {
    number: "01",
    title: "Install the app",
    detail: "Download Shomvob HR on the employee's phone.",
    icon: "download",
  },
  {
    number: "02",
    title: "Credentials are ready",
    detail: "The account is already prepared by HR—no registration needed.",
    icon: "credential",
  },
  {
    number: "03",
    title: "Login with confidence",
    detail: "Enter the provided credentials in a simple Bangla-first experience.",
    icon: "login",
  },
  {
    number: "04",
    title: "Ready to work",
    detail: "The right tools, services, and permissions appear immediately.",
    icon: "ready",
  },
];

function JourneyIcon({ type }: { type: string }) {
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
      {type === "download" && (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
          <path d="M9.5 15.5h5M12 7v6m-2.5-2.5L12 13l2.5-2.5" />
          <path d="M10.5 18.5h3" />
        </>
      )}
      {type === "credential" && (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="11" r="2.2" />
          <path d="M5.5 16c.5-1.7 1.5-2.5 3-2.5s2.5.8 3 2.5M14 10h4m-4 3h4" />
        </>
      )}
      {type === "login" && (
        <>
          <path d="M14 4h5v16h-5M10 8l4 4-4 4M14 12H3" />
        </>
      )}
      {type === "ready" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m7.5 12.3 2.8 2.8 6.5-6.5" />
        </>
      )}
    </svg>
  );
}

export default function Onboarding_2() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0b351d] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "25px 25px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[#28a143]/20"
        style={{ clipPath: "polygon(55% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
      <div className="pointer-events-none absolute -right-28 -top-28 h-[420px] w-[420px] rounded-full border-[80px] border-[#edb713]/10" />

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
        <div className="max-w-[72%]">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#edb713] px-3 py-1 text-[clamp(0.5rem,0.62vw,0.7rem)] font-black uppercase tracking-[0.2em] text-[#0c3d20]">
              Employee Onboarding
            </span>
            <span className="text-[clamp(0.5rem,0.62vw,0.7rem)] font-bold uppercase tracking-[0.18em] text-[#65dd82]">
              Part 02 · Experience
            </span>
          </div>
          <h1 className="mt-4 text-[clamp(2.2rem,4.15vw,4.6rem)] font-bold leading-[0.95] tracking-tight">
            Employee Journey
            
          </h1>
          <p className="mt-4 max-w-[700px] text-[clamp(0.72rem,0.95vw,1.05rem)] leading-relaxed text-white/60">
            No forms. No waiting. A guided first login that gets every employee
            working in minutes.
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

      <div className="absolute inset-x-[5.5%] bottom-[7%] top-[39%] z-10">
        <div className="absolute left-[7%] right-[7%] top-[22%] h-[3px] bg-white/10">
          <div className="h-full w-full bg-gradient-to-r from-[#28a143] via-[#edb713] to-[#28a143]" />
        </div>

        <div className="relative grid h-full grid-cols-4 items-start gap-[clamp(0.65rem,1.15vw,1.3rem)]">
          {journey.map((step, index) => (
            <article
              key={step.number}
              className={`relative flex flex-col items-center text-center ${
                index % 2 === 1 ? "mt-[6%]" : ""
              }`}
            >
              <div
                className={`relative z-10 flex h-[clamp(3.6rem,5vw,5.6rem)] w-[clamp(3.6rem,5vw,5.6rem)] shrink-0 items-center justify-center rounded-full border-[4px] border-[#0b351d] shadow-xl ${
                  index === journey.length - 1
                    ? "bg-[#edb713] text-[#0c3d20]"
                    : "bg-[#28a143] text-white"
                }`}
              >
                <JourneyIcon type={step.icon} />
                <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1 text-[0.58rem] font-black text-[#0c3d20]">
                  {step.number}
                </span>
              </div>

              <div className="mt-[clamp(0.75rem,1.2vw,1.3rem)] w-full rounded-[1.15rem] border border-white/10 bg-[#061f11]/85 px-[clamp(0.75rem,1.1vw,1.2rem)] py-[clamp(0.7rem,1vw,1.05rem)] shadow-xl shadow-black/20 backdrop-blur-sm">
                <span className="text-[clamp(0.48rem,0.58vw,0.66rem)] font-bold uppercase tracking-[0.2em] text-[#edb713]">
                  Step {step.number}
                </span>
                <h2 className="mt-1.5 text-[clamp(0.92rem,1.22vw,1.38rem)] font-bold leading-snug">
                  {step.title}
                </h2>
                <p className="mx-auto mt-2 text-[clamp(0.68rem,0.88vw,1rem)] leading-snug text-white/60">
                  {step.detail}
                </p>
              </div>

              {index < journey.length - 1 && (
                <div className="absolute left-[calc(50%+2.8rem)] top-[clamp(1.65rem,2.4vw,2.7rem)] z-20 flex items-center text-[#edb713]">
                  <span className="h-px w-[clamp(0.8rem,1.8vw,2.2rem)] bg-[#edb713]/70" />
                  <svg
                    viewBox="0 0 12 12"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="m3 2 4 4-4 4" />
                  </svg>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="absolute bottom-[2.5%] left-1/2 z-20 -translate-x-1/2 text-[clamp(0.46rem,0.55vw,0.62rem)] font-bold uppercase tracking-[0.28em] text-white/30">
        Install · Access · Login · Start
      </div>
    </section>
  );
}
