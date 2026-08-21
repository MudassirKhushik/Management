// src/components/agency/HeroCarousel.tsx
// Updated with Framer Motion and GSAP for smooth transitions

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { splitName } from "@/src/lib/formatting";
import { gsap } from "gsap";

interface AgencyInfo {
  name: string;
  slug: string;
  city: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  carouselImages?: string[] | null;
}

interface HeroCarouselProps {
  agency: AgencyInfo | null;
  services: string[];
  carouselImages?: string[];
  slides?: Array<{
    id: number;
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    image?: string;
    gradient?: string;
  }>;
}

export function HeroCarousel({ agency, services, carouselImages = [], slides = [] }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const primaryColor = agency?.primaryColor || "#D2232A";
  const displayName = agency?.name || "";
  const { lead: nameLead, last: nameLast } = splitName(displayName);

  const parsedImages = carouselImages.length > 0 
    ? carouselImages 
    : slides.map(s => s.image).filter((img): img is string => !!img);

  const hasRealImages = parsedImages.length > 0;
  const images = hasRealImages ? parsedImages : [null];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (images.length <= 1) return;
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide, images.length]);

  // GSAP animation for content entrance
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, [currentSlide]);

  return (
    <section className="relative overflow-hidden h-[85vh] min-h-[560px] max-h-[760px] bg-tct-black">
      <div className="absolute top-0 left-0 w-full h-1 z-20" style={{ backgroundColor: primaryColor }} />

      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0"
          >
            {images[currentSlide] ? (
              <>
                <img 
                  src={images[currentSlide]!} 
                  alt={displayName} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-tct-black" />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${primaryColor}22, transparent 60%)`,
                  }}
                />
              </>
            )}

            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />
          </motion.div>
        </AnimatePresence>

        <div ref={contentRef} className="relative z-20 h-full flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              {services.length > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-xs tracking-[0.25em] uppercase font-semibold mb-4"
                  style={{ color: primaryColor }}
                >
                  {services.slice(0, 5).join("  •  ")}
                </motion.p>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.95] text-tct-cream mb-6"
              >
                {nameLead ? `${nameLead} ` : ""}
                <span style={{ color: primaryColor }}>{nameLast}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-base md:text-lg max-w-xl mb-8 leading-relaxed"
                style={{ color: "#c4c4c4" }}
              >
                {displayName} plans Hajj, Umrah, and general tours
                {agency?.city ? ` from ${agency.city}` : ""} — flights, hotels, visas, and
                group travel, handled by people who've done it before.
              </motion.p>

              <motion.a
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                href="#packages"
                className="inline-block px-8 py-3.5 font-semibold uppercase tracking-wide text-sm rounded transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl text-white"
                style={{ backgroundColor: primaryColor }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View Packages
              </motion.a>
            </div>
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="transition-all duration-300 rounded-full focus:outline-none hover:scale-110"
                style={{
                  width: currentSlide === index ? "36px" : "10px",
                  height: "10px",
                  backgroundColor: currentSlide === index ? primaryColor : "rgba(255,255,255,0.35)",
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <motion.button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white transition-all duration-300 text-3xl focus:outline-none hover:scale-125 w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Previous slide"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            ‹
          </motion.button>
          <motion.button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white transition-all duration-300 text-3xl focus:outline-none hover:scale-125 w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Next slide"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            ›
          </motion.button>
        </>
      )}
    </section>
  );
}