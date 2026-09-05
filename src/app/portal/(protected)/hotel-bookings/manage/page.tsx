// src/app/portal/(protected)/hotel-bookings/manage/page.tsx

"use client";

import { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import {
  calculateHotelEntryTotals,
  sumLineItems,
  calculateFooterTotals,
  remainingBalanceTier,
} from "@/src/lib/pricingCalculations";
import QuickPaymentForm, { QuickPaymentPayload } from "@/src/components/booking/QuickPaymentForm";

type HotelEntry = {
  hotelName: string;
  city: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  adultBuyingPricePerNight: number;
  adultSellingPricePerNight: number;
  childBuyingPricePerNight: number;
  childSellingPricePerNight: number;
};

type HotelBookingWithEntries = {
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
  hotels: HotelEntry[];
  totalPaid: number;
  exchangeRate: number; // Item 2 — booking prices are in SAR, this converts to PKR for reporting
};

const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Partially Paid": "bg-blue-50 text-blue-700 border-blue-200",
};
const TIER_CLASS: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  unpaid: "bg-red-50 text-red-700 border-red-200",
  none: "bg-gray-50 text-gray-500 border-gray-200",
};
// Round 6: Remaining Balance font weight/size also escalates with urgency —
// fully unpaid stands out more than a small remaining balance.
const TIER_FONT: Record<string, string> = {
  paid: "text-xs font-medium",
  partial: "text-xs font-semibold",
  unpaid: "text-sm font-bold",
  none: "text-xs font-medium",
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
function CashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
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

export default function ManageHotelBookingsPage() {
  const [bookings, setBookings] = useState<HotelBookingWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [paymentRowId, setPaymentRowId] = useState<string | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const res = await fetch("/api/hotel-bookings");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      setError("Could not load hotel bookings. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this hotel booking?")) return;
    try {
      const res = await fetch(`/api/hotel-bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setBookings((rows) => rows.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete this booking.");
    }
  }

  // Round 7: no manual status control at all — Pending/Partially Paid/Paid
  // are always derived from payments received. Cancelling a booking now
  // means deleting it (the Delete button already exists), so the earlier
  // Cancel/Reactivate actions are gone.

  async function handleQuickPayment(bookingId: string, payload: QuickPaymentPayload) {
    setPaymentSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingType: "hotel", bookingId, ...payload }),
      });
      if (!res.ok) throw new Error("Server rejected the payment");

      const updated = await fetch(`/api/hotel-bookings/${bookingId}`);
      if (updated.ok) {
        const fresh = await updated.json();
        const paymentsRes = await fetch(`/api/payments?bookingType=hotel&bookingId=${bookingId}`);
        const payments = paymentsRes.ok ? await paymentsRes.json() : [];
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        setBookings((rows) =>
          rows.map((b) => (b.id === bookingId ? { ...b, ...fresh, totalPaid } : b))
        );
      }
      setPaymentRowId(null);
    } catch (err) {
      console.error(err);
      alert("Could not record this payment.");
    } finally {
      setPaymentSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  const filtered = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.guestName.toLowerCase().includes(q) ||
      b.mobileNo?.toLowerCase().includes(q) ||
      b.agentName.toLowerCase().includes(q) ||
      (b.vendorName || "").toLowerCase().includes(q) ||
      b.hotels.some((h) => h.hotelName.toLowerCase().includes(q))
    );
  });

  // Item 1 (round 3): back to one column per hotel, as many as the widest
  // booking needs — reverted from the single-column summary.
  const maxHotels = Math.max(1, ...bookings.map((b) => b.hotels.length));

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-[#121212]">Manage Hotel Bookings</h1>
        <Link
          href="/portal/hotel-bookings/add"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--agency-color)" }}
        >
          + Add Hotel Booking
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by guest, phone, agent, vendor, or hotel name..."
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
              {Array.from({ length: maxHotels }).map((_, i) => (
                <th key={i} className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">
                  Hotel {i + 1}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Net Total (PKR)</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Profit (PKR)</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Remaining ({filtered[0]?.currency || "SAR"})</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Vendor</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Agent</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Payment</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking) => {
              const { grossBuying, grossSelling } = sumLineItems(
                booking.hotels.map((row) => {
                  const t = calculateHotelEntryTotals(row);
                  return { buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal };
                })
              );
              const totals = calculateFooterTotals({
                grossBuying,
                grossSelling,
                discount: booking.discount,
                vatPercent: booking.vatPercent,
              });
              // Item 2: hotel prices are entered in SAR (booking.currency),
              // but revenue/profit needs to be currency-aware for accurate
              // reporting — converted to PKR using this booking's exchange
              // rate. Remaining Balance stays in SAR since that's what the
              // client actually still owes.
              const rate = booking.exchangeRate || 1;
              const convertedNetTotal = totals.netTotal * rate;
              const convertedProfit = totals.profit * rate;
              const remaining = Math.max(0, totals.netTotal - (booking.totalPaid || 0));
              const tier = remainingBalanceTier(remaining, totals.netTotal);
              const isPaymentRowOpen = paymentRowId === booking.id;
              const actionColSpan = maxHotels + 8;

              return (
                <Fragment key={booking.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#121212]">{booking.guestName}</td>
                    <td className="px-4 py-3 text-gray-600">{booking.mobileNo || "—"}</td>
                    {Array.from({ length: maxHotels }).map((_, i) => (
                      <td key={i} className="px-4 py-3 text-gray-600">
                        {booking.hotels[i] ? `${booking.hotels[i].hotelName}, ${booking.hotels[i].city}` : "—"}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-semibold text-[#121212]">{convertedNetTotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{convertedProfit.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setPaymentRowId(isPaymentRowOpen ? null : booking.id)}
                        className={`rounded-full border px-2.5 py-1 ${TIER_CLASS[tier]} ${TIER_FONT[tier]}`}
                        title="Click to record a payment"
                      >
                        {tier === "paid" ? "Paid" : remaining.toFixed(2)}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{booking.vendorName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{booking.agentName}</td>
                    <td className="px-4 py-3">
                      {/* Round 7: pure read-only badge, no actions here at
                          all — delete the booking if it needs cancelling. */}
                      <span
                        className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${
                          STATUS_COLOR[booking.paymentStatus || "Pending"]
                        }`}
                      >
                        {booking.paymentStatus || "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <IconButton
                          onClick={() => setPaymentRowId(isPaymentRowOpen ? null : booking.id)}
                          title="Record Payment"
                        >
                          <CashIcon />
                        </IconButton>
                        <IconButton href={`/portal/hotel-bookings/${booking.id}/view`} title="View">
                          <EyeIcon />
                        </IconButton>
                        <IconButton href={`/portal/hotel-bookings/${booking.id}/edit`} title="Edit">
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          href={`/api/hotel-bookings/${booking.id}/pdf?type=invoice`}
                          title="Generate Invoice"
                          external
                        >
                          <FileTextIcon />
                        </IconButton>
                        <IconButton
                          href={`/api/hotel-bookings/${booking.id}/pdf?type=voucher`}
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
                  {isPaymentRowOpen && (
                    <tr className="border-b border-gray-100 bg-gray-50/40">
                      <td colSpan={actionColSpan} className="px-4 py-4">
                        <QuickPaymentForm
                          compact
                          saving={paymentSaving}
                          onSubmit={(payload) => handleQuickPayment(booking.id, payload)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={maxHotels + 8} className="px-4 py-10 text-center text-gray-400">
                  {search ? "No matches." : "No hotel bookings yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}