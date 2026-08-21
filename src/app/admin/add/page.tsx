"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAgencyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D2232A");
  const [publicSiteEnabled, setPublicSiteEnabled] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, city, primaryColor, publicSiteEnabled, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Add Agency</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Agency Display Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Travel Craft Tours"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">
            Agency Slug (used in URL & login — no spaces)
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="travelcraft"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">City (optional)</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Hyderabad"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Brand Color (used on their public site)</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-14 border rounded cursor-pointer"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publicSiteEnabled}
            onChange={(e) => setPublicSiteEnabled(e.target.checked)}
          />
          Enable public website for this agency
        </label>
        <div>
          <label className="block text-sm mb-1">Login Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Login Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Creating..." : "Create Agency"}
        </button>
      </form>
    </div>
  );
}