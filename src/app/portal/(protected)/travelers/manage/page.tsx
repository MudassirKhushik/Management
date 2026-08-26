// src/app/portal/(protected)/travelers/manage/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { sumLineItems, calculateFooterTotals, calculateHotelEntryTotals } from "@/src/lib/pricingCalculations";

type HotelEntry = { checkIn: string; checkOut: string; rooms: number; buyingCostPerNight: number; sellingPricePerNight: number };
type TransportEntry = { buyingCost: number; sellingPrice: number };
type FlightEntry = { buyingCost: number; sellingPrice: number };
type VisaEntryRow = { buyingCost: number; sellingPrice: number };

type PackageBookingWithEntries = {
  id: string;
  guestName: string;
  mobileNo: string;
  agentName: string;
  vendorName: string | null;
  paymentStatus: string | null;
  currency: string;
  discount: number;
  vatPercent: number;
  createdAt: string;
  includeHotels: boolean;
  includeTransports: boolean;
  includeFlights: boolean;
  includeVisas: boolean;
  hotels: HotelEntry[];
  transportSegments: TransportEntry[];
  flightSegments: FlightEntry[];
  visaEntries: VisaEntryRow[];
};

const PAYMENT_STATUSES = ["Pending", "Paid", "Partially Paid", "Cancelled"];
const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Partially Paid": "bg-blue-50 text-blue-700 border-blue-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FileTextIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9" y1="5" x2="9" y2="19" strokeDasharray="2 3" strokeLinecap="round" />
    </svg>
  );
}

function IconButton({
  href,
  onClick,
  children,
  title,
  external = false,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  title: string;
  external?: boolean;
}) {
  const cls = "w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white";
  const inner = (
    <span
      className={cls}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--agency-color)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      title={title}
    >
      {children}
    </span>
  );
  if (external && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return href ? <Link href={href}>{inner}</Link> : <button type="button" onClick={onClick}>{inner}</button>;
}

function servicesLabel(b: PackageBookingWithEntries) {
  const parts: string[] = [];
  if (b.includeHotels) parts.push("Hotel");
  if (b.includeTransports) parts.push("Transport");
  if (b.includeFlights) parts.push("Flight");
  if (b.includeVisas) parts.push("Visa");
  return parts.join(" + ") || "—";
}

export default function ManagePackageBookingsPage() {
  const [bookings, setBookings] = useState<PackageBookingWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/travelers");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError("Could not load package bookings. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this package booking?")) return;
    try {
      const res = await fetch(`/api/travelers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setBookings((rows) => rows.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete this booking.");
    }
  }

  async function handlePaymentStatusChange(id: string, newStatus: string) {
    setBookings((rows) => rows.map((b) => (b.id === id ? { ...b, paymentStatus: newStatus } : b)));
    try {
      const res = await fetch(`/api/travelers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      console.error(err);
      alert("Could not update payment status.");
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  const filtered = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.guestName.toLowerCase().includes(q) ||
      (b.mobileNo || "").toLowerCase().includes(q) ||
      b.agentName.toLowerCase().includes(q) ||
      (b.vendorName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-[#121212]">Manage Package Bookings</h1>
        <Link
          href="/portal/travelers/add"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--agency-color)" }}
        >
          + Add Package Booking
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by guest, phone, agent, or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Guest</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Phone</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Services</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Net Total</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Profit</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Vendor</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Agent</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Payment</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking) => {
              const hotelRowTotals = booking.hotels.map((h) => calculateHotelEntryTotals(h));
              const combinedLineItems = [
                ...hotelRowTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal })),
                ...booking.transportSegments.map((t) => ({ buyingCost: t.buyingCost, sellingPrice: t.sellingPrice })),
                ...booking.flightSegments.map((f) => ({ buyingCost: f.buyingCost, sellingPrice: f.sellingPrice })),
                ...booking.visaEntries.map((v) => ({ buyingCost: v.buyingCost, sellingPrice: v.sellingPrice })),
              ];
              const { grossBuying, grossSelling } = sumLineItems(combinedLineItems);
              const totals = calculateFooterTotals({
                grossBuying,
                grossSelling,
                discount: booking.discount,
                vatPercent: booking.vatPercent,
              });

              return (
                <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#121212]">{booking.guestName}</td>
                  <td className="px-4 py-3 text-gray-600">{booking.mobileNo || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{servicesLabel(booking)}</td>
                  <td className="px-4 py-3 font-semibold text-[#121212]">{totals.netTotal.toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">{totals.profit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{booking.vendorName || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{booking.agentName}</td>
                  <td className="px-4 py-3">
                    <select
                      value={booking.paymentStatus || "Pending"}
                      onChange={(e) => handlePaymentStatusChange(booking.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full border px-2.5 py-1 focus:outline-none ${
                        STATUS_COLOR[booking.paymentStatus || "Pending"]
                      }`}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <IconButton href={`/portal/travelers/${booking.id}/view`} title="View">
                        <EyeIcon />
                      </IconButton>
                      <IconButton href={`/portal/travelers/${booking.id}/edit`} title="Edit">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        href={`/api/travelers/${booking.id}/pdf?type=invoice`}
                        title="Generate Invoice"
                        external
                      >
                        <FileTextIcon />
                      </IconButton>
                      <IconButton
                        href={`/api/travelers/${booking.id}/pdf?type=voucher`}
                        title="Generate Voucher"
                        external
                      >
                        <TicketIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(booking.id)} title="Delete">
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  {search ? "No matches." : "No package bookings yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}