"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BRAND = "#D2232A";

export default function EditAgencyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#D2232A");
  const [publicSiteEnabled, setPublicSiteEnabled] = useState(true);
  const [customDomain, setCustomDomain] = useState(""); // Naya state consistent variable keep karne ke liye
  const [loginEmail, setLoginEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/agencies/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setName(data.name || "");
        setSlug(data.slug || "");
        setCity(data.city || "");
        setPrimaryColor(data.primaryColor || "#D2232A");
        setPublicSiteEnabled(data.publicSiteEnabled ?? true);
        setCustomDomain(data.customDomain || ""); // Prefill custom domain from DB
        setLoginEmail(data.users?.[0]?.email || "—");
      } catch (err) {
        console.error(err);
        setError("Could not load this agency.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    // String formatting clean up, save string format directly
    const cleanDomain = customDomain.trim().toLowerCase() || null;

    try {
      const res = await fetch(`/api/admin/agencies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Added customDomain directly to update object matching layout structure
        body: JSON.stringify({ 
          name, 
          city, 
          primaryColor, 
          publicSiteEnabled,
          customDomain: cleanDomain 
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="max-w-md mx-auto p-6 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Agency</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Agency Display Name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Agency Slug</label>
          <input
            className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
            value={slug}
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">
            Not editable — changing it would break any public links already shared for this agency.
          </p>
        </div>

        {/* ================= DYNAMIC DOMAIN EDIT INTEGRATION ROW ================= */}
        <div>
          <label className="block text-sm mb-1 font-medium text-gray-700">Custom Domain</label>
          <input
            className="w-full border rounded px-3 py-2 border-amber-500 bg-amber-50/10 placeholder-gray-400"
            placeholder="e.g., binmasoodtravels.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            Bina http:// ya www ke daalein (e.g., binmasood.com). Domain hatane ke liye field ko khali chorh dein.
          </p>
        </div>

        <div>
          <label className="block text-sm mb-1">City (optional)</label>
          <input
            className="w-full border rounded px-3 py-2"
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
            className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
            value={loginEmail}
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">
            Login credentials aren't editable here yet — that's a future addition if needed.
          </p>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="flex-1 border rounded px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 text-white px-4 py-2 rounded disabled:opacity-50 font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
