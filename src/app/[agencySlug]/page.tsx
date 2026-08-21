// src/app/[agencySlug]/page.tsx
// Updated with proper client component and animations

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Import config data
import { SERVICES, PERKS, FAQS, CAROUSEL_SLIDES } from "@/src/config/agency-data";

// Import UI components
import { AgencyThemeProvider } from "@/src/hooks/useAgencyTheme";

// Import section components
import { HeroCarousel } from "@/src/components/agency/HeroCarousel";
import { PackagesSection } from "@/src/components/agency/PackagesSection";
import { NetworkPerksSection } from "@/src/components/agency/NetworkPerksSection";
import { AboutSection } from "@/src/components/agency/AboutSection";
import { MemoriesSection } from "@/src/components/agency/MemoriesSection";
import { HypeWallSection } from "@/src/components/agency/HypeWallSection";
import { CTASection } from "@/src/components/agency/CTASection";
import { FAQSection } from "@/src/components/agency/FAQSection";

// Types
type Package = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

type AgencyInfo = {
  name: string;
  slug: string;
  city: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
};

export default function HomePage() {
  const params = useParams();
  const agencySlug = params.agencySlug as string;

  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [agency, setAgency] = useState<AgencyInfo | null>(null);

  // Fetch packages
  useEffect(() => {
    async function loadPackages() {
      try {
        const res = await fetch(`/api/packages?agencySlug=${agencySlug}`);
        const data = await res.json();
        setPackages(data);
      } catch (error) {
        console.error("Failed to load packages:", error);
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, [agencySlug]);

  // Fetch agency info
  useEffect(() => {
    async function loadAgency() {
      try {
        const res = await fetch(`/api/agencies/public?agencySlug=${agencySlug}`);
        if (!res.ok) return;
        const data = await res.json();
        setAgency(data);
      } catch (error) {
        console.error("Could not load agency info:", error);
      }
    }
    loadAgency();
  }, [agencySlug]);

  return (
    <AgencyThemeProvider agency={agency}>
      <main style={{ backgroundColor: "var(--tct-white)", color: "var(--tct-black)" }}>
        {/* Global Styles */}
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap");
          :root {
            --tct-black: #121212;
            --tct-red: #d2232a;
            --tct-white: #ffffff;
            --tct-cream: #faf7f2;
            --tct-gray: #6b6b6b;
          }
          body {
            font-family: "Inter", sans-serif;
          }
          .font-display {
            font-family: "Big Shoulders Display", sans-serif;
          }
        `}</style>

        {/* Section 1: Hero Carousel */}
        <HeroCarousel agency={agency} slides={CAROUSEL_SLIDES} services={SERVICES} />

        {/* Section 2: Packages */}
        <PackagesSection 
          packages={packages} 
          loading={loadingPackages} 
          agencySlug={agencySlug} 
        />

        {/* Section 3: Network & Perks */}
        <NetworkPerksSection perks={PERKS} />

        {/* Section 4: About */}
        <AboutSection agency={agency} />

        {/* Section 5: Memories */}
        <MemoriesSection />

        {/* Section 6: Hype Wall */}
        <HypeWallSection />

        {/* Section 7: CTA */}
        <CTASection />

        {/* Section 8: FAQ */}
        <FAQSection faqs={FAQS} />

        {/* Section 9: Footer - Rendered by parent layout */}
      </main>
    </AgencyThemeProvider>
  );
}