"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Traveler = {
  id: string;
  name: string;
  peopleCount: number;
  price: number;
};

export default function ManageTravelersPage() {
  const router = useRouter();
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch the full list once when the page loads
  async function loadTravelers() {
    setLoading(true);
    const res = await fetch("/api/travelers");
    const data = await res.json();
    setTravelers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTravelers();
  }, []);

  // Search filters the LIST WE ALREADY HAVE in memory — no need to
  // ask the database again on every keystroke. Fine for small lists;
  // if this grows to thousands of rows later, we'd move filtering
  // to the API instead.
  const filtered = travelers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this traveler? This cannot be undone."
    );
    if (!confirmed) return;

    await fetch(`/api/travelers/${id}`, { method: "DELETE" });
    // Refresh the list from the database so we always show real, current data
    loadTravelers();
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Manage Travelers</h1>
        <button
          onClick={() => router.push("/portal/travelers/add")}
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          + Add Traveler
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4"
      />

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No travelers found.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th className="py-2">People</th>
              <th className="py-2">Price</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="py-2">{t.name}</td>
                <td className="py-2">{t.peopleCount}</td>
                <td className="py-2">{t.price}</td>
                <td className="py-2 space-x-3">
                  <button
                    onClick={() =>
                      router.push(`/portal/travelers/${t.id}/edit`)
                    }
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
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
