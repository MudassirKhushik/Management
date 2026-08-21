"use client";

import { motion } from "framer-motion";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

const PERKS = [
  { icon: "🕌", title: "Umrah Packages", desc: "Guided pilgrimage packages with hotel and transport handled end to end." },
  { icon: "✈️", title: "Flight Bookings", desc: "Domestic and international fares, ticketed through our verified network." },
  { icon: "🏨", title: "Hotel Reservations", desc: "Vetted stays near the Haramain and at every stop on your itinerary." },
  { icon: "📋", title: "Visa Consultation", desc: "Document checklists and application support, explained in plain terms." },
];

export function NetworkPerksSection() {
  const { primaryColor } = useAgencyTheme();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PERKS.map((perk, index) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-tct-cream hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4 text-2xl"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                {perk.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{perk.title}</h3>
              <p style={{ color: "var(--tct-gray)" }}>{perk.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}