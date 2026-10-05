"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass = "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function AddVendorPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, country, address, isActive }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Could not save vendor"); }
      router.push("/portal/vendors/manage");
    } catch (err: any) {
      setError(err.message || "Could not save vendor.");
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Add Vendor</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className={labelClass}>Vendor Name *</label>
          <input type="text" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input type="text" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input type="text" className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <textarea className={inputClass} rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <label className={labelClass} style={{ marginBottom: 0 }}>Status</label>
          <button type="button" onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? "" : "bg-gray-200"}`}
            style={isActive ? { backgroundColor: "var(--agency-color)" } : undefined}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <p className="text-[11px] text-gray-400 -mt-2">{isActive ? "Active — selectable on new bookings." : "Inactive — hidden from the vendor picker."}</p>

        <p className="text-[11px] text-gray-400">Vendor ID is generated automatically once saved, and can't be changed afterward.</p>

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        <button type="submit" className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }} disabled={saving}>
          {saving ? "Saving..." : "Save Vendor"}
        </button>
      </form>
    </div>
  );
}