// src/components/booking/GlobalHeaderFields.tsx
//
// Shared by every booking type (Hotel/Transport/Flight/Visa/Package) — fixing
// the styling here fixes the "Customer Details" section everywhere at once.

"use client";

import { GlobalHeaderData, CURRENCIES } from "@/src/lib/sharedBookingFields";
import { COUNTRIES } from "@/src/lib/countryList";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

type Props = {
  value: GlobalHeaderData;
  onChange: (field: keyof GlobalHeaderData, newValue: string) => void;
};

export default function GlobalHeaderFields({ value, onChange }: Props) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
        Customer Details
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Agent / Company Name</label>
          <input
            type="text"
            className={inputClass}
            value={value.agentName}
            onChange={(e) => onChange("agentName", e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Guest / Group Leader Name</label>
          <input
            type="text"
            className={inputClass}
            value={value.guestName}
            onChange={(e) => onChange("guestName", e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Nationality</label>
          <select
            className={inputClass}
            value={value.nationality}
            onChange={(e) => onChange("nationality", e.target.value)}
            required
          >
            <option value="">Select nationality</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Mobile / WhatsApp</label>
          <input
            type="tel"
            className={inputClass}
            placeholder="+92 300 1234567"
            value={value.mobileNo}
            onChange={(e) => onChange("mobileNo", e.target.value)}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Reference / PNR Number</label>
          <input
            type="text"
            className={inputClass}
            value={value.referenceNo}
            onChange={(e) => onChange("referenceNo", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Currency</label>
          <select
            className={inputClass}
            value={value.currency}
            onChange={(e) => onChange("currency", e.target.value)}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}