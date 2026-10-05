"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/src/components/ui/Spinner";
import VendorPaymentHistorySection from "@/src/components/booking/VendorPaymentHistorySection";

const inputClass = "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function VendorEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vendorCode, setVendorCode] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", country: "", address: "", isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/vendors/${id}`);
    if (res.ok) {
      const data = await res.json();
      setVendorCode(data.vendorCode || "");
      setForm({ name: data.name, phone: data.phone || "", email: data.email || "", country: data.country || "", address: data.address || "", isActive: data.isActive });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/vendors/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) router.push(`/portal/vendors/${id}/view`);
  }

  if (loading) return <Spinner label="Loading vendor..." />;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Edit Vendor</h1>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 mb-5">
        <div>
          <label className={labelClass}>Vendor ID</label>
          <input className={`${inputClass} bg-gray-100 text-gray-500`} value={vendorCode || "—"} disabled />
        </div>
        <div><label className={labelClass}>Name</label><input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div><label className={labelClass}>Phone</label><input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
        <div><label className={labelClass}>Email</label><input className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
        <div><label className={labelClass}>Country</label><input className={inputClass} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} /></div>
        <div><label className={labelClass}>Address</label><textarea className={inputClass} rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
        
        <div className="flex items-center justify-between">
          <label className={labelClass} style={{ marginBottom: 0 }}>Status</label>
          <button type="button" onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "" : "bg-gray-200"}`}
            style={form.isActive ? { backgroundColor: "var(--agency-color)" } : undefined}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        
        <button type="submit" disabled={saving} className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "var(--agency-color)" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Replaced old record payment card with the unified global history section */}
      <div className="mt-5">
        <VendorPaymentHistorySection vendorId={id} />
      </div>
    </div>
  );
}
