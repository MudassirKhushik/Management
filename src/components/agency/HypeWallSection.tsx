// src/components/agency/HypeWallSection.tsx
//
// TEMPORARY placeholder testimonials — replace with real client reviews once
// you start collecting them (e.g. via a simple feedback form after a trip,
// or WhatsApp screenshots you transcribe manually for now). These are
// clearly generic on purpose; swap the `TESTIMONIALS` array below with real
// names/quotes whenever you have them — no other code needs to change.

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eyebrow } from "@/src/components/ui/Eyebrow";

gsap.registerPlugin(ScrollTrigger);

const TESTIMONIALS = [
  {
    name: "Ahmed R.",
    trip: "Umrah, Group of 6",
    quote:
      "Every hotel and transport pickup was exactly as promised. First time doing Umrah as a family and it felt completely handled from start to finish.",
  },
  {
    name: "Sara M.",
    trip: "Hajj Package",
    quote:
      "The visa process usually stresses me out but this time it was smooth — clear updates at every step and no last-minute surprises.",
  },
  {
    name: "Bilal K.",
    trip: "Family Tour, 12 people",
    quote:
      "Booked flights, hotels, and a driver for our whole group in one call. Everything matched what we agreed on, down to the room types.",
  },
];

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
          {TESTIMONIALS.map((t, index) => (
            <motion.div
              key={t.name}
              className="hype-card bg-white border-2 border-dotted p-6"
              style={{ borderColor: "var(--tct-red)" }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.p
                className="text-sm mb-4"
                style={{ color: "var(--tct-gray)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.2 }}
              >
                "{t.quote}"
              </motion.p>
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tct-black)" }}>
                {t.name}
              </div>
              <div className="text-xs" style={{ color: "var(--tct-gray)" }}>
                {t.trip}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}