"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HotelRow = {
  hotelName: string;
  city: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  meals: string;
  dayRate: number;
  mlRate: number;
  confirmationNo: string;
};

const emptyHotelRow: HotelRow = {
  hotelName: "",
  city: "",
  roomType: "",
  checkIn: "",
  checkOut: "",
  rooms: 1,
  adults: 1,
  children: 0,
  meals: "",
  dayRate: 0,
  mlRate: 0,
  confirmationNo: "",
};

export default function AddHotelBookingPage() {
  const router = useRouter();
  const [error, setError] = useState("");

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
    vatNumber: "",
    optionDate: "",
    totalAmount: 0,
    subAmount: 0,
  });

  const [hotels, setHotels] = useState<HotelRow[]>([{ ...emptyHotelRow }]);

  function updateForm(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateHotel(index: number, field: keyof HotelRow, value: string | number) {
    setHotels((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addHotelRow() {
    setHotels((prev) => [...prev, { ...emptyHotelRow }]);
  }

  function removeHotelRow(index: number) {
    setHotels((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/hotel-bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, hotels }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/portal/hotel-bookings/manage");
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Add Hotel Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Booking-level fields */}
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
          <input className="border p-2 w-full" placeholder="VAT Number"
            value={form.vatNumber} onChange={(e) => updateForm("vatNumber", e.target.value)} />

          <label className="block text-sm">Option Date</label>
          <input type="date" className="border p-2 w-full"
            value={form.optionDate} onChange={(e) => updateForm("optionDate", e.target.value)} />

          <label className="block text-sm">Total Amount</label>
          <input type="number" className="border p-2 w-full"
            value={form.totalAmount} onChange={(e) => updateForm("totalAmount", Number(e.target.value))} />

          <label className="block text-sm">Sub Amount</label>
          <input type="number" className="border p-2 w-full"
            value={form.subAmount} onChange={(e) => updateForm("subAmount", Number(e.target.value))} />
        </div>

        {/* Hotel rows */}
        <div className="space-y-4">
          <h2 className="font-semibold">Hotels</h2>

          {hotels.map((hotel, index) => (
            <div key={index} className="border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Hotel {index + 1}</span>
                {hotels.length > 1 && (
                  <button type="button" onClick={() => removeHotelRow(index)}>
                    Remove
                  </button>
                )}
              </div>

              <input className="border p-2 w-full" placeholder="Hotel Name"
                value={hotel.hotelName} onChange={(e) => updateHotel(index, "hotelName", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="City"
                value={hotel.city} onChange={(e) => updateHotel(index, "city", e.target.value)} required />
              <input className="border p-2 w-full" placeholder="Room Type"
                value={hotel.roomType} onChange={(e) => updateHotel(index, "roomType", e.target.value)} required />

              <label className="block text-sm">Check In</label>
              <input type="date" className="border p-2 w-full"
                value={hotel.checkIn} onChange={(e) => updateHotel(index, "checkIn", e.target.value)} required />

              <label className="block text-sm">Check Out</label>
              <input type="date" className="border p-2 w-full"
                value={hotel.checkOut} onChange={(e) => updateHotel(index, "checkOut", e.target.value)} required />

              <label className="block text-sm">Rooms</label>
              <input type="number" className="border p-2 w-full"
                value={hotel.rooms} onChange={(e) => updateHotel(index, "rooms", Number(e.target.value))} />

              <label className="block text-sm">Adults</label>
              <input type="number" className="border p-2 w-full"
                value={hotel.adults} onChange={(e) => updateHotel(index, "adults", Number(e.target.value))} />

              <label className="block text-sm">Children</label>
              <input type="number" className="border p-2 w-full"
                value={hotel.children} onChange={(e) => updateHotel(index, "children", Number(e.target.value))} />

              <input className="border p-2 w-full" placeholder="Meals"
                value={hotel.meals} onChange={(e) => updateHotel(index, "meals", e.target.value)} />

              <label className="block text-sm">Day Rate</label>
              <input type="number" className="border p-2 w-full"
                value={hotel.dayRate} onChange={(e) => updateHotel(index, "dayRate", Number(e.target.value))} required />

              <label className="block text-sm">ML Rate</label>
              <input type="number" className="border p-2 w-full"
                value={hotel.mlRate} onChange={(e) => updateHotel(index, "mlRate", Number(e.target.value))} />

              <input className="border p-2 w-full" placeholder="Confirmation No"
                value={hotel.confirmationNo} onChange={(e) => updateHotel(index, "confirmationNo", e.target.value)} />
            </div>
          ))}

          <button type="button" onClick={addHotelRow} className="border p-2">
            + Add Another Hotel
          </button>
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <button type="submit" className="border p-2 bg-gray-200">
          Save Booking
        </button>
      </form>
    </div>
  );
}