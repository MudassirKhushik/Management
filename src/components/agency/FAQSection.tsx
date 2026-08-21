// src/components/agency/FAQSection.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

gsap.registerPlugin(ScrollTrigger);

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
  const faqRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    faqRefs.current.forEach((ref, index) => {
      if (ref) {
        gsap.fromTo(
          ref,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: index * 0.1,
            scrollTrigger: {
              trigger: ref,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    });
  }, [faqs]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section id="faq" className="max-w-4xl mx-auto px-6 py-24">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            className="text-sm font-semibold uppercase tracking-[0.3em]"
            style={{ color: primaryColor || "#D2232A" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            FAQ
          </motion.span>
          <motion.h2
            className="font-display text-4xl md:text-5xl font-black mt-4 mb-6"
            variants={itemVariants}
          >
            Good to Know
          </motion.h2>
          <motion.p
            className="text-gray-600 text-lg"
            variants={itemVariants}
          >
            Quick answers to the most common questions about our services.
          </motion.p>
        </motion.div>
      </motion.div>

      <motion.div
        className="space-y-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        {faqs.map((item, i) => (
          <motion.div
            key={i}
            ref={(el) => { faqRefs.current[i] = el; }}
            variants={itemVariants}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            style={{
              borderLeft: openFaq === i ? `4px solid ${primaryColor || "#D2232A"}` : "4px solid transparent",
            }}
          >
            <button
              type="button"
              className="w-full text-left px-6 py-5 flex justify-between items-center font-semibold text-lg transition-colors duration-300 hover:bg-gray-50"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                {item.q}
              </motion.span>
              <motion.span
                className="text-2xl font-light transition-transform duration-300 ml-4"
                style={{ color: primaryColor || "#D2232A" }}
                animate={{
                  rotate: openFaq === i ? 45 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                +
              </motion.span>
            </button>
            <AnimatePresence>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    transition: {
                      height: { duration: 0.3, ease: "easeInOut" },
                      opacity: { duration: 0.3, delay: 0.1 },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: { duration: 0.3, ease: "easeInOut" },
                      opacity: { duration: 0.2 },
                    },
                  }}
                >
                  <motion.p
                    className="px-6 pb-6 text-gray-600 leading-relaxed"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.a}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}