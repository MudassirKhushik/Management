// src/app/portal/(protected)/visa-bookings/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import GlobalHeaderFields from "@/src/components/booking/GlobalHeaderFields";
import PricingFooterFields from "@/src/components/booking/PricingFooterFields";
import PaymentHistorySection from "@/src/components/booking/PaymentHistorySection";
import {
  emptyGlobalHeader,
  emptyFooterData,
  GlobalHeaderData,
  FooterData,
} from "@/src/lib/sharedBookingFields";
import { VisaRow, PROCESSING_TYPES, emptyVisaRow } from "@/src/lib/visaBookingTypes";
import { sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export default function EditVisaBookingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [vendorName, setVendorName] = useState("");
  const [entries, setEntries] = useState<VisaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/visa-bookings/${id}`);
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();

        setHeader({
          agentName: data.agentName,
          guestName: data.guestName,
          nationality: data.nationality,
          mobileNo: data.mobileNo || "",
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
        setEntries(
          data.entries.map((e: any) => ({
            id: e.id,
            visaCategory: e.visaCategory,
            applicantName: e.applicantName,
            passportNumber: e.passportNumber,
            companyName: e.companyName || "",
            processingType: e.processingType || "",
            submissionDate: e.submissionDate ? e.submissionDate.slice(0, 10) : "",
            expiryDate: e.expiryDate ? e.expiryDate.slice(0, 10) : "",
            buyingCost: e.buyingCost,
            sellingPrice: e.sellingPrice,
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

  function updateRow(rowId: string, field: keyof VisaRow, value: string | number) {
    setEntries((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  }
  function addRow() {
    setEntries((rows) => [...rows, emptyVisaRow()]);
  }
  function removeRow(rowId: string) {
    setEntries((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  }

  const { grossBuying, grossSelling } = sumLineItems(
    entries.map((row) => ({ buyingCost: row.buyingCost, sellingPrice: row.sellingPrice }))
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
    setSaving(true);
    try {
      const res = await fetch(`/api/visa-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, vendorName, entries }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server rejected the update");
      }
      router.push("/portal/visa-bookings/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-6 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-full mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#121212]">Edit Visa Booking</h1>

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
          bookingId={id}
          bookingType="visa"
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

      {/* Outside the <form> on purpose — PaymentHistorySection has its own
          form inside it, and nested forms are invalid HTML. */}
      <div className="mt-5">
        <PaymentHistorySection
          bookingType="visa"
          bookingId={id}
          netTotal={totals.netTotal}
          currency={header.currency}
        />
      </div>
    </div>
  );
}