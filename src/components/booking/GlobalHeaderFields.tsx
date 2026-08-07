// src/components/booking/GlobalHeaderFields.tsx
//
// The block of fields every booking form starts with:
// Agent Name, Guest Name, Nationality, Mobile, Reference/PNR, Currency.
//
// This is a "controlled component": the parent form owns the actual data
// (in useState), and passes it in as `value`, and this component calls
// `onChange` whenever a field is typed into. This is the same pattern your
// existing add/edit forms already use — nothing new to learn here, just
// pulled out into its own file so we don't retype these 6 fields 5 times.
//
// No styling yet on purpose (plain <div>/<label>/<input>, a little
// spacing) — matches the "functionality before styling" rule. The full
// CSS pass comes later.

"use client";

import { GlobalHeaderData, CURRENCIES } from "@/src/lib/sharedBookingFields";
import { COUNTRIES } from "@/src/lib/countryList";

type Props = {
  value: GlobalHeaderData;
  onChange: (field: keyof GlobalHeaderData, newValue: string) => void;
};

export default function GlobalHeaderFields({ value, onChange }: Props) {
  return (
    <fieldset className="border p-4 mb-4">
      <legend className="font-bold px-1">Customer Details</legend>

      <div className="mb-2">
        <label className="block">Agent / Company Name</label>
        <input
          type="text"
          className="border p-2 w-full"
          value={value.agentName}
          onChange={(e) => onChange("agentName", e.target.value)}
          required
        />
      </div>

      <div className="mb-2">
        <label className="block">Guest / Group Leader Name</label>
        <input
          type="text"
          className="border p-2 w-full"
          value={value.guestName}
          onChange={(e) => onChange("guestName", e.target.value)}
          required
        />
      </div>

      <div className="mb-2">
        <label className="block">Nationality</label>
        <select
          className="border p-2 w-full"
          value={value.nationality}
          onChange={(e) => onChange("nationality", e.target.value)}
          required
        >
          <option value="">Select nationality</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="block">Mobile / WhatsApp</label>
        <input
          type="tel"
          className="border p-2 w-full"
          placeholder="+92 300 1234567"
          value={value.mobileNo}
          onChange={(e) => onChange("mobileNo", e.target.value)}
          required
        />
      </div>

      <div className="mb-2">
        <label className="block">Reference / PNR Number</label>
        <input
          type="text"
          className="border p-2 w-full"
          value={value.referenceNo}
          onChange={(e) => onChange("referenceNo", e.target.value)}
        />
      </div>

      <div className="mb-2">
        <label className="block">Currency</label>
        <select
          className="border p-2 w-full"
          value={value.currency}
          onChange={(e) => onChange("currency", e.target.value)}
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}