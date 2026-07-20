import Image from "next/image";

const features = [
  {
    number: "01",
    title: "One-Tap Check-In & Check-Out",
    copy: "Fast, simple attendance from any location.",
    icon: "tap",
  },
  {
    number: "02",
    title: "GPS-Enabled Attendance",
    copy: "Location-verified attendance for greater accuracy.",
    icon: "pin",
  },
  {
    number: "03",
    title: "Real-Time Attendance Recording",
    copy: "Instant workforce visibility across the organization.",
    icon: "pulse",
  },
  {
    number: "04",
    title: "Automated Payroll Integration",
    copy: "Attendance seamlessly drives payroll calculations.",
    icon: "sync",
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
      {type === "tap" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.2c-2.6 0-4.3 1.9-4.3 4.3M12 16.6V12l3-1.6" />
        </>
      )}
      {type === "pin" && (
        <>
          <path d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.9 6.5 11 6.5 11Z" />
          <circle cx="12" cy="10" r="2.3" />
        </>
      )}
      {type === "pulse" && (
        <>
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </>
      )}
      {type === "sync" && (
        <>
          <path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6" />
          <path d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4" />
        </>
      )}
    </svg>
  );
}

export default function AttendanceManagementSlide() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0c3d20] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-[380px] w-[380px] rounded-full bg-[#edb713] opacity-[0.12] blur-[110px]" />
      <div
        className="pointer-events-none absolute inset-0 bg-[#28a143]/15"
        style={{ clipPath: "polygon(100% 0, 100% 38%, 78% 0)" }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[3%] top-[4%] select-none text-[clamp(5rem,10vw,11rem)] font-black leading-none text-white/[0.045]"
      >
        07
      </span>

      <header className="relative z-20 flex items-start justify-between px-[5.5%] pt-[5%]">
        <div className="max-w-[70%]">
          <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#edb713]">
            Workforce operations
          </span>
          <h1 className="mt-2 text-[clamp(2.25rem,4vw,4.5rem)] font-bold leading-none tracking-tight">
            Attendance Management
          </h1>
          <p className="mt-3 max-w-[760px] text-[clamp(0.78rem,1.08vw,1.18rem)] leading-relaxed text-white/65">
            Real-time attendance tracking with configurable policies and
            seamless payroll integration.
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
          <Image
            src="/resources/300_ltd_logo.svg"
            alt="300 Ltd"
            width={92}
            height={33}
            className="h-8 w-auto"
          />
        </div>
      </header>

      <div className="relative z-10 mt-[clamp(1.5rem,2.6vw,2.5rem)] flex items-center gap-3 px-[5.5%]">
        <span className="h-2 w-2 rounded-full bg-[#edb713]" />
        <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.23em] text-[#edb713]">
          Feature highlights
        </span>
        <div className="h-px flex-1 bg-white/10" />
        
      </div>

      <div className="relative z-10 mt-[clamp(1.25rem,2.2vw,2rem)] grid grid-cols-2 grid-rows-2 gap-[clamp(0.75rem,1.2vw,1.35rem)] px-[5.5%] pb-[6%]">
        {features.map((feature, index) => (
          <article
            key={feature.number}
            className="relative flex items-center gap-[clamp(0.9rem,1.4vw,1.5rem)] overflow-hidden rounded-2xl bg-white/95 p-[clamp(1rem,1.5vw,1.6rem)] text-[#092d19] shadow-xl shadow-black/15"
          >
            <span className="absolute right-4 top-2 text-[clamp(2.4rem,4vw,4.5rem)] font-black leading-none text-[#0c3d20]/[0.06]">
              {feature.number}
            </span>
            <div
              className={`flex h-[clamp(3.3rem,4.7vw,5.2rem)] w-[clamp(3.3rem,4.7vw,5.2rem)] shrink-0 items-center justify-center rounded-2xl ${
                index % 2 === 0
                  ? "bg-[#0c3d20] text-[#edb713]"
                  : "bg-[#edb713] text-[#0c3d20]"
              }`}
            >
              <FeatureIcon type={feature.icon} />
            </div>
            <div className="relative">
              <div className="mb-1.5 text-[clamp(0.48rem,0.58vw,0.65rem)] font-bold uppercase tracking-[0.18em] text-[#28a143]">
                Feature {feature.number}
              </div>
              <h2 className="max-w-[92%] text-[clamp(0.88rem,1.18vw,1.35rem)] font-bold leading-tight">
                {feature.title}
              </h2>
              <p className="mt-2 max-w-[90%] text-[clamp(0.58rem,0.72vw,0.82rem)] leading-relaxed text-[#4c5f53]">
                {feature.copy}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
