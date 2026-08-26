// src/app/portal/(protected)/hotel-bookings/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function AddHotelBookingPage() {
  const router = useRouter();
  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [hotels, setHotels] = useState<HotelRow[]>([emptyHotelRow()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateHotelRow(id: string, field: keyof HotelRow, value: string | number) {
    setHotels((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }
  function addHotelRow() {
    setHotels((rows) => [...rows, emptyHotelRow()]);
  }
  function removeHotelRow(id: string) {
    setHotels((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
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
      const res = await fetch("/api/hotel-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, vendorName, paymentStatus, hotels }),
      });
      if (!res.ok) throw new Error("Server rejected the booking");
      router.push("/portal/hotel-bookings/manage");
    } catch (err) {
      console.error(err);
      setError("Could not save the booking. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Add Hotel Booking</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Vendor
          </h2>
          <div>
            <label className={labelClass}>Vendor Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Who you bought this hotel from (supplier, not the sales agent)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Hotels
          </h2>

          <div className="space-y-4">
            {hotels.map((row, index) => (
              <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-[#121212]">Hotel {index + 1}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    onClick={() => removeHotelRow(row.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Hotel Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.hotelName}
                      onChange={(e) => updateHotelRow(row.id, "hotelName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.city}
                      onChange={(e) => updateHotelRow(row.id, "city", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Room Type</label>
                    <select
                      className={inputClass}
                      value={row.roomType}
                      onChange={(e) => updateHotelRow(row.id, "roomType", e.target.value)}
                    >
                      {ROOM_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Meal Plan</label>
                    <select
                      className={inputClass}
                      value={row.mealPlan}
                      onChange={(e) => updateHotelRow(row.id, "mealPlan", e.target.value)}
                    >
                      <option value="">Select meal plan</option>
                      {MEAL_PLANS.map((plan) => (
                        <option key={plan.value} value={plan.value}>{plan.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Check-In Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={row.checkIn}
                      onChange={(e) => updateHotelRow(row.id, "checkIn", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Check-Out Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={row.checkOut}
                      onChange={(e) => updateHotelRow(row.id, "checkOut", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Nights (auto)</label>
                    <input
                      type="text"
                      className={`${inputClass} bg-gray-100 text-gray-500`}
                      value={row.checkIn && row.checkOut ? calculateHotelEntryTotals(row).nights : 0}
                      disabled
                    />
                  </div>
                  <div>
                    <label className={labelClass}>No. of Rooms</label>
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={row.rooms}
                      onChange={(e) => updateHotelRow(row.id, "rooms", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Adults</label>
                    <input
                      type="number"
                      min={1}
                      className={inputClass}
                      value={row.adults}
                      onChange={(e) => updateHotelRow(row.id, "adults", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Children</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={row.children}
                      onChange={(e) => updateHotelRow(row.id, "children", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Infants</label>
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={row.infants}
                      onChange={(e) => updateHotelRow(row.id, "infants", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Confirmation / Voucher No</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.confirmationNo}
                      onChange={(e) => updateHotelRow(row.id, "confirmationNo", e.target.value)}
                    />
                  </div>
                  <div />
                  <div>
                    <label className={labelClass}>Buying Cost (Per Night)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.buyingCostPerNight}
                      onChange={(e) => updateHotelRow(row.id, "buyingCostPerNight", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Selling Price (Per Night)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.sellingPricePerNight}
                      onChange={(e) => updateHotelRow(row.id, "sellingPricePerNight", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="w-full mt-4 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
            onClick={addHotelRow}
          >
            + Add Another Hotel
          </button>
        </section>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={setPaymentStatus}
        />

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Hotel Booking"}
        </button>
      </form>
    </div>
  );
}