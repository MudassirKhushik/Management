// src/app/portal/(protected)/transport-bookings/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { TransportRow, VEHICLE_TYPES, emptyTransportRow } from "@/src/lib/transportBookingTypes";
import { sumLineItems } from "@/src/lib/pricingCalculations";

export default function AddTransportBookingPage() {
  const router = useRouter();
  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [segments, setSegments] = useState<TransportRow[]>([emptyTransportRow()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateRow(id: string, field: keyof TransportRow, value: string | number) {
    setSegments((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setSegments((rows) => [...rows, emptyTransportRow()]);
  }

  function removeRow(id: string) {
    setSegments((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  const { grossBuying, grossSelling } = sumLineItems(
    segments.map((row) => ({ buyingCost: row.buyingCost, sellingPrice: row.sellingPrice }))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/transport-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, segments }),
      });

      if (!res.ok) throw new Error("Server rejected the booking");

      router.push("/portal/transport-bookings/manage");
    } catch (err) {
      console.error(err);
      setError("Could not save the booking. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Add Transport Booking</h1>

      <form onSubmit={handleSubmit}>
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <fieldset className="border p-4 mb-4">
          <legend className="font-bold px-1">Transport Segments</legend>

          {segments.map((row, index) => (
            <div key={row.id} className="border p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <strong>Segment {index + 1}</strong>
                <button type="button" className="border px-2" onClick={() => removeRow(row.id)}>
                  Remove
                </button>
              </div>

              <div className="mb-2">
                <label className="block">Vehicle</label>
                <select
                  className="border p-2 w-full"
                  value={row.vehicle}
                  onChange={(e) => updateRow(row.id, "vehicle", e.target.value)}
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block">Sector (e.g. Jeddah to Makkah)</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.sector}
                  onChange={(e) => updateRow(row.id, "sector", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Pickup Date</label>
                <input
                  type="date"
                  className="border p-2 w-full"
                  value={row.pickupDate}
                  onChange={(e) => updateRow(row.id, "pickupDate", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Pickup Time</label>
                <input
                  type="time"
                  className="border p-2 w-full"
                  value={row.pickupTime}
                  onChange={(e) => updateRow(row.id, "pickupTime", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Quantity</label>
                <input
                  type="number"
                  min={1}
                  className="border p-2 w-full"
                  value={row.qty}
                  onChange={(e) => updateRow(row.id, "qty", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="mb-2">
                <label className="block">Buying Cost (Total)</label>
                <input
                  type="number"
                  step="0.01"
                  className="border p-2 w-full"
                  value={row.buyingCost}
                  onChange={(e) => updateRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Selling Price (Total)</label>
                <input
                  type="number"
                  step="0.01"
                  className="border p-2 w-full"
                  value={row.sellingPrice}
                  onChange={(e) => updateRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>
          ))}

          <button type="button" className="border px-3 py-1" onClick={addRow}>
            + Add Another Segment
          </button>
        </fieldset>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
        />

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <button type="submit" className="border px-4 py-2 font-bold" disabled={saving}>
          {saving ? "Saving..." : "Save Transport Booking"}
        </button>
      </form>
    </div>
  );
}