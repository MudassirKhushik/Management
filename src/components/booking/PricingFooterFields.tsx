// src/components/booking/PricingFooterFields.tsx
//
// Shared by every booking type — fixing the styling here fixes the
// "Pricing & Profit" section everywhere at once.
//
// Round 3 changes (Item 2):
// - Manual Payment Status select REMOVED. Status is now purely derived from
//   the payment ledger's auto-flip logic (see paymentHelpers.ts) — no more
//   double source of truth here.
// - Total Paid / Remaining Balance added as READ-ONLY stat boxes. Pass
//   `bookingId` (Edit page has one; Add page doesn't yet, so these read 0 /
//   full amount there, which is correct — no payments can exist before the
//   booking itself does).
// - When Payment Type indicates "Bank", the agency's bank accounts are
//   listed read-only underneath — informational (which account to tell the
//   client to transfer into), not a selection that gets saved anywhere.

"use client";

import { useEffect, useState } from "react";
import { FooterData, PAYMENT_TYPES } from "@/src/lib/sharedBookingFields";
import { calculateFooterTotals, sumPayments, calculateRemainingBalance, remainingBalanceTier } from "@/src/lib/pricingCalculations";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

// Kept exported for backward compatibility with anything else that
// references it — no longer rendered here, and "Cancelled" is gone
// entirely (cancelling now means deleting the booking).
export const PAYMENT_STATUSES = ["Pending", "Paid", "Partially Paid"];

const TIER_CLASS: Record<string, string> = {
  paid: "text-emerald-600",
  partial: "text-amber-600",
  unpaid: "text-red-600",
  none: "text-[#121212]",
};

type BankAccount = {
  id: string;
  accountName: string | null;
  bankName: string | null;
  accountNo: string | null;
};

type Props = {
  value: FooterData;
  onChange: (field: keyof FooterData, newValue: string | number) => void;
  grossBuying: number;
  grossSelling: number;
  showProfit?: boolean;
  // If provided (Edit page), Total Paid/Remaining are read-only, computed
  // from the real payment ledger. Omit on Add — see the initialPaid* props
  // below for the Add-mode equivalent.
  bookingId?: string;
  bookingType?: "hotel" | "transport" | "flight" | "visa" | "package";
  // Add-mode only: lets staff record the FIRST payment while creating the
  // booking itself, instead of having to save first then go add a payment
  // separately. The parent page turns this into an actual Payment record
  // right after the booking is created. Once bookingId exists (Edit), these
  // are ignored in favor of the read-only computed values above.
  initialPaidAmount?: string;
  onInitialPaidAmountChange?: (value: string) => void;
  initialBankAccountId?: string;
  onInitialBankAccountIdChange?: (value: string) => void;
};

