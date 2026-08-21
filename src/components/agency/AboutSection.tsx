// src/components/agency/AboutSection.tsx

import { Reveal } from "@/src/components/ui/Reveal";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

interface AgencyInfo {
  name: string;
  slug: string;
  city: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
}

interface AboutSectionProps {
  agency: AgencyInfo | null;
}

export function AboutSection({ agency }: AboutSectionProps) {
  const { primaryColor } = useAgencyTheme();
  const displayName = agency?.name || "";

  return (
    <section id="about" className="max-w-7xl mx-auto px-6 py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <Reveal>
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
              About Us
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black mt-4 mb-6">
              {agency?.city ? (
                <>
                  Based in {agency.city},<br />
                  Trusted Nationwide
                </>
              ) : (
                "Trusted Nationwide"
              )}
            </h2>
            <div className="space-y-4 text-lg leading-relaxed" style={{ color: "var(--tct-gray)" }}>
              <p>
                {displayName} was built around one job: making Hajj, Umrah, and general tour
                planning feel handled, not stressful. We work with a vetted network of hotels,
                transport operators, and visa channels so every leg of your trip is booked by
                someone who's arranged it before.
              </p>
              <p>
                Whether it's a single pilgrim's Umrah, a family honeymoon, or a group of forty on a
                jamaat trip, the plan is built around your group — not a fixed template.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal className="flex justify-center">
          <div className="relative w-full max-w-md">
            <div
              className="relative bg-white rounded-3xl p-8 shadow-2xl border-2"
              style={{ borderColor: primaryColor }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agency?.logoUrl || "/logo.png"}
                alt={`${displayName} logo`}
                className="w-full"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}