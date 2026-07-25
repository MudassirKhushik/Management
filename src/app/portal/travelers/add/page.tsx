"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddTravelerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/travelers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, peopleCount, price }),
    });

    setLoading(false);
    router.push("/portal/travelers/manage"); // step 2 target
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Add Traveler</h1>
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
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Saving..." : "Save Traveler"}
        </button>
      </form>
    </div>
  );
}