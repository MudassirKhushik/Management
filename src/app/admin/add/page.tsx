"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BRAND = "#D2232A";

export default function AddAgencyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D2232A");
  const [publicSiteEnabled, setPublicSiteEnabled] = useState(true);
  const [customDomain, setCustomDomain] = useState(""); // Naya State Add Kiya
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Custom domain ko clean karne ke liye (space remove aur lowercase karna lazmi hai)
    const cleanDomain = customDomain.trim().toLowerCase() || null;

    const res = await fetch("/api/admin/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // API Body me cleanDomain ko 'customDomain' key ke sath bhej rahe hain
      body: JSON.stringify({ 
        name, 
        slug, 
        city, 
        primaryColor, 
        publicSiteEnabled, 
        customDomain: cleanDomain, 
        email, 
        password 
      }),
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
        
        {/* ================= NAYA CUSTOM DOMAIN INPUT FIELD ================= */}
        <div>
          <label className="block text-sm mb-1 font-medium text-gray-700">
            Custom Domain (optional)
          </label>
          <input
            className="w-full border rounded px-3 py-2 border-amber-500 bg-amber-50/10 placeholder-gray-400"
            placeholder="e.g., binmasoodtravels.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Bina http:// ya www ke likhein (e.g., agencyA.com). Khali chorne par default slug chalega.
          </p>
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
          className="text-white px-4 py-2 rounded w-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: BRAND }}
        >
          {loading ? "Creating..." : "Create Agency"}
        </button>
      </form>
    </div>
  );
}
