"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FlightSegment, emptyFlightSegment } from "@/src/lib/flightBookingTypes";

export default function EditFlightBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    agentName: "",
    agentNo: "",
    nationality: "",
    guestName: "",
    contactName: "",
    mobileNo: "",
    clientRefNo: "",
    groupNo: "",
    localRefNo: "",
    reservationNo: "",
    reservationDate: "",
    username: "",
    paymentType: "",
    surcharge: 0,
    discount: 0,
    vatPercent: 0,
    specialRequirements: "",
    note: "",
  });

  const [segments, setSegments] = useState<FlightSegment[]>([{ ...emptyFlightSegment }]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/flight-bookings/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();

        setForm({
          agentName: data.agentName || "",
          agentNo: data.agentNo || "",
          nationality: data.nationality || "",
          guestName: data.guestName || "",
          contactName: data.contactName || "",
          mobileNo: data.mobileNo || "",
          clientRefNo: data.clientRefNo || "",
          groupNo: data.groupNo || "",
          localRefNo: data.localRefNo || "",
          reservationNo: data.reservationNo || "",
          reservationDate: data.reservationDate ? data.reservationDate.slice(0, 10) : "",
          username: data.username || "",
          paymentType: data.paymentType || "",
          surcharge: data.surcharge,
          discount: data.discount,
          vatPercent: data.vatPercent,
          specialRequirements: data.specialRequirements || "",
          note: data.note || "",
        });

        setSegments(
          data.segments.map((s: any) => ({
            date: s.date.slice(0, 10),
            airline: s.airline,
            flightNo: s.flightNo,
            pnr: s.pnr || "",
            fromAirport: s.fromAirport,
            toAirport: s.toAirport,
            departureTime: s.departureTime || "",
            arrivalTime: s.arrivalTime || "",
            travelClass: s.travelClass || "",
            adults: s.adults,
            children: s.children,
            infants: s.infants,
            baggage: s.baggage || "",
            rate: s.rate,
          }))
        );
      } catch (err) {
        setError("Could not load this booking.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function updateForm(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateSegment(index: number, field: keyof FlightSegment, value: string | number) {
    setSegments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addSegment() {
    setSegments((prev) => [...prev, { ...emptyFlightSegment }]);
  }

  function removeSegment(index: number) {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`/api/flight-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, segments }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not save changes");
        return;
      }

      router.push("/portal/flight-bookings/manage");
    } catch (err) {
      setError("Could not save changes. Please try again.");
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Edit Flight Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border p-4 space-y-2">
          <h2 className="font-semibold">Booking Details</h2>

          <input className="border p-2 w-full" placeholder="Agent Name"
            value={form.agentName} onChange={(e) => updateForm("agentName", e.target.value)} required />
          <input className="border p-2 w-full" placeholder="Agent No"
            value={form.agentNo} onChange={(e) => updateForm("agentNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Nationality"
            value={form.nationality} onChange={(e) => updateForm("nationality", e.target.value)} required />
          <input className="border p-2 w-full" placeholder="Guest Name"
            value={form.guestName} onChange={(e) => updateForm("guestName", e.target.value)} required />
          <input className="border p-2 w-full" placeholder="Contact Name"
            value={form.contactName} onChange={(e) => updateForm("contactName", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Mobile No"
            value={form.mobileNo} onChange={(e) => updateForm("mobileNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Client Ref No"
            value={form.clientRefNo} onChange={(e) => updateForm("clientRefNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Group No"
            value={form.groupNo} onChange={(e) => updateForm("groupNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Local Ref No"
            value={form.localRefNo} onChange={(e) => updateForm("localRefNo", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Reservation No"
            value={form.reservationNo} onChange={(e) => updateForm("reservationNo", e.target.value)} />

          <label className="block text-sm">Reservation Date</label>
          <input type="date" className="border p-2 w-full"
            value={form.reservationDate} onChange={(e) => updateForm("reservationDate", e.target.value)} />

          <input className="border p-2 w-full" placeholder="Username"
            value={form.username} onChange={(e) => updateForm("username", e.target.value)} />
          <input className="border p-2 w-full" placeholder="Payment Type"
            value={form.paymentType} onChange={(e) => updateForm("paymentType", e.target.value)} />

          <label className="block text-sm">Surcharge</label>
          <input type="number" className="border p-2 w-full"
            value={form.surcharge} onChange={(e) => updateForm("surcharge", Number(e.target.value))} />

          <label className="block text-sm">Discount</label>
          <input type="number" className="border p-2 w-full"
            value={form.discount} onChange={(e) => updateForm("discount", Number(e.target.value))} />

          <label className="block text-sm">VAT %</label>
          <input type="number" className="border p-2 w-full"
            value={form.vatPercent} onChange={(e) => updateForm("vatPercent", Number(e.target.value))} />

          <textarea className="border p-2 w-full" placeholder="Special Requirements"
            value={form.specialRequirements} onChange={(e) => updateForm("specialRequirements", e.target.value)} />
          <textarea className="border p-2 w-full" placeholder="Note"
            value={form.note} onChange={(e) => updateForm("note", e.target.value)} />
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Flight Segments</h2>

          {segments.map((seg, index) => (
            <div key={index} className="border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Segment {index + 1}</span>
                {segments.length > 1 && (
                  <button type="button" onClick={() => removeSegment(index)}>
                    Remove
                  </button>
                )}
              </div>

              <label className="block text-sm">Date</label>
              <input type="date" className="border p-2 w-full"
                value={seg.date} onChange={(e) => updateSegment(index, "date", e.target.value)} required />

              <input className="border p-2 w-full" placeholder="Airline"
                value={seg.airline} onChange={(e) => updateSegment(index, "airline", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="Flight No"
                value={seg.flightNo} onChange={(e) => updateSegment(index, "flightNo", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="PNR"
                value={seg.pnr} onChange={(e) => updateSegment(index, "pnr", e.target.value)} />
              <input className="border p-2 w-full" placeholder="From Airport"
                value={seg.fromAirport} onChange={(e) => updateSegment(index, "fromAirport", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="To Airport"
                value={seg.toAirport} onChange={(e) => updateSegment(index, "toAirport", e.target.value)} required />

              <label className="block text-sm">Departure Time</label>
              <input type="time" className="border p-2 w-full"
                value={seg.departureTime} onChange={(e) => updateSegment(index, "departureTime", e.target.value)} />

              <label className="block text-sm">Arrival Time</label>
              <input type="time" className="border p-2 w-full"
                value={seg.arrivalTime} onChange={(e) => updateSegment(index, "arrivalTime", e.target.value)} />

              <input className="border p-2 w-full" placeholder="Class (Economy/Business)"
                value={seg.travelClass} onChange={(e) => updateSegment(index, "travelClass", e.target.value)} />

              <label className="block text-sm">Adults</label>
              <input type="number" className="border p-2 w-full"
                value={seg.adults} onChange={(e) => updateSegment(index, "adults", Number(e.target.value))} />

              <label className="block text-sm">Children</label>
              <input type="number" className="border p-2 w-full"
                value={seg.children} onChange={(e) => updateSegment(index, "children", Number(e.target.value))} />

              <label className="block text-sm">Infants</label>
              <input type="number" className="border p-2 w-full"
                value={seg.infants} onChange={(e) => updateSegment(index, "infants", Number(e.target.value))} />

              <input className="border p-2 w-full" placeholder="Baggage (e.g. 30kg)"
                value={seg.baggage} onChange={(e) => updateSegment(index, "baggage", e.target.value)} />

              <label className="block text-sm">Rate</label>
              <input type="number" className="border p-2 w-full"
                value={seg.rate} onChange={(e) => updateSegment(index, "rate", Number(e.target.value))} required />
            </div>
          ))}

          <button type="button" onClick={addSegment} className="border p-2">
            + Add Another Segment
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button type="submit" className="border p-2 bg-gray-200">
          Save Changes
        </button>
      </form>
    </div>
  );
}