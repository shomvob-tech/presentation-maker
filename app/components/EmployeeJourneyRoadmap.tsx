import Image from "next/image";

type JourneyIcon =
  | "onboard"
  | "attendance"
  | "leave"
  | "approval"
  | "report"
  | "dashboard";

const stops: Array<{
  number: string;
  title: string;
  detail: string;
  icon: JourneyIcon;
  markerClass: string;
  cardClass: string;
}> = [
  {
    number: "01",
    title: "Employee Onboard",
    detail: "One profile, ready from day one",
    icon: "onboard",
    markerClass: "left-[8%] top-[60%]",
    cardClass: "left-[3%] top-[42%]",
  },
  {
    number: "02",
    title: "Attendance",
    detail: "Accurate, mobile-first tracking",
    icon: "attendance",
    markerClass: "left-[23%] top-[51%]",
    cardClass: "left-[17%] top-[70%]",
  },
  {
    number: "03",
    title: "Leave Management",
    detail: "Requests and balances in one flow",
    icon: "leave",
    markerClass: "left-[39%] top-[52%]",
    cardClass: "left-[33%] top-[34%]",
  },
  {
    number: "04",
    title: "Approval",
    detail: "Faster, role-based decisions",
    icon: "approval",
    markerClass: "left-[54%] top-[67%]",
    cardClass: "left-[48%] top-[78%]",
  },
  {
    number: "05",
    title: "Report Generation",
    detail: "Reliable data, ready when needed",
    icon: "report",
    markerClass: "left-[71%] top-[47%]",
    cardClass: "left-[65%] top-[29%]",
  },
  {
    number: "06",
    title: "Management Dashboard",
    detail: "Workforce insights at a glance",
    icon: "dashboard",
    markerClass: "left-[89%] top-[42%]",
    cardClass: "right-[2.5%] top-[59%]",
  },
];

function StopIcon({ type }: { type: JourneyIcon }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      {type === "onboard" && (
        <>
          <circle cx="12" cy="8" r="3" {...common} />
          <path d="M6.5 19c.7-3.4 2.5-5.2 5.5-5.2s4.8 1.8 5.5 5.2" {...common} />
          <path d="M18 8.5h4m-2-2v4" {...common} />
        </>
      )}
      {type === "attendance" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <path d="M12 7v5l3.5 2" {...common} />
        </>
      )}
      {type === "leave" && (
        <>
          <rect x="4" y="5.5" width="16" height="14" rx="2" {...common} />
          <path d="M8 3.5v4m8-4v4M4 10h16m-12 4h3m2.5 0H17" {...common} />
        </>
      )}
      {type === "approval" && (
        <>
          <circle cx="12" cy="12" r="8.5" {...common} />
          <path d="m8 12.3 2.6 2.6 5.7-6" {...common} />
        </>
      )}
      {type === "report" && (
        <>
          <path d="M6 3.5h9l3 3V20H6z" {...common} />
          <path d="M14.5 3.5V7H18M9 16v-3m3 3V9m3 7v-5" {...common} />
        </>
      )}
      {type === "dashboard" && (
        <>
          <rect x="3.5" y="4" width="17" height="16" rx="2" {...common} />
          <path d="M3.5 9h17M9 9v11m3-4 2-2 2 1 2-3" {...common} />
        </>
      )}
    </svg>
  );
}

