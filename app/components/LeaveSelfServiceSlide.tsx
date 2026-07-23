import Image from "next/image";
import ClientLogo from "./ClientLogo";

const steps = [
  {
    number: "01",
    title: "Apply for Leave in Minutes",
    copy: "Submit leave requests anytime with a few simple steps.",
    icon: "apply",
  },
  {
    number: "02",
    title: "Real-Time Leave Balance",
    copy: "View available leave and request history instantly.",
    icon: "balance",
  },
];

function StepIcon({ type }: { type: string }) {
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
      {type === "apply" && (
        <>
          <path d="M6 3.5h9l3 3V20H6z" />
          <path d="M14.5 3.5V7H18M9 15.5h6M9 12h6" />
          <path d="m8.7 18.5 1.6 1.6 2.8-3.2" />
        </>
      )}
      {type === "balance" && (
        <>
          <path d="M4 20V13m6 7V9m6 11v-7m4 7V6" />
          <path d="m3 8 5-5 5 6 7-6" />
        </>
      )}
    </svg>
  );
}

export default function LeaveSelfServiceSlide() {
  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden bg-[#0c3d20] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[#062b16]"
        style={{ clipPath: "polygon(0 0, 40% 0, 18% 100%, 0 100%)" }}
      />
      <div className="pointer-events-none absolute -right-28 bottom-[-8%] h-[420px] w-[420px] rounded-full bg-[#edb713] opacity-[0.16] blur-[110px]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[4%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-white/[0.05]"
      >
        09
      </span>

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
        <div className="max-w-[70%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#edb713]">
            Leave management &middot; Part 2 of 2
          </span>
          <h1 className="mt-2 text-[clamp(2.15rem,3.7vw,4.2rem)] font-bold leading-none tracking-tight">
            Leave Management
          </h1>
          <p className="mt-3 max-w-[560px] text-[clamp(0.78rem,1.08vw,1.18rem)] leading-relaxed text-white/65">
            A simple self-service leave experience for every employee.
          </p>
        </div>

        <div className="rounded-xl bg-white/95 px-4 py-2 shadow-lg">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={130}
            height={31}
          />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center px-[5.5%]">
        <div className="grid w-full grid-cols-[1.05fr_0.95fr] items-center gap-10">
          {/* left: two-step self-service flow */}
          <div className="relative flex max-w-lg flex-col gap-10 pl-2">
            <div className="pointer-events-none absolute left-[1.85rem] top-[3.25rem] h-[calc(100%-4.5rem)] w-px bg-white/15" />

            {steps.map((step) => (
              <div key={step.number} className="relative flex gap-5">
                <div className="relative z-10 flex h-[3.6rem] w-[3.6rem] shrink-0 items-center justify-center rounded-full border-[3px] border-[#edb713] bg-[#0c3d20] text-[#edb713] shadow-lg shadow-black/30">
                  <StepIcon type={step.icon} />
                </div>
                <div className="pt-1">
                  <div className="mb-1 text-[clamp(0.5rem,0.6vw,0.68rem)] font-bold uppercase tracking-[0.2em] text-[#edb713]">
                    Step {step.number}
                  </div>
                  <h2 className="text-[clamp(1.1rem,1.5vw,1.6rem)] font-bold leading-tight">
                    {step.title}
                  </h2>
                  <p className="mt-2 max-w-sm text-[clamp(0.68rem,0.85vw,0.95rem)] leading-relaxed text-white/55">
                    {step.copy}
                  </p>
                </div>
              </div>
            ))}

            <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[clamp(0.5rem,0.6vw,0.68rem)] font-semibold uppercase tracking-[0.14em] text-white/50">
              Same connected system as HR&apos;s bulk-approval view
            </div>
          </div>

          {/* right: two overlapping phone mockups */}
          <div className="relative flex items-center justify-center py-8">
            <div className="pointer-events-none absolute h-[320px] w-[320px] rounded-full bg-[#edb713]/12" />

            <div className="relative -mr-16 rotate-[-9deg] rounded-[2rem] bg-white/95 p-2.5 shadow-2xl shadow-black/50">
              <div className="overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/resources/Leave_Application.png"
                  alt="Leave application form mockup"
                  width={210}
                  height={475}
                />
              </div>
            </div>

            <div className="relative z-10 rotate-[7deg] rounded-[2rem] bg-white/95 p-2.5 shadow-2xl shadow-black/50">
              <div className="overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/resources/Leave_Management.png"
                  alt="Leave balance and history mockup"
                  width={230}
                  height={542}
                  priority
                />
              </div>
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0c3d20] px-3 py-1 text-xs font-semibold text-white shadow-md">
                Real-Time Leave Balance
              </span>
            </div>
          </div>
        </div>
      </div>

      <ClientLogo size="lg" className="relative z-10 mb-10 ml-[5.5%]" />
    </section>
  );
}
