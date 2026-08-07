// src/app/portal/(protected)/transport-bookings/manage/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateFooterTotals } from "@/src/lib/pricingCalculations";
import { formatDateDDMMYYYY } from "@/src/lib/formatDate";

type SegmentRow = {
  id: string;
  vehicle: string;
  sector: string;
  pickupDate: string;
  buyingCost: number;
  sellingPrice: number;
};

type Booking = {
  id: string;
  agentName: string;
  guestName: string;
  currency: string;
  discount: number;
  vatPercent: number;
  createdAt: string;
  segments: SegmentRow[];
};

export default function ManageTransportBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/transport-bookings");
        if (!res.ok) throw new Error("Failed to load bookings");
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError("Could not load transport bookings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this transport booking? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/transport-bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBookings((rows) => rows.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete this booking.");
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Transport Bookings</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <table className="border w-full">
          <thead>
            <tr className="border">
              <th className="border p-2 text-left">Guest</th>
              <th className="border p-2 text-left">Agent</th>
              <th className="border p-2 text-left">Segments</th>
              <th className="border p-2 text-left">Currency</th>
              <th className="border p-2 text-left">Net Total</th>
              <th className="border p-2 text-left">Profit</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const grossBuying = booking.segments.reduce((sum, s) => sum + s.buyingCost, 0);
              const grossSelling = booking.segments.reduce((sum, s) => sum + s.sellingPrice, 0);
              const totals = calculateFooterTotals({
                grossBuying,
                grossSelling,
                discount: booking.discount,
                vatPercent: booking.vatPercent,
              });

              return (
                <tr key={booking.id} className="border">
                  <td className="border p-2">{booking.guestName}</td>
                  <td className="border p-2">{booking.agentName}</td>
                  <td className="border p-2">{booking.segments.length}</td>
                  <td className="border p-2">{booking.currency}</td>
                  <td className="border p-2">{totals.netTotal.toFixed(2)}</td>
                  <td className="border p-2">{totals.profit.toFixed(2)}</td>
                  <td className="border p-2">{formatDateDDMMYYYY(booking.createdAt)}</td>
                  <td className="border p-2">
                    <Link className="underline mr-2" href={`/portal/transport-bookings/${booking.id}/edit`}>
                      Edit
                    </Link>
                    <button className="underline text-red-600" onClick={() => handleDelete(booking.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}