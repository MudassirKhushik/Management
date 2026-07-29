"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
 
type Package = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};
 
export default function HomePage() {
  const params = useParams();
  const agencySlug = params.agencySlug as string;
 
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    async function loadPackages() {
      const res = await fetch(`/api/packages?agencySlug=${agencySlug}`);
      const data = await res.json();
      setPackages(data);
      setLoading(false);
    }
    loadPackages();
  }, [agencySlug]);
 
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 capitalize">{agencySlug}</h1>
 
      {loading ? (
        <p className="text-gray-500">Loading packages...</p>
      ) : packages.length === 0 ? (
        <p className="text-gray-500">No packages available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="border rounded-lg overflow-hidden flex flex-col">
              {pkg.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pkg.imageUrl} alt={pkg.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  No image
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <h2 className="font-semibold mb-1">{pkg.title}</h2>
                <p className="text-sm text-gray-600 flex-1 line-clamp-3">{pkg.description}</p>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/${agencySlug}/packages/${pkg.id}`}
                    className="flex-1 text-center border rounded px-3 py-2 text-sm"
                  >
                    Show Details
                  </Link>
                  <Link
                    href={`/${agencySlug}/book/${pkg.id}`}
                    className="flex-1 text-center bg-black text-white rounded px-3 py-2 text-sm"
                  >
                    Book Package
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}