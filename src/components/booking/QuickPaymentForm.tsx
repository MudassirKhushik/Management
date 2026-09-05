// src/components/booking/QuickPaymentForm.tsx
//
// Item 2: payment method toggle. Only shows the bank-account dropdown when
// "Bank Transfer" is selected — for "Cash" no bank account is attached.
// Reused by PaymentHistorySection (View/Edit pages) and the Manage page's
// inline quick-add row, so this logic lives in exactly one place.

"use client";

import { useEffect, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5";

type BankAccount = {
  id: string;
  accountName: string | null;
  bankName: string | null;
  accountNo: string | null;
};

export type QuickPaymentPayload = {
  amount: number;
  paidOn: string;
  bankAccountId: string | null;
  note: string | null;
};

export default function QuickPaymentForm({
  onSubmit,
  saving = false,
  compact = false,
}: {
  onSubmit: (payload: QuickPaymentPayload) => Promise<void> | void;
  saving?: boolean;
  compact?: boolean;
}) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<"Cash" | "Bank Transfer">("Cash");
  const [bankAccountId, setBankAccountId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((res) => (res.ok ? res.json() : []))
      .then(setBankAccounts)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (method === "Bank Transfer" && !bankAccountId) {
      setError("Select which bank account received this payment.");
      return;
    }
    await onSubmit({
      amount: amt,
      paidOn,
      bankAccountId: method === "Bank Transfer" ? bankAccountId : null,
      note: note || null,
    });
    setAmount("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className={`grid grid-cols-1 ${compact ? "sm:grid-cols-5" : "sm:grid-cols-4"} gap-3 items-end`}>
      <div>
        <label className={labelClass}>Amount</label>
        <input type="number" step="0.01" className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Date</label>
        <input type="date" className={inputClass} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Payment Method</label>
        <select
          className={inputClass}
          value={method}
          onChange={(e) => setMethod(e.target.value as "Cash" | "Bank Transfer")}
        >
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
      </div>
      {method === "Bank Transfer" && (
        <div>
          <label className={labelClass}>Bank Account</label>
          <select className={inputClass} value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
            <option value="">Select account</option>
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.bankName || acc.accountName || "Account"} {acc.accountNo ? `(${acc.accountNo})` : ""}
              </option>
            ))}
          </select>
          {bankAccounts.length === 0 && (
            <p className="text-[11px] text-gray-400 mt-1">Add a bank account in Settings first.</p>
          )}
        </div>
      )}
      <div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--agency-color)" }}
        >
          {saving ? "Adding..." : "Add Payment"}
        </button>
      </div>
      {!compact && (
        <div className="sm:col-span-4">
          <label className={labelClass}>Note (optional)</label>
          <input type="text" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      )}
      {error && <p className="sm:col-span-5 text-red-600 text-sm font-medium">{error}</p>}
    </form>
  );
}
