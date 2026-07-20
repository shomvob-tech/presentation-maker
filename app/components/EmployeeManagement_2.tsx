import Image from "next/image";

const workflow = [
  {
    number: "01",
    title: "Set up company structure",
    detail:
      "Configure branches, departments, designations, and employment types.",
    icon: "structure",
  },
  {
    number: "02",
    title: "Import employee records",
    detail:
      "Bulk upload employees using the standard template or existing HR data.",
    icon: "import",
  },
  {
    number: "03",
    title: "Assign roles & permissions",
    detail:
      "Grant access based on department, designation, and responsibilities.",
    icon: "permissions",
  },
  {
    number: "04",
    title: "Employee accounts ready",
    detail:
      "Login credentials are prepared and ready to be shared with employees.",
    icon: "ready",
  },
];

function WorkflowIcon({ type }: { type: string }) {
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
      {type === "structure" && (
        <>
          <rect x="3" y="3" width="8" height="6" rx="1.5" />
          <rect x="13" y="3" width="8" height="6" rx="1.5" />
          <rect x="8" y="15" width="8" height="6" rx="1.5" />
          <path d="M7 9v3h10V9M12 12v3" />
        </>
      )}
      {type === "import" && (
        <>
          <path d="M12 3v10m-3-3 3 3 3-3" />
          <path d="M4 14v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </>
      )}
      {type === "permissions" && (
        <>
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M7.5 9V7a4.5 4.5 0 0 1 9 0v2M12 13v3" />
          <circle cx="12" cy="13" r="1" />
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

export default function EmployeeManagement_2() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0a2f1a] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-[#28a143]/15"
        style={{ clipPath: "polygon(0 0, 100% 0, 45% 100%, 0 100%)" }}
      />
      <div className="pointer-events-none absolute -left-28 -bottom-28 h-[400px] w-[400px] rounded-full border-[75px] border-[#edb713]/10" />

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
        <div className="max-w-[72%]">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#edb713] px-3 py-1 text-[clamp(0.5rem,0.62vw,0.7rem)] font-black uppercase tracking-[0.2em] text-[#0c3d20]">
              Employee Management
            </span>
            <span className="text-[clamp(0.5rem,0.62vw,0.7rem)] font-bold uppercase tracking-[0.18em] text-[#65dd82]">
              Part 02 · Workflow
            </span>
          </div>
          <h1 className="mt-4 text-[clamp(2.2rem,4.15vw,4.6rem)] font-bold leading-[0.95] tracking-tight">
            How the workflow
            <span className="text-[#edb713]"> runs end to end.</span>
          </h1>
          <p className="mt-4 max-w-[700px] text-[clamp(0.72rem,0.95vw,1.05rem)] leading-relaxed text-white/60">
            From company setup to employee accounts — a guided path that gets
            your workforce into Shomvob HR.
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
          {workflow.map((step, index) => (
            <article
              key={step.number}
              className={`relative flex flex-col items-center text-center ${
                index % 2 === 1 ? "mt-[6%]" : ""
              }`}
            >
              <div
                className={`relative z-10 flex h-[clamp(3.6rem,5vw,5.6rem)] w-[clamp(3.6rem,5vw,5.6rem)] shrink-0 items-center justify-center rounded-full border-[4px] border-[#0a2f1a] shadow-xl ${
                  index === workflow.length - 1
                    ? "bg-[#edb713] text-[#0c3d20]"
                    : "bg-[#28a143] text-white"
                }`}
              >
                <WorkflowIcon type={step.icon} />
                <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1 text-[0.58rem] font-black text-[#0c3d20]">
                  {step.number}
                </span>
              </div>

              <div className="mt-[clamp(0.75rem,1.2vw,1.3rem)] w-full rounded-[1.15rem] border border-white/10 bg-[#061a0f]/90 px-[clamp(0.75rem,1.1vw,1.2rem)] py-[clamp(0.7rem,1vw,1.05rem)] shadow-xl shadow-black/20 backdrop-blur-sm">
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

              {index < workflow.length - 1 && (
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
        Structure · Import · Access · Ready
      </div>
    </section>
  );
}
