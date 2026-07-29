"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Package = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

export default function ManagePackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPackages() {
    setLoading(true);
    // Note: this uses the PROTECTED portal-side listing, which reads
    // the agency from your login session - different from the public
    // /api/packages?agencySlug=... route visitors use.
    const res = await fetch("/api/packages/mine");
    const data = await res.json();
    setPackages(data);
    setLoading(false);
  }

  useEffect(() => {
    loadPackages();
  }, []);

  const filtered = packages.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this package? This cannot be undone.");
    if (!confirmed) return;
    await fetch(`/api/packages/${id}`, { method: "DELETE" });
    loadPackages();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Manage Packages</h1>
        <button
          onClick={() => router.push("/portal/packages/add")}
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          + Add Package
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No packages found.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Title</th>
              <th className="py-2">Description</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2">{p.title}</td>
                <td className="py-2 text-gray-600 max-w-xs truncate">{p.description}</td>
                <td className="py-2 space-x-3">
                  <button
                    onClick={() => router.push(`/portal/packages/${p.id}/edit`)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}