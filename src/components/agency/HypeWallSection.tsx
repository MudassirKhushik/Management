// src/components/agency/HypeWallSection.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

gsap.registerPlugin(ScrollTrigger);

export function HypeWallSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll(".hype-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.15,
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
      className="py-4"
      style={{ backgroundColor: "var(--tct-cream)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Eyebrow>Hype Wall</Eyebrow>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase mb-10">
            What Travelers Say
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <motion.div
              key={n}
              className="hype-card bg-white border-2 border-dotted p-6"
              style={{ borderColor: "var(--tct-red)" }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                className="text-sm"
                style={{ color: "var(--tct-gray)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: n * 0.2 }}
              >
                Real traveler reviews will appear here once you start collecting them.
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}