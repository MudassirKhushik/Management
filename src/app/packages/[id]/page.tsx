"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Package = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

export default function PackageDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPackage() {
      // We don't have a single-package API route yet, so we fetch
      // the full list and pick the one we need. Fine for a small
      // number of packages; we can add a dedicated /api/packages/[id]
      // route later if the list grows large.
      const res = await fetch("/api/packages");
      const all: Package[] = await res.json();
      const found = all.find((p) => p.id === id) || null;
      setPkg(found);
      setLoading(false);
    }
    loadPackage();
  }, [id]);

  if (loading) return <p className="max-w-2xl mx-auto p-6 text-gray-500">Loading...</p>;
  if (!pkg) return <p className="max-w-2xl mx-auto p-6 text-gray-500">Package not found.</p>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      {pkg.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className="w-full h-64 object-cover rounded mb-4"
        />
      )}
      <h1 className="text-2xl font-bold mb-2">{pkg.title}</h1>
      <p className="text-gray-700 mb-6">{pkg.description}</p>

      <Link
        href={`/book/${pkg.id}`}
        className="inline-block bg-black text-white px-4 py-2 rounded"
      >
        Book Package
      </Link>
    </main>
  );
}
