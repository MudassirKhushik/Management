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

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function AddTransportBookingPage() {
  const router = useRouter();
  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
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
        body: JSON.stringify({ ...header, ...footer, vendorName, paymentStatus, segments }),
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
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Add Transport Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Vendor
          </h2>
          <div>
            <label className={labelClass}>Vendor Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Who you bought this transport from (supplier, not the sales agent)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Transport Segments
          </h2>

          <div className="space-y-4">
            {segments.map((row, index) => (
              <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-[#121212]">Segment {index + 1}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    onClick={() => removeRow(row.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Vehicle</label>
                    <select
                      className={inputClass}
                      value={row.vehicle}
                      onChange={(e) => updateRow(row.id, "vehicle", e.target.value)}
                    >
                      {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Sector (e.g. Jeddah to Makkah)</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.sector}
                      onChange={(e) => updateRow(row.id, "sector", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Pickup Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={row.pickupDate}
                      onChange={(e) => updateRow(row.id, "pickupDate", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Pickup Time</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={row.pickupTime}
                      onChange={(e) => updateRow(row.id, "pickupTime", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={row.qty}
                      onChange={(e) => updateRow(row.id, "qty", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div />
                  <div>
                    <label className={labelClass}>Buying Cost (Total)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.buyingCost}
                      onChange={(e) => updateRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Selling Price (Total)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.sellingPrice}
                      onChange={(e) => updateRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-full mt-4 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
            onClick={addRow}
          >
            + Add Another Segment
          </button>
        </section>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={setPaymentStatus}
        />

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Transport Booking"}
        </button>
      </form>
    </div>
  );
}