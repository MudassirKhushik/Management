// src/components/agency/HeroCarousel.tsx
//
// Redesigned: red is now used in exactly 3 places (accent bar, agency-name last
// word, CTA button + active dot) instead of five, and service tags no longer get
// a red-tinted background/border — neutral outline instead, so the brand color
// reads as a sharp accent rather than a wash across the whole section.
//
// Fake per-slide marketing copy ("Sacred Journeys", "Global Travel", etc.) and the
// random multi-hue gradient rotation (red/blue/purple/emerald/amber/indigo) were
// removed — they had nothing to do with the actual agency and were the biggest
// contributor to the "childish/templated" feel. If real carouselImages are passed
// in, only the IMAGE rotates; the text content (agency name, tagline, CTA) stays
// consistent across slides. If no images are provided at all, this renders a
// single static hero with no dots/arrows — an honest state instead of faking a
// carousel with nothing to show.

"use client";

import { useState, useEffect, useCallback } from "react";
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
}

export function HeroCarousel({ agency, services, carouselImages = [] }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const primaryColor = agency?.primaryColor || "#D2232A";
  const displayName = agency?.name || "";
  const { lead: nameLead, last: nameLast } = splitName(displayName);

  const hasRealImages = carouselImages && carouselImages.length > 0;
  const images = hasRealImages ? carouselImages : [null]; // single "no image" slide

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

  return (
    <section className="relative overflow-hidden h-[85vh] min-h-[560px] max-h-[760px] bg-tct-black">
      {/* single brand accent bar — the ONLY full-width use of red */}
      <div className="absolute top-0 left-0 w-full h-1 z-20" style={{ backgroundColor: primaryColor }} />

      <div className="relative w-full h-full">
        {images.map((imageUrl, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={displayName} className="absolute inset-0 w-full h-full object-cover" />
                {/* one consistent dark overlay, not a rotating rainbow of gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-tct-black" />
                {/* single subtle red glow instead of a flat fill */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${primaryColor}22, transparent 60%)`,
                  }}
                />
              </>
            )}

            {/* faint dotted texture, echoes the logo's watermark — same on every slide */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />
          </div>
        ))}

        {/* content — identical across every slide, only the background image changes */}
        <div className="relative z-20 h-full flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              {services.length > 0 && (
                <p
                  className="text-xs tracking-[0.25em] uppercase font-semibold mb-4"
                  style={{ color: primaryColor }}
                >
                  {services.slice(0, 5).join("  •  ")}
                </p>
              )}

              <h1 className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.95] text-tct-cream mb-6">
                {nameLead ? `${nameLead} ` : ""}
                <span style={{ color: primaryColor }}>{nameLast}</span>
              </h1>

              <p className="text-base md:text-lg max-w-xl mb-8 leading-relaxed" style={{ color: "#c4c4c4" }}>
                {displayName} plans Hajj, Umrah, and general tours
                {agency?.city ? ` from ${agency.city}` : ""} — flights, hotels, visas, and
                group travel, handled by people who've done it before.
              </p>

              <a
                href="#packages"
                className="inline-block px-8 py-3.5 font-semibold uppercase tracking-wide text-sm rounded transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl text-white"
                style={{ backgroundColor: primaryColor }}
              >
                View Packages
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* dots + arrows only render when there's more than one real image to switch between */}
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

          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white transition-all duration-300 text-3xl focus:outline-none hover:scale-125 w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white transition-all duration-300 text-3xl focus:outline-none hover:scale-125 w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}