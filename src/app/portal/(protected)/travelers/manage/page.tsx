// src/app/portal/(protected)/travelers/manage/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calculateFooterTotals } from "@/src/lib/pricingCalculations";
import { formatDateDDMMYYYY } from "@/src/lib/formatDate";

type HotelEntry = { buyingCostPerNight: number; sellingPricePerNight: number };
type TransportEntry = { buyingCost: number; sellingPrice: number };
type FlightEntry = { buyingCost: number; sellingPrice: number };
type VisaEntryRow = { buyingCost: number; sellingPrice: number };

type Booking = {
  id: string;
  agentName: string;
  guestName: string;
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

export default function ManagePackageBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/travelers");
        if (!res.ok) throw new Error("Failed to load bookings");
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError("Could not load package bookings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this package booking? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/travelers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBookings((rows) => rows.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete this booking.");
    }
  }

  function servicesLabel(b: Booking) {
    const parts: string[] = [];
    if (b.includeHotels) parts.push("Hotel");
    if (b.includeTransports) parts.push("Transport");
    if (b.includeFlights) parts.push("Flight");
    if (b.includeVisas) parts.push("Visa");
    return parts.join(" + ") || "—";
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Package Bookings</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <table className="border w-full">
          <thead>
            <tr className="border">
              <th className="border p-2 text-left">Guest</th>
              <th className="border p-2 text-left">Agent</th>
              <th className="border p-2 text-left">Services</th>
              <th className="border p-2 text-left">Currency</th>
              <th className="border p-2 text-left">Net Total</th>
              <th className="border p-2 text-left">Profit</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const hotelBuying = booking.hotels.reduce((sum, e) => sum + e.buyingCostPerNight, 0);
              const hotelSelling = booking.hotels.reduce((sum, e) => sum + e.sellingPricePerNight, 0);
              const transportBuying = booking.transportSegments.reduce((sum, e) => sum + e.buyingCost, 0);
              const transportSelling = booking.transportSegments.reduce((sum, e) => sum + e.sellingPrice, 0);
              const flightBuying = booking.flightSegments.reduce((sum, e) => sum + e.buyingCost, 0);
              const flightSelling = booking.flightSegments.reduce((sum, e) => sum + e.sellingPrice, 0);
              const visaBuying = booking.visaEntries.reduce((sum, e) => sum + e.buyingCost, 0);
              const visaSelling = booking.visaEntries.reduce((sum, e) => sum + e.sellingPrice, 0);

              const grossBuying = hotelBuying + transportBuying + flightBuying + visaBuying;
              const grossSelling = hotelSelling + transportSelling + flightSelling + visaSelling;

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
                  <td className="border p-2">{servicesLabel(booking)}</td>
                  <td className="border p-2">{booking.currency}</td>
                  <td className="border p-2">{totals.netTotal.toFixed(2)}</td>
                  <td className="border p-2">{totals.profit.toFixed(2)}</td>
                  <td className="border p-2">{formatDateDDMMYYYY(booking.createdAt)}</td>
                  <td className="border p-2">
                    <Link className="underline mr-2" href={`/portal/travelers/${booking.id}/edit`}>
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