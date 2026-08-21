// src/components/agency/HeroCarousel.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { splitName } from "@/src/lib/formatting";

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
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const primaryColor = agency?.primaryColor || "#D2232A";
  const displayName = agency?.name || "";
  const { lead: nameLead, last: nameLast } = splitName(displayName);

  const parsedImages = carouselImages.length > 0
    ? carouselImages
    : slides.map(s => s.image).filter((img): img is string => !!img);

  const hasRealImages = parsedImages.length > 0;
  const images = hasRealImages ? parsedImages : [null];

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, scale: 1.05 },
        {
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
        }
      );
    }
  }, []);

  useEffect(() => {
    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    }
  }, [currentSlide]);

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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.8,
        ease: "easeIn",
      },
    }),
  };

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden h-[85vh] min-h-[560px] max-h-[760px] bg-tct-black"
    >
      <motion.div
        className="absolute top-0 left-0 w-full h-1 z-20"
        style={{ backgroundColor: primaryColor }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <div className="relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0"
          >
            {images[currentSlide] ? (
              <>
                <img
                  src={images[currentSlide]!}
                  alt={displayName}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-tct-black" />
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${primaryColor}22, transparent 60%)`,
                  }}
                  initial={{ opacity: 0, scale: 1.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </>
            )}

            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-20 h-full flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <motion.div
              ref={textRef}
              className="max-w-2xl"
              key={currentSlide}
            >
              {services.length > 0 && (
                <motion.p
                  className="text-xs tracking-[0.25em] uppercase font-semibold mb-4"
                  style={{ color: primaryColor }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  {services.slice(0, 5).join("  •  ")}
                </motion.p>
              )}

              <motion.h1
                className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.95] text-tct-cream mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {nameLead ? `${nameLead} ` : ""}
                <span style={{ color: primaryColor }}>{nameLast}</span>
              </motion.h1>

              <motion.p
                className="text-base md:text-lg max-w-xl mb-8 leading-relaxed"
                style={{ color: "#c4c4c4" }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {displayName} plans Hajj, Umrah, and general tours
                {agency?.city ? ` from ${agency.city}` : ""} — flights, hotels, visas, and
                group travel, handled by people who've done it before.
              </motion.p>

              <motion.a
                href="#packages"
                className="inline-block px-8 py-3.5 font-semibold uppercase tracking-wide text-sm rounded transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl text-white"
                style={{ backgroundColor: primaryColor }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View Packages
              </motion.a>
            </motion.div>
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <>
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {images.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => goToSlide(index)}
                className="transition-all duration-300 rounded-full focus:outline-none"
                style={{
                  width: currentSlide === index ? "36px" : "10px",
                  height: "10px",
                  backgroundColor: currentSlide === index ? primaryColor : "rgba(255,255,255,0.35)",
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </motion.div>

          <motion.button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white transition-all duration-300 text-3xl focus:outline-none w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10"
            whileHover={{ scale: 1.2, x: -5 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Previous slide"
          >
            ‹
          </motion.button>
          <motion.button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white transition-all duration-300 text-3xl focus:outline-none w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10"
            whileHover={{ scale: 1.2, x: 5 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Next slide"
          >
            ›
          </motion.button>
        </>
      )}
    </section>
  );
}