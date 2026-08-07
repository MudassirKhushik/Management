// src/app/portal/(protected)/hotel-bookings/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { HotelRow, ROOM_TYPES, MEAL_PLANS, emptyHotelRow } from "@/src/lib/hotelBookingTypes";
import { calculateHotelEntryTotals, sumLineItems } from "@/src/lib/pricingCalculations";

export default function EditHotelBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/hotel-bookings/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setHeader({
          agentName: data.agentName,
          guestName: data.guestName,
          nationality: data.nationality,
          mobileNo: data.mobileNo,
          referenceNo: data.referenceNo || "",
          currency: data.currency,
        });
        setFooter({
          discount: data.discount,
          vatPercent: data.vatPercent,
          paymentType: data.paymentType || "",
          note: data.note || "",
        });
        setHotels(
          data.hotels.map((row: any) => ({
            id: row.id,
            hotelName: row.hotelName,
            city: row.city,
            roomType: row.roomType,
            checkIn: row.checkIn.slice(0, 10),
            checkOut: row.checkOut.slice(0, 10),
            rooms: row.rooms,
            adults: row.adults,
            children: row.children,
            infants: row.infants,
            mealPlan: row.mealPlan || "",
            confirmationNo: row.confirmationNo || "",
            buyingCostPerNight: row.buyingCostPerNight,
            sellingPricePerNight: row.sellingPricePerNight,
          }))
        );
      } catch (err) {
        console.error(err);
        setError("Could not load this booking.");
      } finally {
        setLoading(false);
      }
    }
    loadBooking();
  }, [id]);

  function updateHotelRow(rowId: string, field: keyof HotelRow, value: string | number) {
    setHotels((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }

  function addHotelRow() {
    setHotels((rows) => [...rows, emptyHotelRow()]);
  }

  function removeHotelRow(rowId: string) {
    setHotels((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  }

  const lineTotals = hotels
    .filter((row) => row.checkIn && row.checkOut)
    .map((row) => calculateHotelEntryTotals(row));
  const { grossBuying, grossSelling } = sumLineItems(
    lineTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/hotel-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, hotels }),
      });

      if (!res.ok) throw new Error("Server rejected the update");

      router.push("/portal/hotel-bookings/manage");
    } catch (err) {
      console.error(err);
      setError("Could not save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Edit Hotel Booking</h1>

      <form onSubmit={handleSubmit}>
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <fieldset className="border p-4 mb-4">
          <legend className="font-bold px-1">Hotels</legend>

          {hotels.map((row, index) => (
            <div key={row.id} className="border p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <strong>Hotel {index + 1}</strong>
                <button type="button" className="border px-2" onClick={() => removeHotelRow(row.id)}>
                  Remove
                </button>
              </div>

              <div className="mb-2">
                <label className="block">Hotel Name</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.hotelName}
                  onChange={(e) => updateHotelRow(row.id, "hotelName", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">City</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.city}
                  onChange={(e) => updateHotelRow(row.id, "city", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Room Type</label>
                <select
                  className="border p-2 w-full"
                  value={row.roomType}
                  onChange={(e) => updateHotelRow(row.id, "roomType", e.target.value)}
                >
                  {ROOM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block">Check-In Date</label>
                <input
                  type="date"
                  className="border p-2 w-full"
                  value={row.checkIn}
                  onChange={(e) => updateHotelRow(row.id, "checkIn", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Check-Out Date</label>
                <input
                  type="date"
                  className="border p-2 w-full"
                  value={row.checkOut}
                  onChange={(e) => updateHotelRow(row.id, "checkOut", e.target.value)}
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Nights (auto-calculated)</label>
                <input
                  type="text"
                  className="border p-2 w-full bg-gray-100"
                  value={row.checkIn && row.checkOut ? calculateHotelEntryTotals(row).nights : 0}
                  disabled
                />
              </div>

              <div className="mb-2">
                <label className="block">No. of Rooms</label>
                <input
                  type="number"
                  min={1}
                  className="border p-2 w-full"
                  value={row.rooms}
                  onChange={(e) => updateHotelRow(row.id, "rooms", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="mb-2">
                <label className="block">No. of Adults</label>
                <input
                  type="number"
                  min={1}
                  className="border p-2 w-full"
                  value={row.adults}
                  onChange={(e) => updateHotelRow(row.id, "adults", parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="mb-2">
                <label className="block">No. of Children</label>
                <input
                  type="number"
                  min={0}
                  className="border p-2 w-full"
                  value={row.children}
                  onChange={(e) => updateHotelRow(row.id, "children", parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="mb-2">
                <label className="block">No. of Infants</label>
                <input
                  type="number"
                  min={0}
                  className="border p-2 w-full"
                  value={row.infants}
                  onChange={(e) => updateHotelRow(row.id, "infants", parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="mb-2">
                <label className="block">Meal Plan</label>
                <select
                  className="border p-2 w-full"
                  value={row.mealPlan}
                  onChange={(e) => updateHotelRow(row.id, "mealPlan", e.target.value)}
                >
                  <option value="">Select meal plan</option>
                  {MEAL_PLANS.map((plan) => (
                    <option key={plan.value} value={plan.value}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block">Confirmation / Voucher No</label>
                <input
                  type="text"
                  className="border p-2 w-full"
                  value={row.confirmationNo}
                  onChange={(e) => updateHotelRow(row.id, "confirmationNo", e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="block">Buying Cost (Per Night)</label>
                <input
                  type="number"
                  step="0.01"
                  className="border p-2 w-full"
                  value={row.buyingCostPerNight}
                  onChange={(e) =>
                    updateHotelRow(row.id, "buyingCostPerNight", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block">Selling Price (Per Night)</label>
                <input
                  type="number"
                  step="0.01"
                  className="border p-2 w-full"
                  value={row.sellingPricePerNight}
                  onChange={(e) =>
                    updateHotelRow(row.id, "sellingPricePerNight", parseFloat(e.target.value) || 0)
                  }
                  required
                />
              </div>
            </div>
          ))}

          <button type="button" className="border px-3 py-1" onClick={addHotelRow}>
            + Add Another Hotel
          </button>
        </fieldset>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
        />

        {error && <p className="text-red-600 mb-2">{error}</p>}

        <button type="submit" className="border px-4 py-2 font-bold" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}