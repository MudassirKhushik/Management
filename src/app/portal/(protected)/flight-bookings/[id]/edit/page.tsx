// src/app/portal/(protected)/flight-bookings/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import PaymentHistorySection from "@/src/components/booking/PaymentHistorySection";
import FlightSegmentFields from "@/src/components/booking/FlightSegmentFields";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { FlightRow, emptyFlightRow, TRAVEL_CLASSES } from "@/src/lib/flightBookingTypes";
import { calculateFlightSegmentTotals, sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" — an ISO string
// from the API has seconds and a timezone suffix the input silently rejects.
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditFlightBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [segments, setSegments] = useState<FlightRow[]>([]);
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
        setSegments(
          data.segments.map((s: any) => ({
            id: s.id,
            airline: s.airline,
            flightNo: s.flightNo,
            pnr: s.pnr || "",
            departureAirport: s.departureAirport,
            arrivalAirport: s.arrivalAirport,
            departureDateTime: toLocalInput(s.departureDateTime),
            arrivalDateTime: toLocalInput(s.arrivalDateTime),
            travelClass: s.travelClass || TRAVEL_CLASSES[0],
            adults: s.adults,
            children: s.children,
            infants: s.infants,
            baggage: s.baggage || "",
            // Stored as one newline-separated column, edited as an array.
            passengerNames: s.passengerNames
              ? s.passengerNames.split("\n").filter(Boolean)
              : [""],
            adultBuyingPricePerLeg: s.adultBuyingPricePerLeg,
            adultSellingPricePerLeg: s.adultSellingPricePerLeg,
            childBuyingPricePerLeg: s.childBuyingPricePerLeg,
            childSellingPricePerLeg: s.childSellingPricePerLeg,
            infantBuyingPricePerLeg: s.infantBuyingPricePerLeg,
            infantSellingPricePerLeg: s.infantSellingPricePerLeg,
          }))
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

  function updateRow(rowId: string, field: keyof FlightRow, value: any) {
    setSegments((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }
  function addRow() {
    setSegments((rows) => [...rows, emptyFlightRow()]);
  }
  function removeRow(rowId: string) {
    setSegments((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  }

  const { grossBuying, grossSelling } = sumLineItems(
    segments.map((row) => {
      const t = calculateFlightSegmentTotals(row);
      return { buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal };
    })
  );
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: footer.discount,
    vatPercent: footer.vatPercent,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/flight-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, vendorName, segments }),
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
              placeholder="Who you bought these tickets from (consolidator, not the sales agent)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Flights
          </h2>

          <div className="space-y-4">
            {segments.map((row, index) => (
              <FlightSegmentFields
                key={row.id}
                row={row}
                index={index}
                currency={header.currency}
                onChange={(field, value) => updateRow(row.id, field, value)}
                onRemove={() => removeRow(row.id)}
              />
            ))}
          </div>

          <button
            type="button"
            className="w-full mt-4 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
            onClick={addRow}
          >
            + Add Another Flight
          </button>
        </section>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
          bookingId={id}
          bookingType="flight"
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

      {/* Outside the <form> — PaymentHistorySection has its own form inside
          it, and nested forms are invalid HTML. */}
      <div className="mt-5">
        <PaymentHistorySection
          bookingType="flight"
          bookingId={id}
          netTotal={totals.netTotal}
          currency={header.currency}
        />
      </div>
    </div>
  );
}