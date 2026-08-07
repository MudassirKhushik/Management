// src/app/portal/(protected)/flight-bookings/[id]/edit/page.tsx

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
import { FlightSegment, emptyFlightSegment } from "@/src/lib/flightBookingTypes";
import { sumLineItems } from "@/src/lib/pricingCalculations";

export default function EditFlightBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [segments, setSegments] = useState<FlightSegment[]>([{ ...emptyFlightSegment }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/flight-bookings/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();

        setHeader({
          agentName: data.agentName || "",
          guestName: data.guestName || "",
          nationality: data.nationality || "",
          mobileNo: data.mobileNo || "",
          referenceNo: data.referenceNo || "",
          currency: data.currency || "PKR",
        });

        setFooter({
          discount: data.discount || 0,
          vatPercent: data.vatPercent || 0,
          paymentType: data.paymentType || "",
          note: data.note || "",
        });

                setSegments(
          data.segments.map((s: any) => {
            let datePart = "";
            let departureTimePart = "";
            let arrivalTimePart = "";

            // Safely parse departure date and time without crashing
            if (s.departureDateTime) {
              const depObj = new Date(s.departureDateTime);
              if (!isNaN(depObj.getTime())) {
                const parts = depObj.toISOString().split("T");
                datePart = parts[0]; // YYYY-MM-DD
                if (parts[1]) {
                  departureTimePart = parts[1].slice(0, 5); // HH:MM
                }
              }
            }

            // Safely parse arrival time without crashing
            if (s.arrivalDateTime) {
              const arrObj = new Date(s.arrivalDateTime);
              if (!isNaN(arrObj.getTime())) {
                const parts = arrObj.toISOString().split("T");
                if (parts[1]) {
                  arrivalTimePart = parts[1].slice(0, 5); // HH:MM
                }
              }
            }

            return {
              id: s.id,
              date: datePart,
              airline: s.airline || "",
              flightNo: s.flightNo || "",
              pnr: s.pnr || "",
              fromAirport: s.departureAirport || "", // database blueprint name -> input name
              toAirport: s.arrivalAirport || "",     // database blueprint name -> input name
              departureTime: departureTimePart,
              arrivalTime: arrivalTimePart,
              travelClass: s.travelClass || "",
              adults: s.adults ?? 1,
              children: s.children ?? 0,
              infants: s.infants ?? 0,
              baggage: s.baggage || "",
              buyingCost: s.buyingCost ?? 0,
              sellingPrice: s.sellingPrice ?? 0,
            };
          })
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
      const res = await fetch(`/api/flight-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...header, 
          ...footer, 
          segments 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      router.push("/portal/flight-bookings/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Edit Flight Booking</h1>

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
                  <input
                    type="number"
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

                  
