"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AddPackagePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, imageUrl }),
    });

    setLoading(false);
    // Redirect to THIS agency's own public page, read from the session -
    // never hardcoded, so this works correctly for every agency.
    const agencySlug = session?.user?.agencySlug;
    router.push(agencySlug ? `/${agencySlug}` : "/portal");
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Add Package</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full border rounded px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full border rounded px-3 py-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Image URL (optional for now)</label>
          <input className="w-full border rounded px-3 py-2" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="bg-black text-white px-4 py-2 rounded">
          {loading ? "Saving..." : "Save Package"}
        </button>
      </form>
    </div>
  );
}