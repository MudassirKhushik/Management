// src/components/booking/PricingFooterFields.tsx
//
// The block every booking form ends with: Discount, VAT %, Payment Type,
// Note (all editable) plus Gross Buying, Gross Selling, Tax Amount, Net
// Total, and Profit (all read-only, calculated live from the line items
// above them using src/lib/pricingCalculations.ts).
//
// The PARENT form is responsible for adding up the line items (hotels /
// segments / entries) into `grossBuying` and `grossSelling` and passing
// those two numbers in as props — this component just does the discount/
// tax/profit math on top and displays it.
//
// `showProfit` defaults to true because staff are always the ones using
// this form inside the portal. When we build the Voucher PDF later (the
// customer-facing one), that's a separate read-only view — this form
// component is never shown to a customer, so profit is safe to display
// here by default.

"use client";

import { FooterData, PAYMENT_TYPES } from "@/src/lib/sharedBookingFields";
import { calculateFooterTotals } from "@/src/lib/pricingCalculations";

type Props = {
  value: FooterData;
  onChange: (field: keyof FooterData, newValue: string | number) => void;
  grossBuying: number;
  grossSelling: number;
  showProfit?: boolean;
};

export default function PricingFooterFields({
  value,
  onChange,
  grossBuying,
  grossSelling,
  showProfit = true,
}: Props) {
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: value.discount,
    vatPercent: value.vatPercent,
  });

  return (
    <fieldset className="border p-4 mt-4">
      <legend className="font-bold px-1">Pricing & Profit</legend>

      <div className="mb-2">
        <label className="block">Total Buying Cost (Gross)</label>
        <input type="text" className="border p-2 w-full bg-gray-100" value={totals.grossBuying.toFixed(2)} disabled />
      </div>

      <div className="mb-2">
        <label className="block">Total Selling Price (Gross)</label>
        <input type="text" className="border p-2 w-full bg-gray-100" value={totals.grossSelling.toFixed(2)} disabled />
      </div>

      <div className="mb-2">
        <label className="block">Discount Allowed</label>
        <input
          type="number"
          step="0.01"
          className="border p-2 w-full"
          value={value.discount}
          onChange={(e) => onChange("discount", parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="mb-2">
        <label className="block">Tax / VAT Percent</label>
        <input
          type="number"
          step="0.01"
          className="border p-2 w-full"
          value={value.vatPercent}
          onChange={(e) => onChange("vatPercent", parseFloat(e.target.value) || 0)}
        />
      </div>

      <div className="mb-2">
        <label className="block">Tax Amount</label>
        <input type="text" className="border p-2 w-full bg-gray-100" value={totals.taxAmount.toFixed(2)} disabled />
      </div>

      <div className="mb-2">
        <label className="block">Net Invoiced Grand Total</label>
        <input type="text" className="border p-2 w-full bg-gray-100" value={totals.netTotal.toFixed(2)} disabled />
      </div>

      {showProfit && (
        <div className="mb-2">
          <label className="block">Net Margin / Profit Earned (staff only)</label>
          <input type="text" className="border p-2 w-full bg-gray-100" value={totals.profit.toFixed(2)} disabled />
        </div>
      )}

      <div className="mb-2">
        <label className="block">Payment Type</label>
        <select
          className="border p-2 w-full"
          value={value.paymentType}
          onChange={(e) => onChange("paymentType", e.target.value)}
        >
          <option value="">Select payment type</option>
          {PAYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="block">Note</label>
        <textarea
          className="border p-2 w-full"
          value={value.note}
          onChange={(e) => onChange("note", e.target.value)}
        />
      </div>
    </fieldset>
  );
}