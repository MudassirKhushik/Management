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
import { FlightSegment, emptyFlightSegment } from "@/src/lib/flightBookingTypes";
import { sumLineItems } from "@/src/lib/pricingCalculations";

export default function AddFlightBookingPage() {
  const router = useRouter();

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [segments, setSegments] = useState<FlightSegment[]>([{ ...emptyFlightSegment }]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateSegment(index: number, field: keyof FlightSegment, value: string | number) {
    setSegments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addSegment() {
    setSegments((prev) => [...prev, { ...emptyFlightSegment }]);
  }

  function removeSegment(index: number) {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }

    const { grossBuying, grossSelling } = sumLineItems(
    segments.map((row: any) => ({ 
      buyingCost: parseFloat(row.buyingCost) || 0, 
      sellingPrice: parseFloat(row.sellingPrice) || 0 
    }))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/flight-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...header,
          ...footer,
          segments,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      router.push("/portal/flight-bookings/manage");
    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err.message || "Could not create booking. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Add Flight Booking</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 mb-4 rounded-md font-mono text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <fieldset className="border p-4 mb-4 rounded-md bg-white shadow-sm">
          <legend className="font-bold px-2 text-sm text-gray-700">Flight Segments</legend>

          {segments.map((seg, index) => (
            <div key={index} className="border p-4 mb-4 rounded bg-gray-50 relative">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-800">Segment #{index + 1}</span>
                {segments.length > 1 && (
                  <button
                    type="button"
                    className="text-sm border border-red-300 text-red-600 px-3 py-1 rounded bg-white hover:bg-red-50 transition"
                    onClick={() => removeSegment(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.date}
                    onChange={(e) => updateSegment(index, "date", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Airline *</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.airline}
                    onChange={(e) => updateSegment(index, "airline", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Flight No *</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.flightNo}
                    onChange={(e) => updateSegment(index, "flightNo", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">PNR</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.pnr}
                    onChange={(e) => updateSegment(index, "pnr", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">From Airport *</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.fromAirport}
                    onChange={(e) => updateSegment(index, "fromAirport", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">To Airport *</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.toAirport}
                    onChange={(e) => updateSegment(index, "toAirport", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Departure Time</label>
                  <input
                    type="time"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.departureTime}
                    onChange={(e) => updateSegment(index, "departureTime", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Arrival Time</label>
                  <input
                    type="time"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.arrivalTime}
                    onChange={(e) => updateSegment(index, "arrivalTime", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Class (Economy/Business)</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.travelClass}
                    onChange={(e) => updateSegment(index, "travelClass", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Adults</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.adults}
                    onChange={(e) => updateSegment(index, "adults", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Children</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.children}
                    onChange={(e) => updateSegment(index, "children", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Infants</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.infants}
                    onChange={(e) => updateSegment(index, "infants", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Baggage</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={seg.baggage}
                    onChange={(e) => updateSegment(index, "baggage", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Buying Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full rounded bg-white"
                    value={(seg as any).buyingCost || ""}
                    onChange={(e) => updateSegment(index, "buyingCost" as any, parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Selling Price *</label>
                  <input                     type="number"
                    step="0.01"
                    className="border p-2 w-full rounded bg-white"
                    value={(seg as any).sellingPrice || ""}
                    onChange={(e) => updateSegment(index, "sellingPrice" as any, parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="w-full mt-2 border border-dashed border-blue-400 text-blue-600 font-medium py-2 rounded bg-blue-50 hover:bg-blue-100 transition"
            onClick={addSegment}
          >
            + Add Another Segment
          </button>
        </fieldset>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="border px-5 py-2 rounded bg-white hover:bg-gray-100"
            onClick={() => router.push("/portal/flight-bookings/manage")}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded shadow transition disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}

