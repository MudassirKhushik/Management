"use client";

import { motion } from "framer-motion";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function AboutSection() {
  // Flat destructuring — matches the actual shape of useAgencyTheme(),
  // there is no nested `agency` object on this context.
  const { primaryColor, agencyName, city } = useAgencyTheme();

  return (
    <section id="about" className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div className="space-y-6">
            <motion.span
              variants={itemVariants}
              className="text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: primaryColor }}
            >
              About Us
            </motion.span>

            <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              {city ? (
                <>
                  Based in {city},<br />Trusted Nationwide
                </>
              ) : (
                agencyName || "Our Agency"
              )}
            </motion.h2>

            <motion.p variants={itemVariants} className="text-lg leading-relaxed" style={{ color: "var(--tct-gray)" }}>
              {agencyName} was built around one job: making Hajj, Umrah, and general tour
              planning feel handled, not stressful — every leg of your trip booked by someone
              who's arranged it before.
            </motion.p>

            <motion.div variants={itemVariants} className="pt-4">
              <a
                href="#packages"
                className="inline-block px-8 py-3 rounded-full text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                Discover More
              </a>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl bg-tct-cream flex items-center justify-center"
          >
            <span style={{ color: primaryColor }}>Image Placeholder</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}