// src/app/portal/(protected)/flight-bookings/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { FlightSegment, TRAVEL_CLASSES, emptyFlightSegment } from "@/src/lib/flightBookingTypes";
import { sumLineItems } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function EditFlightBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [segments, setSegments] = useState<FlightSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/flight-bookings/${id}`);
        if (!res.ok) throw new Error("Failed to load");
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
        setVendorName(data.vendorName || "");
        setPaymentStatus(data.paymentStatus || "Pending");

        setSegments(
          data.segments.map((s: any) => {
            const dep = new Date(s.departureDateTime);
            const arr = new Date(s.arrivalDateTime);
            return {
              id: s.id,
              airline: s.airline,
              flightNo: s.flightNo,
              pnr: s.pnr || "",
              departureAirport: s.departureAirport,
              arrivalAirport: s.arrivalAirport,
              departureDate: !isNaN(dep.getTime()) ? dep.toISOString().slice(0, 10) : "",
              departureTime: !isNaN(dep.getTime()) ? dep.toISOString().slice(11, 16) : "",
              arrivalDate: !isNaN(arr.getTime()) ? arr.toISOString().slice(0, 10) : "",
              arrivalTime: !isNaN(arr.getTime()) ? arr.toISOString().slice(11, 16) : "",
              travelClass: s.travelClass || TRAVEL_CLASSES[0],
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
    loadBooking();
  }, [id]);

  function updateSegment(rowId: string, field: keyof FlightSegment, value: string | number) {
    setSegments((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }
  function addSegment() {
    setSegments((rows) => [...rows, emptyFlightSegment()]);
  }
  function removeSegment(rowId: string) {
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
      const res = await fetch(`/api/flight-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, vendorName, paymentStatus, segments }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server rejected the update");
      }
      router.push("/portal/flight-bookings/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Edit Flight Booking</h1>

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
              placeholder="Who you bought this flight from (supplier, not the sales agent)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Flight Segments
          </h2>

          <div className="space-y-4">
            {segments.map((row, index) => (
              <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-[#121212]">Segment {index + 1}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    onClick={() => removeSegment(row.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Airline</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.airline}
                      onChange={(e) => updateSegment(row.id, "airline", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Flight No.</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.flightNo}
                      onChange={(e) => updateSegment(row.id, "flightNo", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>PNR</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.pnr}
                      onChange={(e) => updateSegment(row.id, "pnr", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Travel Class</label>
                    <select
                      className={inputClass}
                      value={row.travelClass}
                      onChange={(e) => updateSegment(row.id, "travelClass", e.target.value)}
                    >
                      {TRAVEL_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Departure Airport</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.departureAirport}
                      onChange={(e) => updateSegment(row.id, "departureAirport", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Arrival Airport</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.arrivalAirport}
                      onChange={(e) => updateSegment(row.id, "arrivalAirport", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Departure Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={row.departureDate}
                      onChange={(e) => updateSegment(row.id, "departureDate", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Departure Time</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={row.departureTime}
                      onChange={(e) => updateSegment(row.id, "departureTime", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Arrival Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={row.arrivalDate}
                      onChange={(e) => updateSegment(row.id, "arrivalDate", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Arrival Time</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={row.arrivalTime}
                      onChange={(e) => updateSegment(row.id, "arrivalTime", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Adults</label>
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={row.adults}
                      onChange={(e) => updateSegment(row.id, "adults", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Children</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={row.children}
                      onChange={(e) => updateSegment(row.id, "children", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Infants</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={row.infants}
                      onChange={(e) => updateSegment(row.id, "infants", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Baggage</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. 30kg checked + 7kg cabin"
                      value={row.baggage}
                      onChange={(e) => updateSegment(row.id, "baggage", e.target.value)}
                    />
                  </div>
                  <div />
                  <div>
                    <label className={labelClass}>Buying Cost (Total for this leg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.buyingCost}
                      onChange={(e) => updateSegment(row.id, "buyingCost", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Selling Price (Total for this leg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.sellingPrice}
                      onChange={(e) => updateSegment(row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
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
            onClick={addSegment}
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
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}