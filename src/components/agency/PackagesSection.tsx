"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
      <section id="packages" className="py-16 md:py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-tct-cream rounded-xl" />
              <div className="mt-4 h-6 bg-tct-cream rounded w-3/4" />
              <div className="mt-2 h-4 bg-tct-cream rounded w-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="packages" className="py-16 md:py-24 bg-tct-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: primaryColor }}>
            Featured Packages
          </span>
          <h2 className="text-3xl font-bold mt-3 mb-4">Curated Travel Packages</h2>
          <p style={{ color: "var(--tct-gray)" }}>Handpicked experiences designed to inspire and delight</p>
        </div>

        {packages.length === 0 ? (
          <div className="border-2 border-dashed rounded-2xl p-16 text-center" style={{ borderColor: primaryColor }}>
            <p style={{ color: "var(--tct-gray)" }}>
              No packages published yet. Add your first package from the portal to see it here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(index, 3) * 0.1 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="h-48 bg-gray-200 relative flex items-center justify-center overflow-hidden">
                  {pkg.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-sm">No image</span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{pkg.title}</h3>
                  <p className="text-sm mb-4 line-clamp-3" style={{ color: "var(--tct-gray)" }}>
                    {pkg.description}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/${agencySlug}/packages/${pkg.id}`}
                      className="flex-1 text-center py-2 rounded-lg font-medium text-sm border-2 hover:bg-black/[0.03] transition"
                      style={{ borderColor: "var(--tct-black)" }}
                    >
                      Details
                    </Link>
                    <Link
                      href={`/${agencySlug}/book/${pkg.id}`}
                      className="flex-1 text-center py-2 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}