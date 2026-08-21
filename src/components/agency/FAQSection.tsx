"use client";

import { useState } from "react";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

const FAQS = [
  {
    q: "What documents do I need for an Umrah visa?",
    a: "A passport valid for at least six months, a recent passport-size photo, and a vaccination certificate where required. We review your documents before submission so nothing gets rejected at the embassy.",
  },
  {
    q: "How far in advance should I book a Hajj or Umrah package?",
    a: "For Hajj, 4–6 months ahead is safest given quota timelines. Umrah is more flexible, but flights and Haram-adjacent hotels fill up fastest during Ramadan — book 6–8 weeks out if you can.",
  },
  {
    q: "Can you arrange group travel for a jamaat or family?",
    a: "Yes — group bookings get a single point of contact, consolidated hotel blocks, and group-rate transport. Tell us your headcount and we'll put a plan together.",
  },
  {
    q: "Do you handle payment in installments?",
    a: "Payment is by bank transfer, and we can discuss a staged schedule for larger packages — ask your agent when you inquire.",
  },
];

export function FAQSection() {
  const { primaryColor } = useAgencyTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 md:py-24 bg-tct-cream">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex justify-between items-center text-left font-semibold hover:bg-black/[0.02] transition-colors"
              >
                {faq.q}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-300 shrink-0 ${openIndex === index ? "rotate-180" : ""}`}
                  style={{ color: primaryColor }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div
                className={`px-6 transition-all duration-300 ease-in-out overflow-hidden ${
                  openIndex === index ? "max-h-40 pb-4 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p style={{ color: "var(--tct-gray)" }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}