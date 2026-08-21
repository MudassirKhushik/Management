// src/components/agency/AboutSection.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { scale: 0.9, opacity: 0, rotateY: 30 },
        {
          scale: 1,
          opacity: 1,
          rotateY: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: imageRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section
      ref={sectionRef}
      id="about"
      className="max-w-7xl mx-auto px-6 py-24 overflow-hidden"
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
      >
        <motion.div variants={itemVariants}>
          <motion.span
            className="text-sm font-semibold uppercase tracking-[0.3em]"
            style={{ color: primaryColor || "#D2232A" }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            About Us
          </motion.span>
          <motion.h2
            className="font-display text-4xl md:text-5xl font-black mt-4 mb-6"
            variants={itemVariants}
          >
            {agency?.city ? (
              <>
                Based in {agency.city},<br />
                Trusted Nationwide
              </>
            ) : (
              "Trusted Nationwide"
            )}
          </motion.h2>
          <motion.div
            className="space-y-4 text-lg leading-relaxed"
            style={{ color: "var(--tct-gray)" }}
            variants={itemVariants}
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              {displayName} was built around one job: making Hajj, Umrah, and general tour
              planning feel handled, not stressful. We work with a vetted network of hotels,
              transport operators, and visa channels so every leg of your trip is booked by
              someone who's arranged it before.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
            >
              Whether it's a single pilgrim's Umrah, a family honeymoon, or a group of forty on a
              jamaat trip, the plan is built around your group — not a fixed template.
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          ref={imageRef}
          variants={itemVariants}
          className="flex justify-center"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative w-full max-w-md">
            <motion.div
              className="relative bg-white rounded-3xl p-8 shadow-2xl border-2"
              style={{ borderColor: primaryColor || "#D2232A" }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              viewport={{ once: true }}
            >
              <img
                src={agency?.logoUrl || "/logo.png"}
                alt={`${displayName} logo`}
                className="w-full"
              />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}