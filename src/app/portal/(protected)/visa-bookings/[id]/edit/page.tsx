// src/app/portal/(protected)/visa-bookings/[id]/edit/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditVisaBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [header, setHeader] = useState<GlobalHeaderData>(emptyGlobalHeader);
  const [footer, setFooter] = useState<FooterData>(emptyFooterData);
  const [entries, setEntries] = useState<VisaRow[]>([emptyVisaRow()]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/visa-bookings/${id}`);
        if (!res.ok) throw new Error("Not found");
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

        setEntries(
          data.entries.map((e: any) => ({
            id: e.id,
            visaCategory: e.visaCategory,
            applicantName: e.applicantName,
            passportNumber: e.passportNumber,
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
    load();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/visa-bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...header, ...footer, entries }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      router.push("/portal/visa-bookings/manage");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not save changes. Please check the fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Edit Visa Booking</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 mb-4 rounded-md font-mono text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <GlobalHeaderFields
          value={header}
          onChange={(field, value) => setHeader((h) => ({ ...h, [field]: value }))}
        />

        <fieldset className="border p-4 mb-4 rounded-md bg-white shadow-sm">
          <legend className="font-bold px-2 text-sm text-gray-700">Visa Applicants</legend>

          {entries.map((row, index) => (
            <div key={row.id} className="border p-4 mb-4 rounded bg-gray-50 relative">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-800">Applicant #{index + 1}</span>
                {entries.length > 1 && (
                  <button
                    type="button"
                    className="text-sm border border-red-300 text-red-600 px-3 py-1 rounded bg-white hover:bg-red-50 transition"
                    onClick={() => removeRow(row.id)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Visa Category *</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    placeholder="e.g. Saudi Umrah, UK Tourist, Schengen Business"
                    value={row.visaCategory}
                    onChange={(e) => updateRow(row.id, "visaCategory", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Applicant Name *</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={row.applicantName}
                    onChange={(e) => updateRow(row.id, "applicantName", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Passport Number *</label>
                  <input
                    type="text"
                    className="border p-2 w-full rounded bg-white"
                    value={row.passportNumber}
                    onChange={(e) => updateRow(row.id, "passportNumber", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Processing Type</label>
                  <select
                    className="border p-2 w-full rounded bg-white"
                    value={row.processingType}
                    onChange={(e) => updateRow(row.id, "processingType", e.target.value)}
                  >
                    <option value="">Select processing type</option>
                    {PROCESSING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Submission Date</label>
                  <input
                    type="date"
                    className="border p-2 w-full rounded bg-white"
                    value={row.submissionDate}
                    onChange={(e) => updateRow(row.id, "submissionDate", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    className="border p-2 w-full rounded bg-white"
                    value={row.expiryDate}
                    onChange={(e) => updateRow(row.id, "expiryDate", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Buying Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full rounded bg-white"
                    value={row.buyingCost || ""}
                    onChange={(e) => updateRow(row.id, "buyingCost", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border p-2 w-full rounded bg-white"
                    value={row.sellingPrice || ""}
                    onChange={(e) => updateRow(row.id, "sellingPrice", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="w-full mt-2 border border-dashed border-blue-400 text-blue-600 font-medium py-2 rounded bg-blue-50 hover:bg-blue-100 transition"
            onClick={addRow}
          >
            + Add Another Applicant
          </button>
        </fieldset>

        <PricingFooterFields
          value={footer}
          onChange={(field, value) => setFooter((f) => ({ ...f, [field]: value }))}
          grossBuying={grossBuying}
          grossSelling={grossSelling}
        />

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
                        className="border px-5 py-2 rounded bg-white hover:bg-gray-100"
            onClick={() => router.push("/portal/visa-bookings/manage")}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded shadow transition disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

