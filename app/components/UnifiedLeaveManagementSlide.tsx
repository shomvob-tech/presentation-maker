import Image from "next/image";
import ClientLogo from "./ClientLogo";

const capabilities = [
  {
    title: "Centralized Management",
    copy: "Manage policies, requests, and approvals from one place.",
    icon: "hub",
  },
  {
    title: "Automated Tracking",
    copy: "Monitor balances, accruals, and leave usage automatically.",
    icon: "track",
  },
  {
    title: "Split Leave by Type",
    copy: "For a 5-day approval, HR can assign 3 days as casual leave and the remaining 2 to another leave category.",
    icon: "split",
    highlight: true,
  },
  {
    title: "Holiday Calendar",
    copy: "Use built-in public holidays for accurate leave planning.",
    icon: "calendar",
  },
  {
    title: "Employee Self-Service",
    copy: "Employees can submit leave requests in a few simple steps.",
    icon: "apply",
  },
  {
    title: "Real-Time Balance",
    copy: "View available leave and request history instantly.",
    icon: "balance",
  },
];

function CapabilityIcon({ type }: { type: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "hub" && (
        <>
          <circle cx="12" cy="5" r="2" />
          <circle cx="5" cy="17" r="2" />
          <circle cx="19" cy="17" r="2" />
          <path d="M12 7v4m0 0-6 4m6-4 6 4" />
        </>
      )}
      {type === "track" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2M8.5 3.8 12 2l3.5 1.8" />
        </>
      )}
      {type === "split" && (
        <>
          <path d="M5 5h5a3 3 0 0 1 3 3v8a3 3 0 0 0 3 3h3" />
          <path d="M13 10V8a3 3 0 0 1 3-3h3M17 3l2 2-2 2M17 17l2 2-2 2" />
        </>
      )}
      {type === "calendar" && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M8 3v4m8-4v4M3.5 9.5h17M7.5 14h3m3 0h3m-9 3.5h3" />
        </>
      )}
      {type === "apply" && (
        <>
          <path d="M6 3.5h9l3 3V20H6zM14.5 3.5V7H18M9 12h6M9 15.5h4" />
          <path d="m13.5 18 1.5 1.5 3-3.5" />
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

export default function UnifiedLeaveManagementSlide() {
  return (
    <section
      data-module="leave"
      className="relative h-screen w-full overflow-hidden bg-[#f3f0e5] text-[#092d19]"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[37%] bg-[#0c3d20]" />
      <div className="pointer-events-none absolute right-[37%] top-0 h-full w-[5%] bg-[#edb713]" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
      <div className="pointer-events-none absolute -bottom-28 -left-28 h-[360px] w-[360px] rounded-full border-[70px] border-[#28a143]/10" />
      <div className="pointer-events-none absolute -right-28 bottom-[-10%] h-[420px] w-[420px] rounded-full bg-[#edb713]/15 blur-[100px]" />

      <header className="absolute inset-x-[5.5%] top-[5%] z-20 flex items-start justify-between">
        <div>
          <span className="text-[clamp(0.52rem,0.68vw,0.76rem)] font-bold uppercase tracking-[0.25em] text-[#28a143]">
            Connected leave experience
          </span>
          <h1 className="mt-2 text-[clamp(2.35rem,3.8vw,4.35rem)] font-black leading-none tracking-[-0.04em]">
            Leave Management
          </h1>
          <p className="mt-3 max-w-[620px] text-[clamp(0.7rem,0.92vw,1.04rem)] leading-relaxed text-[#496454]">
            One connected workflow for employee self-service, policy control,
            tracking, and flexible HR approval.
          </p>
        </div>

        <div className="flex items-center gap-5 text-white">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={130}
            height={31}
          />
          <div className="h-7 w-px bg-white/25" />
          <ClientLogo size="md" />
        </div>
      </header>

      <div className="absolute bottom-[6%] left-[5.5%] right-[44%] top-[27%] z-10">
        <div className="grid h-full grid-cols-2 gap-[clamp(0.65rem,1vw,1.15rem)]">
          {capabilities.map((capability, index) => (
            <article
              key={capability.title}
              className={`relative flex min-w-0 items-start gap-[clamp(0.65rem,0.9vw,1rem)] overflow-hidden rounded-2xl border p-[clamp(0.85rem,1.15vw,1.25rem)] ${
                capability.highlight
                  ? "border-[#edb713] bg-[#fff9df] shadow-[0_8px_24px_rgba(78,63,9,0.08)]"
                  : "border-[#0c3d20]/10 bg-white/60"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  capability.highlight
                    ? "bg-[#edb713] text-[#0c3d20]"
                    : "bg-[#0c3d20] text-[#edb713]"
                }`}
              >
                <CapabilityIcon type={capability.icon} />
              </div>
              <div className="min-w-0">
                <span className="absolute right-3 top-2 text-[clamp(1rem,1.35vw,1.55rem)] font-black text-[#0c3d20]/[0.06]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="pr-6 text-[clamp(0.86rem,1vw,1.12rem)] font-bold leading-tight">
                  {capability.title}
                </h2>
                <p className="mt-2 text-[clamp(0.62rem,0.72vw,0.82rem)] leading-[1.5] text-[#496454]">
                  {capability.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute bottom-[2%] right-[1.5%] top-[8%] z-10 w-[40%]">
        <div className="absolute left-1/2 top-[38%] h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#edb713]/20" />
        <div className="absolute left-[12%] top-[0%] rotate-[-8deg] rounded-[2rem] bg-[#072b16] p-2.5 shadow-2xl shadow-black/45">
          <div className="overflow-hidden rounded-[1.55rem]">
            <Image
              src="/resources/Leave_Application.png"
              alt="Employee leave application on mobile"
              width={265}
              height={600}
              className="h-[clamp(24rem,62vh,42rem)] w-auto"
            />
          </div>
          <span className="absolute -left-5 top-[18%] rounded-full bg-[#edb713] px-3 py-1.5 text-[clamp(0.47rem,0.56vw,0.64rem)] font-bold uppercase tracking-[0.12em] text-[#0c3d20] shadow-lg">
            Apply
          </span>
        </div>

        <div className="absolute right-[10%] top-[10%] rotate-[7deg] rounded-[2rem] bg-[#072b16] p-2.5 shadow-2xl shadow-black/55">
          <div className="overflow-hidden rounded-[1.55rem]">
            <Image
              src="/resources/Leave_Management.png"
              alt="Employee leave balance and history on mobile"
              width={280}
              height={658}
              className="h-[clamp(26rem,68vh,46rem)] w-auto"
            />
          </div>
          <span className="absolute -right-4 bottom-[12%] rounded-full bg-[#45d66b] px-3 py-1.5 text-[clamp(0.47rem,0.56vw,0.64rem)] font-bold uppercase tracking-[0.12em] text-[#062b16] shadow-lg">
            Track
          </span>
        </div>

        <p className="absolute bottom-[1%] left-1/2 -translate-x-1/2 whitespace-nowrap text-[clamp(0.48rem,0.58vw,0.66rem)] font-semibold uppercase tracking-[0.16em] text-white/45">
          Apply &middot; Approve &middot; Track
        </p>
      </div>
    </section>
  );
}
