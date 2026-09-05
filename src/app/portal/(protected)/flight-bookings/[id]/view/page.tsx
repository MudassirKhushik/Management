// src/app/portal/(protected)/flight-bookings/[id]/view/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { calculateFlightSegmentTotals, sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";
import PaymentHistorySection from "@/src/components/booking/PaymentHistorySection";

type SegmentRow = {
  id: string;
  airline: string;
  flightNo: string;
  pnr: string | null;
  departureAirport: string;
  arrivalAirport: string;
  departureDateTime: string;
  arrivalDateTime: string;
  travelClass: string | null;
  adults: number;
  children: number;
  infants: number;
  baggage: string | null;
  passengerNames: string | null;
  adultBuyingPricePerLeg: number;
  adultSellingPricePerLeg: number;
  childBuyingPricePerLeg: number;
  childSellingPricePerLeg: number;
  infantBuyingPricePerLeg: number;
  infantSellingPricePerLeg: number;
};

type Booking = {
  id: string;
  agentName: string;
  guestName: string;
  nationality: string;
  mobileNo: string;
  referenceNo: string | null;
  currency: string;
  discount: number;
  vatPercent: number;
  paymentType: string | null;
  paymentStatus: string | null;
  note: string | null;
  vendorName: string | null;
  createdAt: string;
  segments: SegmentRow[];
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm font-medium text-[#121212] text-right">{value ?? "—"}</span>
    </div>
  );
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ViewFlightBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/flight-bookings/${id}`);
        if (!res.ok) throw new Error("Not found");
        setBooking(await res.json());
      } catch (err) {
        console.error(err);
        setError("Could not load this booking.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (error || !booking) return <p className="p-6 text-red-600">{error || "Booking not found."}</p>;

  const rowTotals = booking.segments.map((s) => calculateFlightSegmentTotals(s));
  const { grossBuying, grossSelling } = sumLineItems(
    rowTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }))
  );
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: booking.discount,
    vatPercent: booking.vatPercent,
  });

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[#121212]">Flight Booking Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/portal/flight-bookings/manage")}
            className="rounded-lg px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <Link
            href={`/portal/flight-bookings/${booking.id}/edit`}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--agency-color)" }}
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
          Documents
        </h2>
        <div className="flex flex-wrap gap-3">
          
            href={`/api/flight-bookings/${booking.id}/pdf?type=invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--agency-color)" }}
          <a>
            Generate Invoice
          </a>
          
            href={`/api/flight-bookings/${booking.id}/pdf?type=voucher`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold border-2 transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
          <a>
            Generate Voucher
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--agency-color)" }}>
            Booking Information
          </h2>
          <DetailRow label="Agent" value={booking.agentName} />
          <DetailRow label="Vendor" value={booking.vendorName} />
          <DetailRow label="Reference No." value={booking.referenceNo} />
          <DetailRow label="Currency" value={booking.currency} />
          <DetailRow label="Payment Type" value={booking.paymentType} />
          <DetailRow label="Payment Status" value={booking.paymentStatus || "Pending"} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--agency-color)" }}>
            Guest Information
          </h2>
          <DetailRow label="Guest Name" value={booking.guestName} />
          <DetailRow label="Nationality" value={booking.nationality} />
          <DetailRow label="Mobile No." value={booking.mobileNo} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
          Flights
        </h2>
        <div className="space-y-3">
          {booking.segments.map((s, i) => {
            const names = (s.passengerNames || "").split("\n").filter(Boolean);
            return (
              <div key={s.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="text-sm font-semibold text-[#121212] mb-2">
                  Flight {i + 1} — {s.airline} {s.flightNo} ({s.departureAirport} → {s.arrivalAirport})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                  <span>PNR: {s.pnr || "—"}</span>
                  <span>Class: {s.travelClass || "—"}</span>
                  <span>Departs: {fmtDateTime(s.departureDateTime)}</span>
                  <span>Arrives: {fmtDateTime(s.arrivalDateTime)}</span>
                  <span>Pax: {s.adults}A {s.children}C {s.infants}I</span>
                  <span>Baggage: {s.baggage || "—"}</span>
                  <span>Buy Total: {rowTotals[i].buyingTotal.toFixed(2)}</span>
                  <span>Sell Total: {rowTotals[i].sellingTotal.toFixed(2)}</span>
                </div>
                {names.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                      Passengers
                    </p>
                    <ol className="text-xs text-gray-600 space-y-0.5">
                      {names.map((n, ni) => (
                        <li key={ni}>{ni + 1}. {n}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--agency-color)" }}>
          Pricing Summary
        </h2>
        <DetailRow label="Gross Selling" value={totals.grossSelling.toFixed(2)} />
        <DetailRow label="Discount" value={booking.discount.toFixed(2)} />
        <DetailRow label="VAT %" value={`${booking.vatPercent}%`} />
        <DetailRow label="Net Total" value={totals.netTotal.toFixed(2)} />
        <DetailRow label="Profit" value={totals.profit.toFixed(2)} />
        {booking.note && <DetailRow label="Note" value={booking.note} />}
      </div>

      {/* Read-only here by design — payments are only editable from
          Edit/Manage, never from View. */}
      <PaymentHistorySection
        bookingType="flight"
        bookingId={booking.id}
        netTotal={totals.netTotal}
        currency={booking.currency}
        readOnly
      />
    </div>
  );
}