// src/components/booking/PricingFooterFields.tsx
//
// Shared by every booking type — fixing the styling here fixes the
// "Pricing & Profit" section everywhere at once.

"use client";

import { FooterData, PAYMENT_TYPES } from "@/src/lib/sharedBookingFields";
import { calculateFooterTotals } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

export const PAYMENT_STATUSES = ["Pending", "Paid", "Partially Paid", "Cancelled"];

type Props = {
  value: FooterData;
  onChange: (field: keyof FooterData, newValue: string | number) => void;
  grossBuying: number;
  grossSelling: number;
  showProfit?: boolean;
  // Optional and separate from FooterData on purpose — added without touching
  // the shared type, so callers that don't pass it (e.g. Package Booking, if
  // it doesn't need this) simply don't render the field.
  paymentStatus?: string;
  onPaymentStatusChange?: (value: string) => void;
};

function StatBox({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold" style={accent ? { color: "var(--agency-color)" } : { color: "#121212" }}>
        {value}
      </p>
    </div>
  );
}

export default function PricingFooterFields({
  value,
  onChange,
  grossBuying,
  grossSelling,
  showProfit = true,
  paymentStatus,
  onPaymentStatusChange,
}: Props) {
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: value.discount,
    vatPercent: value.vatPercent,
  });

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
        Pricing &amp; Profit
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        <StatBox label="Gross Buying" value={totals.grossBuying.toFixed(2)} />
        <StatBox label="Gross Selling" value={totals.grossSelling.toFixed(2)} />
        <StatBox label="Tax Amount" value={totals.taxAmount.toFixed(2)} />
        <StatBox label="Net Total" value={totals.netTotal.toFixed(2)} accent />
        {showProfit && <StatBox label="Profit (Staff Only)" value={totals.profit.toFixed(2)} accent />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>Discount Allowed</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={value.discount}
            onChange={(e) => onChange("discount", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className={labelClass}>Tax / VAT Percent</label>
          <input
            type="number"
            step="0.01"
            className={inputClass}
            value={value.vatPercent}
            onChange={(e) => onChange("vatPercent", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className={labelClass}>Payment Type</label>
          <select
            className={inputClass}
            value={value.paymentType}
            onChange={(e) => onChange("paymentType", e.target.value)}
          >
            <option value="">Select payment type</option>
            {PAYMENT_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        {onPaymentStatusChange && (
          <div>
            <label className={labelClass}>Payment Status</label>
            <select
              className={inputClass}
              value={paymentStatus || "Pending"}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Note</label>
        <textarea
          className={inputClass}
          rows={3}
          value={value.note}
          onChange={(e) => onChange("note", e.target.value)}
        />
      </div>
    </section>
  );
}