import Image from "next/image";
import ClientLogo from "./ClientLogo";

const strengths = [
  {
    number: "01",
    label: "Workforce consulting",
    copy: "Four-plus years solving hiring and manpower challenges across industries.",
    icon: "briefcase",
  },
  {
    number: "02",
    label: "Operations at scale",
    copy: "Staffing, bulk hiring, payroll, and resource augmentation for growing teams.",
    icon: "people",
  },
  {
    number: "03",
    label: "Insight turned into product",
    copy: "Real experience with 1,500+ companies shaped the Shomvob platform.",
    icon: "insight",
  },
];

const stats = [
  { value: "4+", label: "Years", detail: "Workforce experience" },
  { value: "30,000+", label: "Placed", detail: "Job seekers connected" },
  { value: "98%+", label: "Availability", detail: "Reliable operations" },
  { value: "100%", label: "Payroll", detail: "Consistent execution" },
];

const clients = [
  { name: "Aarong", src: "/resources/clients/aarong_logo.png" },
  { name: "Artnature Bangladesh", src: "/resources/clients/artnature_logo.png" },
  { name: "Chillox", src: "/resources/clients/chillox_logo.png" },
  { name: "Domino’s Pizza", src: "/resources/clients/dominos_logo.png" },
  { name: "foodpanda", src: "/resources/clients/foodpanda-logo.png" },
  { name: "MH Global Group", src: "/resources/clients/mhglobal_logo.png" },
  { name: "Pathao Food", src: "/resources/clients/pathao_food_logo.png" },
  { name: "ShopUp", src: "/resources/clients/shopup_logo.png" },
  { name: "Singer Bangladesh", src: "/resources/clients/singer_logo.png" },
];

function StrengthIcon({ type }: { type: string }) {
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
      {type === "briefcase" && (
        <>
          <rect x="3" y="7" width="18" height="12" rx="2" />
          <path d="M8 7V5h8v2M3 12h18M10 12v2h4v-2" />
        </>
      )}
      {type === "people" && (
        <>
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2" />
          <path d="M3.5 19c.6-3.4 2.4-5.2 5.5-5.2s4.9 1.8 5.5 5.2M15 15c2.8-.4 4.6.9 5.3 3.5" />
        </>
      )}
      {type === "insight" && (
        <>
          <path d="M8.4 15.5A6 6 0 1 1 15.6 15.5c-.9.6-1.3 1.2-1.4 2H9.8c-.1-.8-.5-1.4-1.4-2Z" />
          <path d="M9.5 21h5M12 3V1M4.2 6.2 2.8 4.8M19.8 6.2l1.4-1.4" />
        </>
      )}
    </svg>
  );
}

