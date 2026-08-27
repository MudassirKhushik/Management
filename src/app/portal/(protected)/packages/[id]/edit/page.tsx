// src/app/portal/(protected)/packages/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SingleImageUploader from "@/src/components/settings/SingleImageUploader";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPackage() {
      try {
        const res = await fetch(`/api/packages/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setTitle(data.title);
        setDescription(data.description);
        setImageUrl(data.imageUrl || "");
      } catch (err) {
        console.error(err);
        setError("Could not load this package.");
      } finally {
        setLoading(false);
      }
    }
    loadPackage();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, imageUrl }),
      });
      if (!res.ok) throw new Error("Server rejected the update");
      router.push("/portal/packages/manage");
    } catch (err) {
      console.error(err);
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Edit Package</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Package Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={inputClass}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Package Image</label>
              <SingleImageUploader
                section="package"
                currentUrl={imageUrl || null}
                label="Package"
                onChange={(url) => setImageUrl(url)}
              />
            </div>
          </div>
        </section>

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}