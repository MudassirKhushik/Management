// src/components/agency/MemoriesSection.tsx
// Now renders the agency's real Gallery/Memories images (uploaded via
// Settings) when present. Falls back to the original "coming soon"
// placeholder grid when the agency hasn't uploaded any yet, so the section
// never looks broken for a brand-new agency.

"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/src/components/ui/Reveal";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

interface MemoriesSectionProps {
  images?: string[];
}

export function MemoriesSection({ images = [] }: MemoriesSectionProps) {
  const hasImages = images.length > 0;
  const placeholderCount = 4;

  return (
    <section id="memories" className="max-w-6xl mx-auto px-6 py-20">
      <Reveal>
        <Eyebrow>Memories</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase mb-10">
          From the Road
        </h2>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hasImages
          ? images.map((url, index) => (
              <motion.div
                key={url}
                className="aspect-square overflow-hidden rounded-lg border-2"
                style={{ borderColor: "var(--tct-red)" }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, rotate: 1 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))
          : Array.from({ length: placeholderCount }).map((_, index) => (
              <motion.div
                key={index}
                className="aspect-square border-2 border-dotted flex items-center justify-center text-xs uppercase tracking-wide text-center px-3"
                style={{ borderColor: "var(--tct-red)", color: "var(--tct-gray)" }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, rotate: 1 }}
              >
                Photo coming soon
              </motion.div>
            ))}
      </div>
    </section>
  );
}