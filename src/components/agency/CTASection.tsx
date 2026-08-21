// src/components/agency/CTASection.tsx

import { Reveal } from "@/src/components/ui/Reveal";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

export function CTASection() {
  const { primaryColor } = useAgencyTheme();

  return (
    <section className="py-24 px-6 relative overflow-hidden bg-tct-black">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, ${primaryColor} 2px, transparent 2px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        <Reveal>
          <h2 className="font-display text-4xl md:text-6xl font-black uppercase text-white mb-6">
            Ready to Plan Your <span style={{ color: primaryColor }}>Trip?</span>
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "#a8a8a8" }}>
            Pick a package above, or reach out directly and we'll build one around you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#packages"
              className="px-10 py-4 font-semibold uppercase tracking-wide text-sm rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Browse Packages
            </a>
            <a
              href="#faq"
              className="px-10 py-4 font-semibold uppercase tracking-wide text-sm rounded-xl border-2 border-white/30 text-white transition-all duration-300 hover:bg-white/10"
            >
              FAQ
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}