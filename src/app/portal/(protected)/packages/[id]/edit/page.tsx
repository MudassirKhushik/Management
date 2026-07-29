"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPackage() {
      const res = await fetch(`/api/packages/${id}`);
      const data = await res.json();
      setTitle(data.title);
      setDescription(data.description);
      setImageUrl(data.imageUrl || "");
      setLoading(false);
    }
    loadPackage();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch(`/api/packages/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, imageUrl }),
    });

    setSaving(false);
    router.push("/portal/packages/manage");
  }

  if (loading) return <p className="max-w-md mx-auto p-6 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Package</h1>
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
          <label className="block text-sm mb-1">Image URL (optional)</label>
          <input className="w-full border rounded px-3 py-2" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="bg-black text-white px-4 py-2 rounded">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}