// src/components/agency/HeroSection.tsx

import { splitName } from "@/src/lib/formatting";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

interface AgencyInfo {
  name: string;
  slug: string;
  city: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
}

interface HeroSectionProps {
  agency: AgencyInfo | null;
  services: string[];
}

export function HeroSection({ agency, services }: HeroSectionProps) {
  const displayName = agency?.name || "";
  const { lead: nameLead, last: nameLast } = splitName(displayName);

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Faint red world-map watermark */}
      <div
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, var(--tct-red) 2px, transparent 2px), radial-gradient(circle at 60% 60%, var(--tct-red) 2px, transparent 2px), radial-gradient(circle at 80% 20%, var(--tct-red) 2px, transparent 2px)",
          backgroundSize: "40px 40px",
        }}
      />
      
      {/* Subtle gradient depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top left, rgba(210,35,42,0.12), transparent 60%)" }}
      />
      
      {/* Red accent bar */}
      <div
        className="absolute top-0 right-0 w-2/3 h-3 md:h-4"
        style={{ backgroundColor: "var(--tct-red)", clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
        <Eyebrow light>{services.join("  •  ")}</Eyebrow>

        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] font-black uppercase mb-6 text-white">
          {nameLead ? `${nameLead} ` : ""}
          <span style={{ color: "var(--tct-red)" }}>{nameLast}</span>
        </h1>

        <div className="flex items-center gap-2 mb-8" aria-hidden="true">
          <span className="h-px w-10 border-t-2 border-dotted" style={{ borderColor: "var(--tct-red)" }} />
          <span className="text-sm" style={{ color: "var(--tct-red)" }}>✕</span>
        </div>

        <p className="max-w-xl text-base md:text-lg mb-8" style={{ color: "#b8b8b8" }}>
          {displayName} plans Hajj, Umrah, and general tours from{" "}
          {agency?.city ? `${agency.city}, Pakistan` : "Pakistan"} — flights, hotels, visas,
          and group travel, handled by people who've done it before.
        </p>

        <a
          href="#packages"
          className="inline-block px-8 py-3 font-semibold uppercase tracking-wide text-sm text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: "var(--tct-red)" }}
        >
          View Packages
        </a>
      </div>
    </section>
  );
}