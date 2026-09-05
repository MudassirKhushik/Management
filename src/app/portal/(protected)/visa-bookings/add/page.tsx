// src/app/portal/(protected)/visa-bookings/add/page.tsx

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
import { VisaRow, PROCESSING_TYPES, emptyVisaRow } from "@/src/lib/visaBookingTypes";
import { sumLineItems } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function AddVisaBookingPage() {
  const router = useRouter();
  const [header, setHeader] = useState<GlobalHeaderData>({ ...emptyGlobalHeader, currency: "PKR" });
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [entries, setEntries] = useState<VisaRow[]>([emptyVisaRow()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Add-mode initial payment — turned into a real Payment row right after
  // the booking is created (same flow as Hotel's add page).
  const [initialPaidAmount, setInitialPaidAmount] = useState("");
  const [initialBankAccountId, setInitialBankAccountId] = useState("");

  function updateRow(id: string, field: keyof VisaRow, value: string | number) {
    setEntries((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }
  function addRow() {
    setEntries((rows) => [...rows, emptyVisaRow()]);
  }
  function removeRow(id: string) {
    setEntries((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
  }

  const { grossBuying, grossSelling } = sumLineItems(
    entries.map((row) => ({ buyingCost: row.buyingCost, sellingPrice: row.sellingPrice }))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/visa-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, vendorName, entries }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server rejected the booking");
      }
      const created = await res.json();

      // Initial payment is a separate step: the booking must exist before a
      // Payment can point at it. Failure here shouldn't lose the booking —
      // it's already saved, so we warn and move on rather than throwing.
      const paid = parseFloat(initialPaidAmount);
      if (paid > 0) {
        const payRes = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingType: "visa",
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

      router.push("/portal/visa-bookings/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save the booking. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Add Visa Booking</h1>

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
              placeholder="Who you bought this visa from (supplier, not the sales agent)"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
            Visa Applicants
          </h2>

          <div className="space-y-4">
            {entries.map((row, index) => (
              <div key={row.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-[#121212]">Applicant {index + 1}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    onClick={() => removeRow(row.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Visa Category</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Saudi Umrah, UK Tourist, Schengen Business"
                      value={row.visaCategory}
                      onChange={(e) => updateRow(row.id, "visaCategory", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Applicant Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.applicantName}
                      onChange={(e) => updateRow(row.id, "applicantName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Passport Number</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={row.passportNumber}
                      onChange={(e) => updateRow(row.id, "passportNumber", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Applicant's employer (optional)"
                      value={row.companyName}
                      onChange={(e) => updateRow(row.id, "companyName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Processing Type</label>
                    <select
                      className={inputClass}
                      value={row.processingType}
                      onChange={(e) => updateRow(row.id, "processingType", e.target.value)}
                    >
                      <option value="">Select processing type</option>
                      {PROCESSING_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Submission Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={row.submissionDate}
                      onChange={(e) => updateRow(row.id, "submissionDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Expiry Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={row.expiryDate}
                      onChange={(e) => updateRow(row.id, "expiryDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Buying Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.buyingCost}
                      onChange={(e) => updateRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={row.sellingPrice}
                      onChange={(e) => updateRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
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
            onClick={addRow}
          >
            + Add Another Applicant
          </button>
        </section>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
          bookingType="visa"
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
          {saving ? "Saving..." : "Save Visa Booking"}
        </button>
      </form>
    </div>
  );
}