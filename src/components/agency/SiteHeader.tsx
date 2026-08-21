// src/components/agency/SiteHeader.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
    <motion.span
      className="font-display text-xl font-black uppercase whitespace-nowrap"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <span style={{ color: "var(--tct-black)" }}>
        {words.join(" ")}
        {words.length ? " " : ""}
      </span>
      <span style={{ color: "var(--tct-red)" }}>{last}</span>
    </motion.span>
  );
}

export default function SiteHeader({ agency }: { agency: AgencyLite }) {
  const navItems = [
    { label: "Packages", href: `/${agency.slug}#packages` },
    { label: "About", href: `/${agency.slug}#about` },
    { label: "Gallery", href: `/${agency.slug}#memories` },
    { label: "FAQ", href: `/${agency.slug}#faq` },
  ];

  return (
    <motion.header
      className="sticky top-0 z-50 border-b-4 bg-white"
      style={{ borderColor: "var(--tct-black)" }}
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
          ) : (
            <BrandWordmark name={agency.name} />
          )}
        </Link>

        <nav className="flex gap-6 text-sm font-semibold uppercase tracking-wide">
          {navItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className="relative hover:text-tct-red transition-colors duration-300"
              >
                {item.label}
                <motion.span
                  className="absolute -bottom-1 left-0 w-full h-0.5 bg-tct-red"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}