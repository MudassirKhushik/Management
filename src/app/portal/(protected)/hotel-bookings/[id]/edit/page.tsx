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
import { calculateHotelEntryTotals, sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";
import PaymentHistorySection from "@/src/components/booking/PaymentHistorySection";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function EditHotelBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [exchangeRate, setExchangeRate] = useState("");
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
        setVendorName(data.vendorName || "");
        setPaymentStatus(data.paymentStatus || "Pending");
        setExchangeRate(String(data.exchangeRate ?? ""));
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
            adultBuyingPricePerNight: row.adultBuyingPricePerNight,
            adultSellingPricePerNight: row.adultSellingPricePerNight,
            childBuyingPricePerNight: row.childBuyingPricePerNight,
            childSellingPricePerNight: row.childSellingPricePerNight,
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
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: footer.discount,
    vatPercent: footer.vatPercent,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
      setError("Exchange rate is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/hotel-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, vendorName, paymentStatus, exchangeRate, hotels }),
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

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Edit Hotel Booking</h1>

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
          <div className="mt-3">
            <label className={labelClass}>Exchange Rate (1 {header.currency || "SAR"} = ? PKR) *</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              placeholder="e.g. 75"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Required — used to record this booking's revenue/profit in PKR for internal reporting.
            </p>
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
                </div>

                {/* Phase 1a: separate Adult / Child pricing, per person per night.
                    Infants stay headcount-only — no price fields for them. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>Adult Buying Price (Per Night)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.adultBuyingPricePerNight}
                      onChange={(e) =>
                        updateHotelRow(row.id, "adultBuyingPricePerNight", parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Adult Selling Price (Per Night)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.adultSellingPricePerNight}
                      onChange={(e) =>
                        updateHotelRow(row.id, "adultSellingPricePerNight", parseFloat(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Child Buying Price (Per Night)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.childBuyingPricePerNight}
                      onChange={(e) =>
                        updateHotelRow(row.id, "childBuyingPricePerNight", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Child Selling Price (Per Night)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.childSellingPricePerNight}
                      onChange={(e) =>
                        updateHotelRow(row.id, "childSellingPricePerNight", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                {row.checkIn && row.checkOut && (
                  <p className="text-xs text-gray-400 mt-2">
                    Line total — Buying: {calculateHotelEntryTotals(row).buyingTotal.toFixed(2)} · Selling:{" "}
                    {calculateHotelEntryTotals(row).sellingTotal.toFixed(2)}
                  </p>
                )}
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
          bookingId={id}
          bookingType="hotel"
        />

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Item 3: remaining amount can now be managed right here on Edit,
          not just the View page — reuses the exact same component/logic. */}
      <div className="mt-5">
        <PaymentHistorySection bookingType="hotel" bookingId={id} netTotal={totals.netTotal} currency={header.currency} />
      </div>
    </div>
  );
}