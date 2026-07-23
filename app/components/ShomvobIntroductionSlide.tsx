import Image from "next/image";
import ClientLogo from "./ClientLogo";

const credibility = [
  {
    src: "/resources/Gates_Foundation_Logo.webp",
    alt: "Gates Foundation",
    width: 170,
    height: 48,
  },
  {
    src: "/resources/cocoon_logo.png",
    alt: "Cocoon",
    width: 130,
    height: 48,
  },
  {
    src: "/resources/100 to Watch Logo 2025.jpg",
    alt: "Forbes Asia 100 to Watch",
    width: 118,
    height: 58,
  },
];

const impactPartners = [
  {
    src: "/resources/Gates_Foundation_Logo.webp",
    alt: "Gates Foundation",
    label: "Women’s economic empowerment",
  },
  {
    src: "/resources/roots-of-impact_logo.png",
    alt: "Roots of Impact",
    label: "Corporate governance",
  },
  {
    src: "/resources/unicef_logo.png",
    alt: "UNICEF",
    label: "Community paramedics",
  },
  {
    src: "/resources/Swisscontact_logo.png",
    alt: "Swisscontact",
    label: "Skills development",
  },
  {
    src: "/resources/world_bank_group_logo.png",
    alt: "World Bank Group",
    label: "Youth and female TVET",
  },
];

export default function ShomvobIntroductionSlide() {
  return (
    <section
      data-slide="intro"
      className="relative h-screen w-full overflow-hidden bg-[#f1f0e8] text-[#082b18]"
    >
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[29%] bg-[#0c3d20]" />
      <div
        className="pointer-events-none absolute inset-0 bg-[#28a143]"
        style={{ clipPath: "polygon(83% 0, 100% 0, 100% 100%, 61% 100%)" }}
      />
      <div className="pointer-events-none absolute -bottom-36 -left-28 h-[430px] w-[430px] rounded-full border-[80px] border-[#edb713]/12" />

      <header className="absolute inset-x-[5.5%] top-[5%] z-20 flex items-center justify-between">
        <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
          <Image
            src="/resources/shomvob_hr_text.png"
            alt="Shomvob HR"
            width={130}
            height={31}
          />
        </div>
        <ClientLogo size="md" />
      </header>

      <div className="absolute left-[5.5%] top-[18%] z-10 w-[67%]">
        <span className="text-[clamp(0.55rem,0.7vw,0.78rem)] font-bold uppercase tracking-[0.25em] text-[#28a143]">
          Shomvob Technologies
        </span>
        <h1 className="mt-4 max-w-[950px] text-[clamp(2.1rem,3.65vw,4.2rem)] font-bold leading-[1.05] tracking-tight">
          Built to help Bangladesh&apos;s frontline workforce{" "}
          <span className="text-[#28a143]">thrive.</span>
        </h1>
        <p className="mt-4 max-w-[760px] text-[clamp(0.8rem,1.1vw,1.2rem)] leading-relaxed text-[#315340]">
          Shomvob brings hiring, workforce management, and payroll into one
          connected ecosystem—built around real operational needs.
        </p>
      </div>

      <div className="absolute left-[5.5%] top-[47%] z-10 w-[51%]">
        <div className="mb-3 text-[clamp(0.55rem,0.65vw,0.72rem)] font-bold uppercase tracking-[0.2em] text-[#668071]">
          Recognized by global and regional institutions
        </div>
        <div className="grid grid-cols-3 gap-3">
          {credibility.map((item) => (
            <div
              key={item.alt}
              className="flex h-[clamp(4.5rem,7vw,7.5rem)] items-center justify-center rounded-2xl border border-[#0c3d20]/10 bg-white px-5 shadow-sm"
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="max-h-[55%] w-auto max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-[5.5%] bottom-[7%] z-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-[clamp(0.55rem,0.65vw,0.72rem)] font-bold uppercase tracking-[0.2em] text-[#668071]">
            Social-impact partnerships
          </span>
          <div className="h-px flex-1 bg-[#0c3d20]/15" />
        </div>
        <div className="grid grid-cols-5 gap-3">
          {impactPartners.map((partner) => (
            <div
              key={partner.alt}
              className="flex h-[clamp(5.5rem,9vw,9.5rem)] flex-col items-center justify-between rounded-2xl bg-white p-[clamp(0.65rem,1vw,1rem)] text-center shadow-sm"
            >
              <div className="flex min-h-0 flex-1 items-center justify-center">
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  width={150}
                  height={55}
                  className="max-h-11 w-auto max-w-[90%] object-contain"
                />
              </div>
              <span className="mt-2 text-[clamp(0.5rem,0.62vw,0.7rem)] font-semibold uppercase tracking-[0.08em] text-[#315340]">
                {partner.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
