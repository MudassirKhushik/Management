"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManageFlightBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/flight-bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError("Could not load flight bookings. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this booking?")) return;

    try {
      const res = await fetch(`/api/flight-bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Could not delete booking. Please try again.");
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Flight Bookings</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {bookings.length === 0 && !error && <p>No flight bookings yet.</p>}

      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="border p-4">
            <p className="font-medium">{booking.guestName}</p>
            <p className="text-sm">Agent: {booking.agentName}</p>
            <p className="text-sm">Nationality: {booking.nationality}</p>
            <p className="text-sm">Segments: {booking.segments.length}</p>

            <div className="mt-2 space-x-2">
              <Link
                href={`/portal/flight-bookings/${booking.id}/edit`}
                className="border px-2 py-1 inline-block"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(booking.id)}
                className="border px-2 py-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}