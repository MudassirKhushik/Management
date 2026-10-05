"use client";

import { useEffect, useState } from "react";

type Vendor = { id: string; name: string; isActive: boolean };

const inputClass = "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";

export default function VendorSelect({ value, onChange }: { value: string; onChange: (vendorId: string) => void }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vendors")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVendors(data.filter((v: any) => v.isActive)))
      .catch(() => {});
  }, []);

  async function handleAddVendor() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setVendors((v) => [...v, created]);
        onChange(created.id);
        setNewName("");
        setAdding(false);
      } else {
        const err = await res.json();
        alert(err.error || "Could not add vendor.");
      }
    } catch {
      alert("Could not add vendor.");
    } finally {
      setSaving(false);
    }
  }

  if (adding) {
    return (
      <div className="flex gap-2">
        <input type="text" className={inputClass} placeholder="New vendor name" value={newName}
          onChange={(e) => setNewName(e.target.value)} autoFocus />
        <button type="button" className="rounded-lg px-3 text-sm font-semibold text-white whitespace-nowrap"
          style={{ backgroundColor: "var(--agency-color)" }} onClick={handleAddVendor} disabled={saving}>
          {saving ? "..." : "Save"}
        </button>
        <button type="button" className="rounded-lg px-3 text-sm font-semibold border border-gray-200" onClick={() => setAdding(false)}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <select className={inputClass} value={value}
      onChange={(e) => (e.target.value === "__add_new__" ? setAdding(true) : onChange(e.target.value))}>
      <option value="">Select vendor</option>
      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
      <option value="__add_new__">+ Add new vendor…</option>
    </select>
  );
}