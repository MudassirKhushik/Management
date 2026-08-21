// src/components/agency/FAQSection.tsx
// Updated with Framer Motion

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/src/components/ui/Reveal";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

interface FAQ {
  q: string;
  a: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { primaryColor } = useAgencyTheme();

  return (
    <section id="faq" className="max-w-4xl mx-auto px-6 py-24">
      <Reveal>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span 
            className="text-sm font-semibold uppercase tracking-[0.3em]"
            style={{ color: primaryColor }}
          >
            FAQ
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black mt-4 mb-6">
            Good to Know
          </h2>
          <p className="text-gray-600 text-lg">
            Quick answers to the most common questions about our services.
          </p>
        </div>
      </Reveal>

      <div className="space-y-4">
        {faqs.map((item, i) => (
          <Reveal key={i} delay={i * 75}>
            <div 
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ borderLeft: openFaq === i ? `4px solid ${primaryColor}` : "4px solid transparent" }}
            >
              <button
                type="button"
                className="w-full text-left px-6 py-5 flex justify-between items-center font-semibold text-lg transition-colors duration-300 hover:bg-gray-50"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span>{item.q}</span>
                <motion.span 
                  className="text-2xl font-light ml-4"
                  style={{ color: primaryColor }}
                  animate={{ rotate: openFaq === i ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <p className="px-6 pb-6 text-gray-600 leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}