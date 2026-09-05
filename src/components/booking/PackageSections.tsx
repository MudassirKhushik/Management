// src/components/booking/PackageSections.tsx
//
// The four section row-editors for the package wizard, in one place so the
// Add and Edit pages don't duplicate ~400 lines of identical inputs.

"use client";

import { HotelRow, ROOM_TYPES, MEAL_PLANS } from "@/src/lib/hotelBookingTypes";
import { TransportRow, VEHICLE_TYPES } from "@/src/lib/transportBookingTypes";
import { VisaRow, PROCESSING_TYPES } from "@/src/lib/visaBookingTypes";
import { calculateHotelEntryTotals } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

function RowShell({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-[#121212]">{title}</span>
        <button
          type="button"
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
      {children}
    </div>
  );
}

export function HotelRowFields({
  row,
  index,
  exchangeRate,
  onChange,
  onRemove,
}: {
  row: HotelRow;
  index: number;
  exchangeRate: number;
  onChange: (field: keyof HotelRow, value: any) => void;
  onRemove: () => void;
}) {
  const totals = calculateHotelEntryTotals(row);

  return (
    <RowShell title={`Hotel ${index + 1}`} onRemove={onRemove}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Hotel Name</label>
          <input type="text" className={inputClass} value={row.hotelName}
            onChange={(e) => onChange("hotelName", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" className={inputClass} placeholder="e.g. Makkah" value={row.city}
            onChange={(e) => onChange("city", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Room Type</label>
          <select className={inputClass} value={row.roomType} onChange={(e) => onChange("roomType", e.target.value)}>
            {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Meal Plan</label>
          <select className={inputClass} value={row.mealPlan} onChange={(e) => onChange("mealPlan", e.target.value)}>
            <option value="">Select meal plan</option>
            {MEAL_PLANS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Check-in</label>
          <input type="date" className={inputClass} value={row.checkIn}
            onChange={(e) => onChange("checkIn", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Check-out</label>
          <input type="date" className={inputClass} value={row.checkOut}
            onChange={(e) => onChange("checkOut", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Confirmation No.</label>
          <input type="text" className={inputClass} value={row.confirmationNo}
            onChange={(e) => onChange("confirmationNo", e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-3">
        <div>
          <label className={labelClass}>Rooms</label>
          <input type="number" min="1" className={inputClass} value={row.rooms}
            onChange={(e) => onChange("rooms", parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <label className={labelClass}>Adults</label>
          <input type="number" min="0" className={inputClass} value={row.adults}
            onChange={(e) => onChange("adults", parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelClass}>Children</label>
          <input type="number" min="0" className={inputClass} value={row.children}
            onChange={(e) => onChange("children", parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelClass}>Infants</label>
          <input type="number" min="0" className={inputClass} value={row.infants}
            onChange={(e) => onChange("infants", parseInt(e.target.value) || 0)} />
        </div>
      </div>

      {/* Adults/children describe ONE room's occupancy — the rooms count
          multiplies in on top. Rates are in SAR, converted below. */}
      <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Price per Person / Night (SAR)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Adult Buying</label>
            <input type="number" step="0.01" className={inputClass} value={row.adultBuyingPricePerNight}
              onChange={(e) => onChange("adultBuyingPricePerNight", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Adult Selling</label>
            <input type="number" step="0.01" className={inputClass} value={row.adultSellingPricePerNight}
              onChange={(e) => onChange("adultSellingPricePerNight", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Child Buying</label>
            <input type="number" step="0.01" className={inputClass} value={row.childBuyingPricePerNight}
              onChange={(e) => onChange("childBuyingPricePerNight", parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelClass}>Child Selling</label>
            <input type="number" step="0.01" className={inputClass} value={row.childSellingPricePerNight}
              onChange={(e) => onChange("childSellingPricePerNight", parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className="text-gray-500">Nights: <span className="font-bold text-[#121212]">{totals.nights}</span></span>
          <span className="text-gray-500">
            Line Selling: <span className="font-bold text-[#121212]">SAR {totals.sellingTotal.toFixed(2)}</span>
          </span>
          <span className="text-gray-500">
            = <span className="font-bold" style={{ color: "var(--agency-color)" }}>
              PKR {(totals.sellingTotal * (exchangeRate || 1)).toFixed(2)}
            </span>
          </span>
        </div>
      </div>
    </RowShell>
  );
}

export function TransportRowFields({
  row,
  index,
  currency,
  onChange,
  onRemove,
}: {
  row: TransportRow;
  index: number;
  currency: string;
  onChange: (field: keyof TransportRow, value: any) => void;
  onRemove: () => void;
}) {
  return (
    <RowShell title={`Transfer ${index + 1}`} onRemove={onRemove}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Vehicle</label>
          <select className={inputClass} value={row.vehicle} onChange={(e) => onChange("vehicle", e.target.value)}>
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Sector</label>
          <input type="text" className={inputClass} placeholder="e.g. Jeddah to Makkah" value={row.sector}
            onChange={(e) => onChange("sector", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Pickup Date</label>
          <input type="date" className={inputClass} value={row.pickupDate}
            onChange={(e) => onChange("pickupDate", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Pickup Time</label>
          <input type="time" className={inputClass} value={row.pickupTime}
            onChange={(e) => onChange("pickupTime", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Quantity</label>
          <input type="number" min="1" className={inputClass} value={row.qty}
            onChange={(e) => onChange("qty", parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <label className={labelClass}>Driver Contact</label>
          <input type="text" className={inputClass} placeholder="Voucher only (optional)" value={row.driverContact}
            onChange={(e) => onChange("driverContact", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Total Buying Cost ({currency})</label>
          <input type="number" step="0.01" className={inputClass} value={row.buyingCost}
            onChange={(e) => onChange("buyingCost", parseFloat(e.target.value) || 0)} required />
        </div>
        <div>
          <label className={labelClass}>Total Selling Price ({currency})</label>
          <input type="number" step="0.01" className={inputClass} value={row.sellingPrice}
            onChange={(e) => onChange("sellingPrice", parseFloat(e.target.value) || 0)} required />
        </div>
      </div>
    </RowShell>
  );
}

export function VisaRowFields({
  row,
  index,
  currency,
  onChange,
  onRemove,
}: {
  row: VisaRow;
  index: number;
  currency: string;
  onChange: (field: keyof VisaRow, value: any) => void;
  onRemove: () => void;
}) {
  return (
    <RowShell title={`Applicant ${index + 1}`} onRemove={onRemove}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Visa Category</label>
          <input type="text" className={inputClass} placeholder="e.g. Saudi Umrah" value={row.visaCategory}
            onChange={(e) => onChange("visaCategory", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Applicant Name</label>
          <input type="text" className={inputClass} value={row.applicantName}
            onChange={(e) => onChange("applicantName", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Passport Number</label>
          <input type="text" className={inputClass} value={row.passportNumber}
            onChange={(e) => onChange("passportNumber", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Company Name</label>
          <input type="text" className={inputClass} placeholder="Employer (optional)" value={row.companyName}
            onChange={(e) => onChange("companyName", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Processing Type</label>
          <select className={inputClass} value={row.processingType}
            onChange={(e) => onChange("processingType", e.target.value)}>
            <option value="">Select processing type</option>
            {PROCESSING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Submission Date</label>
          <input type="date" className={inputClass} value={row.submissionDate}
            onChange={(e) => onChange("submissionDate", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Expiry Date</label>
          <input type="date" className={inputClass} value={row.expiryDate}
            onChange={(e) => onChange("expiryDate", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Buying Cost ({currency})</label>
          <input type="number" step="0.01" className={inputClass} value={row.buyingCost}
            onChange={(e) => onChange("buyingCost", parseFloat(e.target.value) || 0)} required />
        </div>
        <div>
          <label className={labelClass}>Selling Price ({currency})</label>
          <input type="number" step="0.01" className={inputClass} value={row.sellingPrice}
            onChange={(e) => onChange("sellingPrice", parseFloat(e.target.value) || 0)} required />
        </div>
      </div>
    </RowShell>
  );
}

export function SectionCard({
  title,
  enabled,
  onToggle,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <label className="flex items-center gap-3 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 rounded"
          style={{ accentColor: "var(--agency-color)" }}
        />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--agency-color)" }}>
          {title}
        </span>
      </label>

      {enabled && (
        <>
          <div className="space-y-4">{children}</div>
          <button
            type="button"
            onClick={onAdd}
            className="w-full mt-4 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
          >
            {addLabel}
          </button>
        </>
      )}
    </section>
  );
}