// src/app/portal/(protected)/flight-bookings/[id]/view/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";

type SegmentEntry = {
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
  buyingCost: number;
  sellingPrice: number;
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
  segments: SegmentEntry[];
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm font-medium text-[#121212] text-right">{value ?? "—"}</span>
    </div>
  );
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

  const { grossBuying, grossSelling } = sumLineItems(
    booking.segments.map((s) => ({ buyingCost: s.buyingCost, sellingPrice: s.sellingPrice }))
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
          <a
            href={`/api/flight-bookings/${booking.id}/pdf?type=invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--agency-color)" }}
          >
            Generate Invoice
          </a>
          <a
            href={`/api/flight-bookings/${booking.id}/pdf?type=voucher`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold border-2 transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
          >
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
          Flight Segments
        </h2>
        <div className="space-y-3">
          {booking.segments.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <p className="text-sm font-semibold text-[#121212] mb-2">
                {s.airline} {s.flightNo} — {s.departureAirport} → {s.arrivalAirport}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                <span>Departs: {new Date(s.departureDateTime).toLocaleString()}</span>
                <span>Arrives: {new Date(s.arrivalDateTime).toLocaleString()}</span>
                <span>Class: {s.travelClass || "—"}</span>
                <span>PNR: {s.pnr || "—"}</span>
                <span>Adults: {s.adults}</span>
                <span>Children: {s.children}</span>
                <span>Infants: {s.infants}</span>
                <span>Baggage: {s.baggage || "—"}</span>
                <span>Buy Total: {s.buyingCost.toFixed(2)}</span>
                <span>Sell Total: {s.sellingPrice.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
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
    </div>
  );
}