// src/components/agency/HeroCarousel.tsx

import { splitName } from "@/src/lib/formatting";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

interface AgencyInfo {
  name: string;
  slug: string;
  city: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
}

interface HeroCarouselProps {
  agency: AgencyInfo | null;
  services: string[];
}

export function HeroCarousel({ agency, services }: HeroCarouselProps) {
  // Safe fallback for name if agency is null to prevent splitName crashing
  const displayName = agency?.name || "";
  const { lead: nameLead = "", last: nameLast = "" } = splitName(displayName);

  // Safe color fallback. If the CSS variable isn't defined, it uses the hex instead.
  const accentColor = agency?.primaryColor || "#D2232A";

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Faint red world-map watermark */}
      <div
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage:
            `radial-gradient(circle at 20% 30%, ${accentColor} 2px, transparent 2px), radial-gradient(circle at 60% 60%, ${accentColor} 2px, transparent 2px), radial-gradient(circle at 80% 20%, ${accentColor} 2px, transparent 2px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Subtle gradient depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${accentColor}20, transparent 60%)` }}
      />

      {/* Red accent bar */}
      <div
        className="absolute top-0 right-0 w-2/3 h-3 md:h-4"
        style={{ backgroundColor: accentColor, clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
        <Eyebrow light>{services.join("  •  ")}</Eyebrow>

        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] font-black uppercase mb-6 text-white">
          {nameLead ? `${nameLead} ` : ""}
          <span style={{ color: accentColor }}>{nameLast}</span>
        </h1>

        <div className="flex items-center gap-2 mb-8" aria-hidden="true">
          <span className="h-px w-10 border-t-2 border-dotted" style={{ borderColor: accentColor }} />
          <span className="text-sm" style={{ color: accentColor }}>✕</span>
        </div>

        <p className="max-w-xl text-base md:text-lg mb-8" style={{ color: "#b8b8b8" }}>
          {displayName} plans Hajj, Umrah, and general tours from{" "}
          {agency?.city ? `${agency.city}, Pakistan` : "Pakistan"} — flights, hotels, visas,
          and group travel, handled by people who've done it before.
        </p>

        <a
          href="#packages"
          className="inline-block px-8 py-3 font-semibold uppercase tracking-wide text-sm text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: accentColor }}
        >
          View Packages
        </a>
      </div>
    </section>
  );
}

// -------------------------------------------------------------
// 🚨 THIS IS WHAT WAS MISSING! DO NOT DELETE THIS LINE 🚨
export default HeroCarousel; 
// -------------------------------------------------------------