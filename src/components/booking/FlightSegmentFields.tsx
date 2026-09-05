// src/components/booking/FlightSegmentFields.tsx
//
// One flight leg's worth of inputs. Shared by the flight Add and Edit pages
// (and later the package wizard) so the passenger-list UI and the six
// per-pax price fields only exist in one place.

"use client";

import { FlightRow, TRAVEL_CLASSES } from "@/src/lib/flightBookingTypes";
import { calculateFlightSegmentTotals } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function FlightSegmentFields({
  row,
  index,
  currency,
  onChange,
  onRemove,
}: {
  row: FlightRow;
  index: number;
  currency: string;
  onChange: (field: keyof FlightRow, value: any) => void;
  onRemove: () => void;
}) {
  const totals = calculateFlightSegmentTotals(row);

  function updatePassenger(i: number, value: string) {
    const next = [...row.passengerNames];
    next[i] = value;
    onChange("passengerNames", next);
  }
  function addPassenger() {
    onChange("passengerNames", [...row.passengerNames, ""]);
  }
  function removePassenger(i: number) {
    // Always keep at least one input so the field never disappears entirely.
    const next = row.passengerNames.filter((_, idx) => idx !== i);
    onChange("passengerNames", next.length > 0 ? next : [""]);
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-[#121212]">Flight {index + 1}</span>
        <button
          type="button"
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Airline</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Saudia, PIA, Emirates"
            value={row.airline}
            onChange={(e) => onChange("airline", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Flight No.</label>
          <input
            type="text"
            className={inputClass}
            value={row.flightNo}
            onChange={(e) => onChange("flightNo", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>PNR</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Booking reference (optional)"
            value={row.pnr}
            onChange={(e) => onChange("pnr", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Travel Class</label>
          <select
            className={inputClass}
            value={row.travelClass}
            onChange={(e) => onChange("travelClass", e.target.value)}
          >
            {TRAVEL_CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Departure Airport</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. KHI or Karachi"
            value={row.departureAirport}
            onChange={(e) => onChange("departureAirport", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Arrival Airport</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. JED or Jeddah"
            value={row.arrivalAirport}
            onChange={(e) => onChange("arrivalAirport", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Departure Date &amp; Time</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={row.departureDateTime}
            onChange={(e) => onChange("departureDateTime", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Arrival Date &amp; Time</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={row.arrivalDateTime}
            onChange={(e) => onChange("arrivalDateTime", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Baggage</label>
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. 2 x 23kg"
            value={row.baggage}
            onChange={(e) => onChange("baggage", e.target.value)}
          />
        </div>
      </div>

      {/* Headcount drives the pricing below — 2 adults at 50,000 each is
          100,000 for this leg. */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label className={labelClass}>Adults</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={row.adults}
            onChange={(e) => onChange("adults", parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className={labelClass}>Children</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={row.children}
            onChange={(e) => onChange("children", parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className={labelClass}>Infants</label>
          <input
            type="number"
            min="0"
            className={inputClass}
            value={row.infants}
            onChange={(e) => onChange("infants", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Passenger Names
        </p>
        <div className="space-y-2">
          {row.passengerNames.map((name, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder={`Passenger ${i + 1} — as printed on passport`}
                value={name}
                onChange={(e) => updatePassenger(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removePassenger(i)}
                className="shrink-0 px-3 rounded-lg border border-gray-200 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPassenger}
          className="mt-2 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: "var(--agency-color)" }}
        >
          + Add Another Passenger
        </button>
      </div>

      {/* Per passenger, per leg. Infants are priced here — unlike hotel,
          where they're headcount-only. */}
      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Price per Passenger ({currency})
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Adult Buying</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={row.adultBuyingPricePerLeg}
              onChange={(e) => onChange("adultBuyingPricePerLeg", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>Adult Selling</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={row.adultSellingPricePerLeg}
              onChange={(e) => onChange("adultSellingPricePerLeg", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>Child Buying</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={row.childBuyingPricePerLeg}
              onChange={(e) => onChange("childBuyingPricePerLeg", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>Child Selling</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={row.childSellingPricePerLeg}
              onChange={(e) => onChange("childSellingPricePerLeg", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>Infant Buying</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={row.infantBuyingPricePerLeg}
              onChange={(e) => onChange("infantBuyingPricePerLeg", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className={labelClass}>Infant Selling</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={row.infantSellingPricePerLeg}
              onChange={(e) => onChange("infantSellingPricePerLeg", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className="text-gray-500">
            Leg Buying: <span className="font-bold text-[#121212]">{currency} {totals.buyingTotal.toFixed(2)}</span>
          </span>
          <span className="text-gray-500">
            Leg Selling: <span className="font-bold text-[#121212]">{currency} {totals.sellingTotal.toFixed(2)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}