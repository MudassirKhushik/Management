"use client";

import { motion } from "framer-motion";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

export function HeroSection() {
  const { primaryColor, agencyName } = useAgencyTheme();
  const displayName = agencyName || "Our Agency";

  return (
    <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center bg-tct-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/30 z-10" />

      {/* faint dotted watermark, echoes the logo's texture used sitewide */}
      <div
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 1.5px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
        >
          Explore the World with <br />
          <span style={{ color: primaryColor }}>{displayName}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
          style={{ color: "#c4c4c4" }}
        >
          Discover unparalleled travel experiences crafted just for you. Your next adventure starts here.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <a
            href="#packages"
            className="px-8 py-4 rounded-full font-semibold transition-transform hover:scale-105 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Get Started
          </a>
          <a
            href="#about"
            className="px-8 py-4 rounded-full font-semibold border border-white text-white hover:bg-white hover:text-[#121212] transition-colors"
          >
            Learn More
          </a>
        </motion.div>
      </div>
    </section>
  );
}