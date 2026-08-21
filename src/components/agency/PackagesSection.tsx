// src/components/agency/PackagesSection.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

gsap.registerPlugin(ScrollTrigger);

type Package = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

interface PackagesSectionProps {
  packages: Package[];
  loading: boolean;
  agencySlug: string;
}

export function PackagesSection({ packages, loading, agencySlug }: PackagesSectionProps) {
  const { primaryColor } = useAgencyTheme();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current && packages.length > 0) {
      const cards = gridRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  }, [packages]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <motion.div
                className="h-64 bg-tct-surface/10 rounded-2xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="mt-4 h-6 bg-tct-surface/10 rounded w-3/4" />
              <div className="mt-2 h-4 bg-tct-surface/10 rounded w-full" />
              <div className="mt-2 h-4 bg-tct-surface/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="packages" className="max-w-7xl mx-auto px-6 py-24 overflow-hidden">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <motion.div variants={cardVariants} className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            className="text-sm font-semibold uppercase tracking-[0.3em]"
            style={{ color: primaryColor || "#D2232A" }}
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Featured Packages
          </motion.span>
          <motion.h2
            className="font-display text-4xl md:text-5xl font-black mt-4 mb-6"
            variants={cardVariants}
          >
            Choose Your Journey
          </motion.h2>
          <motion.p
            className="text-lg"
            style={{ color: "var(--tct-gray)" }}
            variants={cardVariants}
          >
            Each package is carefully crafted to provide the perfect balance of comfort,
            value, and spiritual fulfillment.
          </motion.p>
        </motion.div>
      </motion.div>

      {packages.length === 0 ? (
        <motion.div
          className="border-2 border-dashed rounded-2xl p-16 text-center"
          style={{ borderColor: primaryColor || "#D2232A" }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="text-lg" style={{ color: "var(--tct-gray)" }}>
            No packages published yet. Add your first package from the portal to see it here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              variants={cardVariants}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="relative h-64 overflow-hidden">
                {pkg.imageUrl ? (
                  <motion.img
                    src={pkg.imageUrl}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.7 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-tct-cream">
                    <span className="text-4xl">🕌</span>
                  </div>
                )}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  whileHover={{ opacity: 1 }}
                />
              </div>

              <motion.div
                className="p-6"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.h3
                  className="font-display text-2xl font-bold uppercase mb-3"
                  whileHover={{ x: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  {pkg.title}
                </motion.h3>
                <p className="text-sm leading-relaxed line-clamp-3 mb-6" style={{ color: "var(--tct-gray)" }}>
                  {pkg.description}
                </p>

                <div className="flex gap-3">
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={`/${agencySlug}/packages/${pkg.id}`}
                      className="block text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide rounded-xl border-2 transition-all duration-300 hover:bg-black/[0.03]"
                      style={{ borderColor: "var(--tct-black)", color: "var(--tct-black)" }}
                    >
                      Details
                    </Link>
                  </motion.div>
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={`/${agencySlug}/book/${pkg.id}`}
                      className="block text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide rounded-xl text-white transition-all duration-300 hover:shadow-lg"
                      style={{ backgroundColor: primaryColor || "#D2232A" }}
                    >
                      Book Now
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}