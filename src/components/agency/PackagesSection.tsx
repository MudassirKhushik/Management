// src/components/agency/PackagesSection.tsx

"use client";

import Link from "next/link";
import { Reveal } from "@/src/components/ui/Reveal";
import { useAgencyTheme } from "@/src/hooks/useAgencyTheme";

type Package = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

interface PackagesSectionProps {
  packages: Package[];
  loading: boolean;
  agencySlug: string;
}

export function PackagesSection({ packages, loading, agencySlug }: PackagesSectionProps) {
  const { primaryColor } = useAgencyTheme();

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-tct-surface/10 rounded-2xl" />
              <div className="mt-4 h-6 bg-tct-surface/10 rounded w-3/4" />
              <div className="mt-2 h-4 bg-tct-surface/10 rounded w-full" />
              <div className="mt-2 h-4 bg-tct-surface/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="packages" className="max-w-7xl mx-auto px-6 py-24">
      <Reveal>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
            Featured Packages
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-black mt-4 mb-6">
            Choose Your Journey
          </h2>
          <p className="text-lg" style={{ color: "var(--tct-gray)" }}>
            Each package is carefully crafted to provide the perfect balance of comfort,
            value, and spiritual fulfillment.
          </p>
        </div>
      </Reveal>

      {packages.length === 0 ? (
        <div className="border-2 border-dashed rounded-2xl p-16 text-center" style={{ borderColor: primaryColor }}>
          <p className="text-lg" style={{ color: "var(--tct-gray)" }}>
            No packages published yet. Add your first package from the portal to see it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg, i) => (
            <Reveal key={pkg.id} delay={Math.min(i, 3) * 100}>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="relative h-64 overflow-hidden">
                  {pkg.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pkg.imageUrl}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-tct-cream">
                      <span className="text-4xl">🕌</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-6">
                  <h3 className="font-display text-2xl font-bold uppercase mb-3 group-hover:translate-x-2 transition-transform duration-300">
                    {pkg.title}
                  </h3>
                  <p className="text-sm leading-relaxed line-clamp-3 mb-6" style={{ color: "var(--tct-gray)" }}>
                    {pkg.description}
                  </p>

                  <div className="flex gap-3">
                    <Link
                      href={`/${agencySlug}/packages/${pkg.id}`}
                      className="flex-1 text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide rounded-xl border-2 transition-all duration-300 hover:bg-black/[0.03]"
                      style={{ borderColor: "var(--tct-black)", color: "var(--tct-black)" }}
                    >
                      Details
                    </Link>
                    <Link
                      href={`/${agencySlug}/book/${pkg.id}`}
                      className="flex-1 text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide rounded-xl text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}