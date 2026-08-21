// src/components/agency/MemoriesSection.tsx
// Updated with Framer Motion

"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/src/components/ui/Reveal";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

export function MemoriesSection() {
  const items = [1, 2, 3, 4];

  return (
    <section id="memories" className="max-w-6xl mx-auto px-6 py-20">
      <Reveal>
        <Eyebrow>Memories</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase mb-10">
          From the Road
        </h2>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((n, index) => (
          <motion.div
            key={n}
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