function StatBox({ label, value, accent = false, valueClassName = "" }: { label: string; value: string; accent?: boolean; valueClassName?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
      <p
        className={`text-sm font-bold ${valueClassName}`}
        style={!valueClassName && accent ? { color: "var(--agency-color)" } : !valueClassName ? { color: "#121212" } : undefined}
      >
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
  bookingId,
  bookingType = "hotel",
  initialPaidAmount = "",
  onInitialPaidAmountChange,
  initialBankAccountId = "",
  onInitialBankAccountIdChange,
}: Props) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const isAddMode = !bookingId;

  // Edit mode only: quick "record a payment right here" control, separate
  // from the read-only Total Paid/Remaining above — those stay exactly as
  // they were, this just adds a fast way to update them without scrolling
  // down to the full Payments ledger.
  const [quickAmount, setQuickAmount] = useState("");
  const [quickBankAccountId, setQuickBankAccountId] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");
  const [quickSuccess, setQuickSuccess] = useState(false);

  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: value.discount,
    vatPercent: value.vatPercent,
  });

  const isBankPayment = (value.paymentType || "").toLowerCase().includes("bank");

  useEffect(() => {
    if (!isBankPayment) return;
    fetch("/api/bank-accounts")
      .then((res) => (res.ok ? res.json() : []))
      .then(setBankAccounts)
      .catch(() => {});
  }, [isBankPayment]);

  function refetchTotalPaid() {
    if (!bookingId) return;
    fetch(`/api/payments?bookingType=${bookingType}&bookingId=${bookingId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((payments) => setTotalPaid(sumPayments(payments)))
      .catch(() => {});
  }

  useEffect(() => {
    if (!bookingId) {
      setTotalPaid(0);
      return;
    }
    refetchTotalPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, bookingType]);

  async function handleQuickAdd() {
    setQuickError("");
    setQuickSuccess(false);
    const amt = parseFloat(quickAmount);
    if (!amt || amt <= 0) {
      setQuickError("Enter a valid amount.");
      return;
    }
    setQuickSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          bookingId,
          amount: amt,
          paidOn: new Date().toISOString().slice(0, 10),
          bankAccountId: isBankPayment ? quickBankAccountId || null : null,
        }),
      });
      if (!res.ok) throw new Error("Server rejected the payment");
      setQuickAmount("");
      setQuickBankAccountId("");
      refetchTotalPaid(); // updates Total Paid + Remaining here immediately
      setQuickSuccess(true);
    } catch (err) {
      console.error(err);
      setQuickError("Could not record this payment.");
    } finally {
      setQuickSaving(false);
    }
  }

  // Add mode: remaining is computed live from whatever the staff is typing
  // into "Total Paid Amount" (not yet saved). Edit mode: from the real
  // ledger fetched above (and refetched after a quick-add).
  const effectivePaid = isAddMode ? parseFloat(initialPaidAmount) || 0 : totalPaid;
  const remaining = Math.max(0, totals.netTotal - effectivePaid);
  const tier = remainingBalanceTier(remaining, totals.netTotal);

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

        {isAddMode ? (
          // Add mode: staff can type the first payment right here — a real
          // Payment record gets created right after the booking is saved.
          <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5 block">
              Total Paid Amount
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-transparent text-sm font-bold text-[#121212] focus:outline-none"
              placeholder="0.00"
              value={initialPaidAmount}
              onChange={(e) => onInitialPaidAmountChange?.(e.target.value)}
            />
          </div>
        ) : (
          <StatBox label="Total Paid" value={totalPaid.toFixed(2)} valueClassName="text-emerald-600" />
        )}
        <StatBox
          label="Remaining"
          value={tier === "paid" ? "Paid in full" : remaining.toFixed(2)}
          valueClassName={TIER_CLASS[tier]}
        />
      </div>

      {/* Edit mode only: quick "record a payment" control — Total Paid and
          Remaining above stay read-only exactly as before, this just gives
          a fast way to update them without scrolling to the Payments
          section further down the page. */}
      {!isAddMode && (
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Record a Payment
          </p>
          <div className={`grid grid-cols-1 ${isBankPayment ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2`}>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              placeholder="Amount received"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
            />
            {isBankPayment && (
              <select
                className={inputClass}
                value={quickBankAccountId}
                onChange={(e) => setQuickBankAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName || acc.accountName || "Account"} {acc.accountNo ? `(${acc.accountNo})` : ""}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={quickSaving}
              className="rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--agency-color)" }}
            >
              {quickSaving ? "Adding..." : "Add Payment"}
            </button>
          </div>
          {quickError && <p className="text-red-600 text-xs font-medium mt-2">{quickError}</p>}
          {quickSuccess && <p className="text-emerald-600 text-xs font-medium mt-2">Payment recorded — totals updated above.</p>}
        </div>
      )}

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
      </div>

      {/* Item 2 (round 4): Add mode gets a real SELECT tied to the initial
          payment. Edit mode's bank picker now lives in the "Record a
          Payment" quick-add block above, so nothing duplicate here. */}
      {isBankPayment && isAddMode && (
        <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Which account received this payment?
          </p>
          {bankAccounts.length === 0 ? (
            <p className="text-xs text-gray-400">No bank accounts added yet — add one in Settings.</p>
          ) : (
            <select
              className={inputClass}
              value={initialBankAccountId}
              onChange={(e) => onInitialBankAccountIdChange?.(e.target.value)}
            >
              <option value="">Select account</option>
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName || acc.accountName || "Account"} {acc.accountNo ? `(${acc.accountNo})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

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