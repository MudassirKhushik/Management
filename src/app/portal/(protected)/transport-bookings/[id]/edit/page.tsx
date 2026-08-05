"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TransportSegment, emptySegment } from "@/src/lib/transportBookingTypes";

export default function EditTransportBookingPage() {
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
    paymentType: "",
    surcharge: 0,
    discount: 0,
    vatPercent: 0,
  });

  const [segments, setSegments] = useState<TransportSegment[]>([{ ...emptySegment }]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/transport-bookings/${id}`);
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
          paymentType: data.paymentType || "",
          surcharge: data.surcharge,
          discount: data.discount,
          vatPercent: data.vatPercent,
        });

        setSegments(
          data.segments.map((s: any) => ({
            date: s.date.slice(0, 10),
            time: s.time,
            fromLoc: s.fromLoc,
            toLoc: s.toLoc,
            vehicle: s.vehicle,
            qty: s.qty,
            adults: s.adults,
            mlRate: s.mlRate,
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

  function updateSegment(index: number, field: keyof TransportSegment, value: string | number) {
    setSegments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addSegment() {
    setSegments((prev) => [...prev, { ...emptySegment }]);
  }

  function removeSegment(index: number) {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`/api/transport-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, segments }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Could not save changes");
        return;
      }

      router.push("/portal/transport-bookings/manage");
    } catch (err) {
      setError("Could not save changes. Please try again.");
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Edit Transport Booking</h1>

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
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Segments</h2>

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

              <label className="block text-sm">Time</label>
              <input type="time" className="border p-2 w-full"
                value={seg.time} onChange={(e) => updateSegment(index, "time", e.target.value)} required />

              <input className="border p-2 w-full" placeholder="From"
                value={seg.fromLoc} onChange={(e) => updateSegment(index, "fromLoc", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="To"
                value={seg.toLoc} onChange={(e) => updateSegment(index, "toLoc", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="Vehicle"
                value={seg.vehicle} onChange={(e) => updateSegment(index, "vehicle", e.target.value)} required />

              <label className="block text-sm">Qty</label>
              <input type="number" className="border p-2 w-full"
                value={seg.qty} onChange={(e) => updateSegment(index, "qty", Number(e.target.value))} />

              <label className="block text-sm">Adults</label>
              <input type="number" className="border p-2 w-full"
                value={seg.adults} onChange={(e) => updateSegment(index, "adults", Number(e.target.value))} />

              <label className="block text-sm">ML Rate</label>
              <input type="number" className="border p-2 w-full"
                value={seg.mlRate} onChange={(e) => updateSegment(index, "mlRate", Number(e.target.value))} />

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