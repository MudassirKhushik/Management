// src/components/agency/NetworkPerksSection.tsx
// Updated with Framer Motion

"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/src/components/ui/Reveal";
import { StaggerReveal } from "@/src/components/ui/StaggerReveal";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

interface Perk {
  title: string;
  body: string;
  icon: string;
}

interface NetworkPerksSectionProps {
  perks: Perk[];
}

export function NetworkPerksSection({ perks }: NetworkPerksSectionProps) {
  const { primaryColor } = useAgencyTheme();

  return (
    <section className="py-24 bg-tct-cream">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
              Why Choose Us
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-black mt-4 mb-6">
              Everything Under One Roof
            </h2>
            <p className="text-lg" style={{ color: "var(--tct-gray)" }}>
              We handle every aspect of your journey, so you can focus on what truly matters.
            </p>
          </div>
        </Reveal>

        <StaggerReveal staggerDelay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {perks.map((perk) => (
              <motion.div
                key={perk.title}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="bg-white rounded-2xl p-8 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group"
                whileHover={{ y: -4 }}
              >
                <div className="text-4xl mb-4">{perk.icon}</div>
                <h3 className="font-display text-xl font-bold uppercase mb-3 group-hover:translate-x-1 transition-transform">
                  {perk.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--tct-gray)" }}>
                  {perk.body}
                </p>
              </motion.div>
            ))}
          </div>
        </StaggerReveal>
      </div>
    </section>
  );
}