export default function EmployeeJourneyRoadmap() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0c3d20] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[#062b16]"
        style={{ clipPath: "polygon(0 0, 42% 0, 20% 100%, 0% 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[#137a3c]/40"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 60% 100%, 78% 0)" }}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#edb713] opacity-20 blur-[100px]" />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #edb713 1.5px, transparent 1.5px)",
          backgroundSize: "20px 20px",
        }}
      />

      <header className="absolute inset-x-[5.5%] top-[5.5%] z-30 flex items-start justify-between">
        <div className="max-w-[70%]">
          <span className="inline-flex rounded-full bg-[#edb713] px-4 py-1.5 text-[clamp(0.55rem,0.72vw,0.8rem)] font-bold uppercase tracking-[0.2em] text-[#0c3d20]">
            One connected employee experience
          </span>
          <h1 className="mt-4 text-[clamp(2.2rem,4vw,4.5rem)] font-bold leading-none tracking-tight">
            Employee Journey with Shomvob
          </h1>
          <p className="mt-3 text-[clamp(0.8rem,1.15vw,1.25rem)] text-white/65">
            From the first day to better workforce decisions—every step,
            connected.
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

      <svg
        className="pointer-events-none absolute inset-x-0 top-[24%] h-[70%] w-full"
        viewBox="0 0 1600 650"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M-110 390 C115 540 245 535 360 350 C470 175 605 200 740 385 C865 555 1010 540 1115 315 C1200 130 1350 95 1480 255 C1560 355 1650 345 1720 230"
          fill="none"
          stroke="#02170c"
          strokeOpacity=".5"
          strokeWidth="170"
        />
        <path
          d="M-110 390 C115 540 245 535 360 350 C470 175 605 200 740 385 C865 555 1010 540 1115 315 C1200 130 1350 95 1480 255 C1560 355 1650 345 1720 230"
          fill="none"
          stroke="#174e2d"
          strokeWidth="144"
        />
        <path
          d="M-110 390 C115 540 245 535 360 350 C470 175 605 200 740 385 C865 555 1010 540 1115 315 C1200 130 1350 95 1480 255 C1560 355 1650 345 1720 230"
          fill="none"
          stroke="#edb713"
          strokeOpacity=".48"
          strokeWidth="3"
          transform="translate(0 -69)"
        />
        <path
          d="M-110 390 C115 540 245 535 360 350 C470 175 605 200 740 385 C865 555 1010 540 1115 315 C1200 130 1350 95 1480 255 C1560 355 1650 345 1720 230"
          fill="none"
          stroke="#edb713"
          strokeOpacity=".48"
          strokeWidth="3"
          transform="translate(0 69)"
        />
        <path
          d="M-110 390 C115 540 245 535 360 350 C470 175 605 200 740 385 C865 555 1010 540 1115 315 C1200 130 1350 95 1480 255 C1560 355 1650 345 1720 230"
          fill="none"
          stroke="white"
          strokeDasharray="28 28"
          strokeLinecap="round"
          strokeOpacity=".85"
          strokeWidth="8"
        />
      </svg>

      <div className="absolute inset-0 z-20">
        {stops.map((stop) => (
          <div key={stop.number}>
            <div
              className={`absolute -translate-x-1/2 -translate-y-1/2 ${stop.markerClass}`}
            >
              <div className="relative flex h-[clamp(3.5rem,5vw,5.5rem)] w-[clamp(3.5rem,5vw,5.5rem)] items-center justify-center rounded-full border-[clamp(0.25rem,0.4vw,0.45rem)] border-[#edb713] bg-[#071d10] text-[#edb713] shadow-xl shadow-black/40">
                <StopIcon type={stop.icon} />
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#edb713] px-1 text-[0.6rem] font-black text-[#0c3d20] shadow-md">
                  {stop.number}
                </span>
              </div>
            </div>

            <div
              className={`absolute w-[clamp(9.5rem,14vw,16rem)] rounded-xl border border-white/10 bg-[#06180e]/90 p-[clamp(0.6rem,0.9vw,1rem)] shadow-xl shadow-black/25 backdrop-blur-sm ${stop.cardClass}`}
            >
              <div className="mb-1 text-[clamp(0.52rem,0.62vw,0.7rem)] font-bold uppercase tracking-[0.2em] text-[#edb713]">
                Step {stop.number}
              </div>
              <h2 className="text-[clamp(0.8rem,1.05vw,1.2rem)] font-bold leading-tight">
                {stop.title}
              </h2>
              <p className="mt-1 text-[clamp(0.58rem,0.7vw,0.78rem)] leading-snug text-white/55">
                {stop.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Image
        src="/resources/300_ltd_logo.svg"
        alt="300 Ltd"
        width={115}
        height={42}
        className="absolute bottom-[3.5%] left-[5.5%] z-30 h-10 w-auto"
      />
    </section>
  );
}
