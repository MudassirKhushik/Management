// src/components/agency/NetworkPerksSection.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      const cards = sectionRef.current.querySelectorAll(".perk-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
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
  }, [perks]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-tct-cream overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
            <motion.span
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: primaryColor || "#D2232A" }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Why Choose Us
            </motion.span>
            <motion.h2
              className="font-display text-4xl md:text-5xl font-black mt-4 mb-6"
              variants={itemVariants}
            >
              Everything Under One Roof
            </motion.h2>
            <motion.p
              className="text-lg"
              style={{ color: "var(--tct-gray)" }}
              variants={itemVariants}
            >
              We handle every aspect of your journey, so you can focus on what truly matters.
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
        >
          {perks.map((perk, i) => (
            <motion.div
              key={perk.title}
              variants={itemVariants}
              className="perk-card bg-white rounded-2xl p-8 transition-all duration-500 group"
              whileHover={{
                y: -8,
                boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                className="text-4xl mb-4"
                whileHover={{
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.3 },
                }}
              >
                {perk.icon}
              </motion.div>
              <motion.h3
                className="font-display text-xl font-bold uppercase mb-3"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.3 }}
              >
                {perk.title}
              </motion.h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--tct-gray)" }}>
                {perk.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}