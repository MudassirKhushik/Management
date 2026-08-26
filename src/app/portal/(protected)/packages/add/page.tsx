// src/app/portal/(protected)/packages/add/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

const PACKAGE_LIMIT = 20;

export default function AddPackagePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadCount() {
      try {
        const res = await fetch("/api/packages/mine");
        if (!res.ok) return;
        const data = await res.json();
        setCount(Array.isArray(data) ? data.length : null);
      } catch {
        // Non-critical — the server enforces the real limit regardless.
      }
    }
    loadCount();
  }, []);

  const atLimit = count !== null && count >= PACKAGE_LIMIT;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, imageUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Server rejected the package");
      }

      // Redirect to THIS agency's own public page, read from the session —
      // never hardcoded, so this works correctly for every agency.
      const agencySlug = session?.user?.agencySlug;
      router.push(agencySlug ? `/${agencySlug}` : "/portal");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save this package. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Add Package</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Package Details
          </h2>

          {count !== null && (
            <p className="text-xs text-gray-400 mb-4">
              {count} / {PACKAGE_LIMIT} packages used
            </p>
          )}

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
              <label className={labelClass}>Image URL</label>
              <input
                className={inputClass}
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
        </section>

        {atLimit && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm font-medium">
            You've reached the maximum of {PACKAGE_LIMIT} packages. Remove one from Manage Packages before
            adding another.
          </p>
        )}
        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={loading || atLimit}
        >
          {loading ? "Saving..." : "Save Package"}
        </button>
      </form>
    </div>
  );
}