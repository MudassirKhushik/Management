// src/app/portal/(protected)/transport-bookings/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditTransportBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [segments, setSegments] = useState<TransportRow[]>([emptyTransportRow()]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/transport-bookings/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();

        setHeader({
          agentName: data.agentName,
          guestName: data.guestName,
          nationality: data.nationality,
          mobileNo: data.mobileNo || "",
          referenceNo: data.referenceNo || "",
          currency: data.currency,
        });

        setFooter({
          discount: data.discount,
          vatPercent: data.vatPercent,
          paymentType: data.paymentType || "",
          note: data.note || "",
        });

        setSegments(
          data.segments.map((s: any) => ({
            id: s.id,
            vehicle: s.vehicle,
            sector: s.sector,
            pickupDate: s.pickupDate.slice(0, 10),
            pickupTime: s.pickupTime,
            qty: s.qty,
            buyingCost: s.buyingCost,
            sellingPrice: s.sellingPrice,
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Could not load this booking.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function updateRow(rowId: string, field: keyof TransportRow, value: string | number) {
    setSegments((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setSegments((rows) => [...rows, emptyTransportRow()]);
  }

  function removeRow(rowId: string) {
    setSegments((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  }

  const { grossBuying, grossSelling } = sumLineItems(
    segments.map((row) => ({ buyingCost: row.buyingCost, sellingPrice: row.sellingPrice }))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/transport-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, segments }),
      });

      if (!res.ok) throw new Error("Server rejected the update");

      router.push("/portal/transport-bookings/manage");
    } catch (err) {
      console.error(err);
      setError("Could not save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Edit Transport Booking</h1>

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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}