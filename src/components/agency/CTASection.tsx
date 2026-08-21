// src/components/agency/CTASection.tsx
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const { primaryColor } = useAgencyTheme();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, scale: 0.98 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 px-6 relative overflow-hidden bg-tct-black"
    >
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, ${primaryColor} 2px, transparent 2px)`,
          backgroundSize: "40px 40px",
        }}
        animate={{
          backgroundPosition: ["0px 0px", "40px 40px"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        className="relative max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <motion.h2
          className="font-display text-4xl md:text-6xl font-black uppercase text-white mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          Ready to Plan Your{" "}
          <motion.span
            style={{ color: primaryColor }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3, type: "spring" }}
            viewport={{ once: true }}
          >
            Trip?
          </motion.span>
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl mb-10 max-w-2xl mx-auto"
          style={{ color: "#a8a8a8" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Pick a package above, or reach out directly and we'll build one around you.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <motion.a
            href="#packages"
            className="px-10 py-4 font-semibold uppercase tracking-wide text-sm rounded-xl transition-all duration-300 text-white"
            style={{ backgroundColor: primaryColor }}
            whileHover={{
              scale: 1.05,
              boxShadow: `0 20px 40px ${primaryColor}33`,
            }}
            whileTap={{ scale: 0.95 }}
          >
            Browse Packages
          </motion.a>
          <motion.a
            href="#faq"
            className="px-10 py-4 font-semibold uppercase tracking-wide text-sm rounded-xl border-2 border-white/30 text-white transition-all duration-300"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
          >
            FAQ
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
}