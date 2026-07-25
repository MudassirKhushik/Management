"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditTravelerPage() {
  const router = useRouter();
  const params = useParams(); // reads the [id] from the URL
  const id = params.id as string;

  const [name, setName] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // On page load, fetch THIS ONE traveler's current data and fill the form
  useEffect(() => {
    async function loadTraveler() {
      const res = await fetch(`/api/travelers/${id}`);
      const data = await res.json();
      setName(data.name);
      setPeopleCount(data.peopleCount);
      setPrice(String(data.price));
      setLoading(false);
    }
    loadTraveler();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch(`/api/travelers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, peopleCount, price }),
    });

    setSaving(false);
    router.push("/portal/travelers/manage");
  }

  if (loading) {
    return <p className="max-w-md mx-auto p-6 text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Traveler</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">No. of People</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded px-3 py-2"
            value={peopleCount}
            onChange={(e) => setPeopleCount(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Price</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
