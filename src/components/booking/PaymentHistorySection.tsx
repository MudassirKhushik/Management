// src/components/booking/PaymentHistorySection.tsx
//
// Reusable across every booking type — pass bookingType + bookingId + the
// already-calculated netTotal + currency, and this handles listing payment
// history, adding a new payment (via QuickPaymentForm, Item 2's Cash/Bank
// Transfer toggle), and showing a running Remaining Balance badge.

"use client";

import { useEffect, useState } from "react";
import { calculateRemainingBalance, sumPayments, remainingBalanceTier } from "@/src/lib/pricingCalculations";
import QuickPaymentForm, { QuickPaymentPayload } from "@/src/components/booking/QuickPaymentForm";

type BankAccount = {
  id: string;
  accountName: string | null;
  bankName: string | null;
  accountNo: string | null;
};

type Payment = {
  id: string;
  amount: number;
  paidOn: string;
  note: string | null;
  bankAccount: BankAccount | null;
};

const TIER_CLASS: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  unpaid: "bg-red-50 text-red-700 border-red-200",
  none: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function PaymentHistorySection({
  bookingType,
  bookingId,
  netTotal,
  currency,
  readOnly = false,
}: {
  bookingType: "hotel" | "transport" | "flight" | "visa" | "package";
  bookingId: string;
  netTotal: number;
  currency: string;
  // Item 3 (round 3): View page passes readOnly — hides the add-payment
  // form and the per-payment Remove button, keeping the list + totals
  // visible. Edit/Manage stay fully editable.
  readOnly?: boolean;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments?bookingType=${bookingType}&bookingId=${bookingId}`);
      if (res.ok) setPayments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingType, bookingId]);

  const totalPaid = sumPayments(payments);
  const remaining = calculateRemainingBalance(netTotal, payments);
  const tier = remainingBalanceTier(remaining, netTotal);

  async function handleAddPayment(payload: QuickPaymentPayload) {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingType, bookingId, ...payload }),
      });
      if (!res.ok) throw new Error("Server rejected the payment");
      await load();
    } catch (err) {
      console.error(err);
      setError("Could not record this payment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePayment(id: string) {
    if (!confirm("Delete this payment record?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await load();
    } catch (err) {
      console.error(err);
      alert("Could not delete this payment.");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--agency-color)" }}>
          Payments
        </h2>
        <span className={`text-xs font-semibold rounded-full border px-2.5 py-1 ${TIER_CLASS[tier]}`}>
          {tier === "paid" ? "Paid in full" : `${currency} ${remaining.toFixed(2)} remaining`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Total Price</p>
          <p className="text-sm font-bold text-[#121212]">{currency} {netTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Total Paid</p>
          <p className="text-sm font-bold text-emerald-600">{currency} {totalPaid.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Remaining</p>
          <p className="text-sm font-bold" style={{ color: "var(--agency-color)" }}>
            {currency} {remaining.toFixed(2)}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading payments...</p>
      ) : (
        <>
          {payments.length > 0 && (
            <div className="mb-4 space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-semibold text-[#121212]">
                      {currency} {p.amount.toFixed(2)}
                    </span>
                    <span className="text-gray-500"> on {p.paidOn.slice(0, 10)}</span>
                    <span className="text-gray-500">
                      {" "}
                      — {p.bankAccount ? `${p.bankAccount.bankName || p.bankAccount.accountName} (Bank Transfer)` : "Cash"}
                    </span>
                    {p.note && <span className="text-gray-400"> ({p.note})</span>}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeletePayment(p.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readOnly && <QuickPaymentForm onSubmit={handleAddPayment} saving={saving} />}
          {error && <p className="text-red-600 text-sm font-medium mt-2">{error}</p>}
        </>
      )}
    </div>
  );
}