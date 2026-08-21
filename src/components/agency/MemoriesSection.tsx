// src/components/agency/MemoriesSection.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

gsap.registerPlugin(ScrollTrigger);

export function MemoriesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      const items = sectionRef.current.querySelectorAll(".memory-item");
      gsap.fromTo(
        items,
        { opacity: 0, scale: 0.8, rotate: -5 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      id="memories"
      className="max-w-6xl mx-auto px-6 py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <Eyebrow>Memories</Eyebrow>
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase mb-10">
          From the Trip
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <motion.div
            key={n}
            className="memory-item aspect-square border-2 border-dotted flex items-center justify-center text-xs uppercase tracking-wide text-center px-3"
            style={{ borderColor: "var(--tct-red)", color: "var(--tct-gray)" }}
            whileHover={{
              scale: 1.05,
              backgroundColor: "var(--tct-cream)",
              transition: { duration: 0.3 },
            }}
          >
            Photo coming soon
          </motion.div>
        ))}
      </div>
    </section>
  );
}