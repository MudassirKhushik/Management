// src/components/agency/SiteHeader.tsx
// Updated with Framer Motion

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type AgencyLite = {
  slug: string;
  name: string;
  city: string | null;
  logoUrl?: string | null;
};

function BrandWordmark({ name }: { name: string }) {
  const words = name.trim().split(/\s+/);
  const last = words.pop() || name;
  return (
    <span className="font-display text-xl font-black uppercase whitespace-nowrap">
      <span style={{ color: "var(--tct-black)" }}>
        {words.join(" ")}
        {words.length ? " " : ""}
      </span>
      <span style={{ color: "var(--tct-red)" }}>{last}</span>
    </span>
  );
}

export default function SiteHeader({ agency }: { agency: AgencyLite }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      className={`sticky top-0 z-50 border-b-4 transition-shadow duration-300 ${
        isScrolled ? "shadow-lg" : ""
      }`}
      style={{ borderColor: "var(--tct-black)", backgroundColor: "white" }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href={`/${agency.slug}`} className="flex items-center gap-2">
          {agency.logoUrl ? (
            <motion.img
              src={agency.logoUrl}
              alt={agency.name}
              className="h-10 w-auto"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <BrandWordmark name={agency.name} />
            </motion.div>
          )}
        </Link>

        <nav className="flex gap-6 text-sm font-semibold uppercase tracking-wide">
          {["Packages", "About", "Gallery", "FAQ"].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/${agency.slug}#${item.toLowerCase()}`}
                className="hover:opacity-70 transition-opacity"
              >
                {item}
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}