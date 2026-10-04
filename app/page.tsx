import Image from "next/image";
import LightRays from "@/app/components/LightRays";
import ProposalTypeChooser from "@/app/components/ProposalTypeChooser";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#03110a] text-white">
      {/* Animated background — sits behind everything, ignores pointer events */}
      <div className="absolute inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#28a143"
          raysSpeed={0.7}
          lightSpread={0.9}
          rayLength={2}
          followMouse
          mouseInfluence={0.2}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1.3}
          saturation={1.1}
        />
      </div>

      <header className="home-fade-in relative z-10 flex items-center justify-center px-8 py-8 md:justify-start md:px-12">
        <Image
          src="/resources/shomvob_hr_text.png"
          alt="Shomvob HR"
          width={150}
          height={36}
          className="rounded-lg bg-var[--color-brand_gray] px-4 py-2 shadow-lg"
        />
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 pb-20 pt-8 text-center md:px-12">
        <p className="home-fade-in home-fade-delay-1 mb-4 inline-block rounded-full border border-[#28a143]/40 bg-[#28a143]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#5cd47e]">
          Shomvob HR
        </p>

        <h1 className="home-fade-in home-fade-delay-2 home-text-sheen max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          Proposal Builder
        </h1>

        <p className="home-fade-in home-fade-delay-3 mt-6 max-w-xl text-lg text-white/70 md:text-xl">
          Assemble a branded, client-ready document — HRIS proposal, SLA,
          hardware quotation, the two combined, or a pitch presentation — in
          minutes.
        </p>

        <div className="home-fade-in home-fade-delay-4 mt-10 w-full">
          <ProposalTypeChooser />
        </div>
      </section>

      <footer className="home-fade-in home-fade-delay-5 relative z-10 border-t border-white/10 px-8 py-6 text-center text-sm text-white/50 md:px-12">
        Powered by{" "}
        <span className="font-medium text-[#edb713]">Shomvob Technologies</span>
      </footer>
    </main>
  );
}