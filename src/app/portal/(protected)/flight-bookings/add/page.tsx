// src/app/portal/(protected)/flight-bookings/add/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import FlightSegmentFields from "@/src/components/booking/FlightSegmentFields";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { FlightRow, emptyFlightRow } from "@/src/lib/flightBookingTypes";
import { calculateFlightSegmentTotals, sumLineItems } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function AddFlightBookingPage() {
  const router = useRouter();
  const [header, setHeader] = useState<GlobalHeaderData>({ ...emptyGlobalHeader, currency: "PKR" });
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [segments, setSegments] = useState<FlightRow[]>([emptyFlightRow()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [initialPaidAmount, setInitialPaidAmount] = useState("");
  const [initialBankAccountId, setInitialBankAccountId] = useState("");

  function updateRow(id: string, field: keyof FlightRow, value: any) {
    setSegments((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }
  function addRow() {
    setSegments((rows) => [...rows, emptyFlightRow()]);
  }
  function removeRow(id: string) {
    setSegments((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  const { grossBuying, grossSelling } = sumLineItems(
    segments.map((row) => {
      const t = calculateFlightSegmentTotals(row);
      return { buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal };
    })
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/flight-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, vendorName, segments }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server rejected the booking");
      }
      const created = await res.json();

      // Separate step: the booking must exist before a Payment can point at
      // it. A failure here shouldn't lose the booking — it's already saved.
      const paid = parseFloat(initialPaidAmount);
      if (paid > 0) {
        const payRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingType: "flight",
            bookingId: created.id,
            amount: paid,
            paidOn: new Date().toISOString().slice(0, 10),
            bankAccountId: initialBankAccountId || null,
          }),
        });
        if (!payRes.ok) {
          alert("Booking saved, but the initial payment could not be recorded. Please add it from the Edit page.");
        }
      }

      router.push("/portal/flight-bookings/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save the booking. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Add Flight Booking</h1>

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
              placeholder="Who you bought these tickets from (consolidator, not the sales agent)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Flights
          </h2>

          <div className="space-y-4">
            {segments.map((row, index) => (
              <FlightSegmentFields
                key={row.id}
                row={row}
                index={index}
                currency={header.currency}
                onChange={(field, value) => updateRow(row.id, field, value)}
                onRemove={() => removeRow(row.id)}
              />
            ))}
          </div>

          <button
            type="button"
            className="w-full mt-4 rounded-lg border-2 border-dashed py-2.5 text-sm font-semibold transition-colors hover:bg-black/[0.02]"
            style={{ borderColor: "var(--agency-color)", color: "var(--agency-color)" }}
            onClick={addRow}
          >
            + Add Another Flight
          </button>
        </section>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
          bookingType="flight"
          initialPaidAmount={initialPaidAmount}
          onInitialPaidAmountChange={setInitialPaidAmount}
          initialBankAccountId={initialBankAccountId}
          onInitialBankAccountIdChange={setInitialBankAccountId}
        />

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg py-3 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Flight Booking"}
        </button>
      </form>
    </div>
  );
}