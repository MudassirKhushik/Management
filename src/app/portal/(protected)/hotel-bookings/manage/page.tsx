// src/app/portal/(protected)/hotel-bookings/manage/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  calculateHotelEntryTotals,
  sumLineItems,
  calculateFooterTotals,
} from "@/src/lib/pricingCalculations";

type HotelBookingWithEntries = {
  id: string;
  guestName: string;
  agentName: string;
  currency: string;
  discount: number;
  vatPercent: number;
  createdAt: string;
  hotels: {
    checkIn: string;
    checkOut: string;
    rooms: number;
    buyingCostPerNight: number;
    sellingPricePerNight: number;
  }[];
};

export default function ManageHotelBookingsPage() {
  const [bookings, setBookings] = useState<HotelBookingWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
    loadBookings();
  }, []);

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

  if (loading) return <p className="p-4">Loading...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Hotel Bookings</h1>
      <Link href="/portal/hotel-bookings/add" className="border px-3 py-1 inline-block mb-4">
        + Add Hotel Booking
      </Link>

      <table className="border w-full">
        <thead>
          <tr>
            <th className="border p-2">Guest</th>
            <th className="border p-2">Agent</th>
            <th className="border p-2">Currency</th>
            <th className="border p-2">Gross Selling</th>
            <th className="border p-2">Net Total</th>
            <th className="border p-2">Profit</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
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

            return (
              <tr key={booking.id}>
                <td className="border p-2">{booking.guestName}</td>
                <td className="border p-2">{booking.agentName}</td>
                <td className="border p-2">{booking.currency}</td>
                <td className="border p-2">{totals.grossSelling.toFixed(2)}</td>
                <td className="border p-2">{totals.netTotal.toFixed(2)}</td>
                <td className="border p-2">{totals.profit.toFixed(2)}</td>
                <td className="border p-2">
                  <Link href={`/portal/hotel-bookings/${booking.id}/edit`} className="underline mr-2">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(booking.id)} className="underline text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}