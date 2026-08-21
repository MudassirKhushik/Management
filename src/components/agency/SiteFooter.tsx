// src/components/agency/SiteFooter.tsx
"use client";

import { motion } from "framer-motion";

type AgencyLite = { slug: string; name: string };

const SERVICES = [
  "Umrah Packages",
  "Flight Bookings",
  "Hotel Reservations",
  "Visa Consultation",
  "Honeymoon Packages",
  "Group Tours",
  "Pilgrimage",
];

export default function SiteFooter({ agency }: { agency: AgencyLite }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.footer
      className="border-t-4 py-12 px-6"
      style={{ borderColor: "var(--tct-red)", backgroundColor: "var(--tct-black)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex flex-col md:flex-row justify-between gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={itemVariants}>
            <motion.h3
              className="font-display text-2xl font-black uppercase text-white mb-2"
              whileHover={{ scale: 1.02, x: 5 }}
              transition={{ duration: 0.3 }}
            >
              {agency.name}
            </motion.h3>
            <motion.p
              className="text-sm"
              style={{ color: "#999999" }}
              variants={itemVariants}
            >
              Crafting Your Dream Trip
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-x-8 gap-y-2 text-sm"
            style={{ color: "#cccccc" }}
            variants={containerVariants}
          >
            {SERVICES.map((s) => (
              <motion.span
                key={s}
                variants={itemVariants}
                whileHover={{ scale: 1.05, color: "#ffffff" }}
                transition={{ duration: 0.2 }}
              >
                {s}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        <motion.p
          className="mt-8 pt-6 border-t text-xs"
          style={{ borderColor: "#333333", color: "#777777" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          © {new Date().getFullYear()} {agency.name}. All rights reserved.
        </motion.p>
      </div>
    </motion.footer>
  );
}