export default function AboutShomvobSlide() {
  return (
    <section
      data-slide="about"
      className="relative h-screen w-full overflow-hidden bg-[#04150d] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_43%,rgba(35,179,82,0.18),transparent_34%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div className="pointer-events-none absolute -right-[7%] top-[5%] h-[63%] w-[52%] rotate-[-7deg] rounded-[5rem] border border-[#3cd865]/10 bg-[#0a2718]/60" />
      <div className="pointer-events-none absolute right-[13%] top-[19%] aspect-square w-[31%] rounded-full border border-[#63ef86]/10" />
      <div className="pointer-events-none absolute right-[17%] top-[25%] aspect-square w-[23%] rounded-full border border-dashed border-[#edb713]/25" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#edb713]" />

      <header className="absolute inset-x-[5.5%] top-[4.5%] z-20 flex items-center justify-between">
        <Image
          src="/resources/shomvob_hr_text.png"
          alt="Shomvob HR"
          width={178}
          height={43}
          className="h-[clamp(2rem,3.2vw,2.8rem)] w-auto"
        />
        <ClientLogo size="md" />
      </header>

      <div className="absolute inset-x-[5.5%] top-[14%] bottom-[22%] z-10 grid grid-cols-[43%_57%]">
        <div className="pr-[9%]">
          <span className="inline-flex items-center gap-2 text-[clamp(0.52rem,0.64vw,0.72rem)] font-bold uppercase tracking-[0.27em] text-[#edb713]">
            <span className="h-px w-7 bg-[#edb713]" />
            About Shomvob
          </span>
          <h1 className="mt-[3%] max-w-[9ch] text-[clamp(2.5rem,4.2vw,4.8rem)] font-black leading-[0.94] tracking-[-0.055em]">
            Built in the{" "}
            <span className="text-[#45d66b]">real world.</span>
          </h1>
          <p className="mt-[4%] max-w-[38rem] text-[clamp(0.68rem,0.9vw,1rem)] leading-relaxed text-white/55">
            Practical workforce experience, translated into a stronger HR
            system—not software built in isolation.
          </p>

          <div className="mt-[6%] border-t border-white/10">
            {strengths.map((strength) => (
              <article
                key={strength.label}
                className="group grid grid-cols-[2.1rem_2.5rem_1fr] items-center gap-3 border-b border-white/10 py-[clamp(0.55rem,1.05vh,0.85rem)]"
              >
                <span className="text-[clamp(0.48rem,0.56vw,0.65rem)] font-bold tracking-[0.2em] text-[#edb713]/70">
                  {strength.number}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c6835]/35 text-[#52df74]">
                  <span className="scale-75">
                    <StrengthIcon type={strength.icon} />
                  </span>
                </span>
                <div>
                  <h2 className="text-[clamp(0.67rem,0.85vw,0.96rem)] font-bold">
                    {strength.label}
                  </h2>
                  <p className="mt-0.5 text-[clamp(0.48rem,0.58vw,0.67rem)] leading-snug text-white/38">
                    {strength.copy}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-[43%] flex aspect-square w-[33%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#56df78]/30 bg-[#062114] text-center shadow-[0_0_80px_rgba(44,202,87,0.12)]">
            <span className="text-[clamp(2.1rem,3.6vw,4.2rem)] font-black leading-none tracking-[-0.06em] text-[#45d66b]">
              1,500+
            </span>
            <span className="mt-2 text-[clamp(0.55rem,0.68vw,0.78rem)] font-bold uppercase tracking-[0.22em] text-white/75">
              Clients
            </span>
            <span className="mt-1 text-[clamp(0.43rem,0.5vw,0.58rem)] text-white/35">
              across industries
            </span>
          </div>

          {stats.map((stat, index) => {
            const positions = [
              "left-[4%] top-[5%] text-left",
              "right-[1%] top-[7%] text-right",
              "left-[3%] bottom-[3%] text-left",
              "right-[2%] bottom-[2%] text-right",
            ];

            return (
              <div
                key={stat.label}
                className={`absolute w-[31%] ${positions[index]}`}
              >
                <div className="mb-2 h-px w-full bg-gradient-to-r from-[#45d66b]/70 to-transparent" />
                <div className="text-[clamp(1.45rem,2.45vw,2.85rem)] font-black leading-none tracking-[-0.045em] text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-[clamp(0.57rem,0.69vw,0.8rem)] font-bold uppercase tracking-[0.13em] text-[#edb713]">
                  {stat.label}
                </div>
                <div className="mt-1 text-[clamp(0.43rem,0.5vw,0.58rem)] text-white/35">
                  {stat.detail}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute inset-x-[3.8%] bottom-[3.8%] z-20">
        <div className="mb-2.5 flex items-end justify-between px-[1.7%]">
          <span className="text-[clamp(0.5rem,0.62vw,0.7rem)] font-semibold uppercase tracking-[0.22em] text-white/40">
            Trusted across Bangladesh
          </span>
          <span className="text-[clamp(0.43rem,0.5vw,0.58rem)] italic text-[#66c47c]/65">
            Real partnerships. Real operating experience.
          </span>
        </div>
        <div className="grid h-[clamp(5.4rem,10.5vh,7.8rem)] grid-cols-9 overflow-hidden rounded-[1.1rem] border border-[#bdd0bb]/35 bg-[#dfe9dc] shadow-2xl shadow-black/30">
          {clients.map((client) => (
            <div
              key={client.name}
              className="relative border-r border-[#12351f]/15 bg-[#dfe9dc] last:border-r-0"
            >
              <Image
                src={client.src}
                alt={`${client.name} logo`}
                fill
                sizes="11vw"
                className="object-contain p-[5%]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
