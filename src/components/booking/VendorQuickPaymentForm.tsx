"use client";

import { useState } from "react";

export type VendorQuickPaymentPayload = { amount: number; note: string | null; paidOn: string };

const inputClass = "rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none";

export default function VendorQuickPaymentForm({
  saving,
  onSubmit,
}: {
  saving?: boolean;
  onSubmit: (payload: VendorQuickPaymentPayload) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onSubmit({ amount: parseFloat(amount), note: note || null, paidOn: new Date().toISOString().slice(0, 10) });
    setAmount("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end" onClick={(e) => e.stopPropagation()}>
      <div className="flex-1 min-w-[100px]">
        <input type="number" step="0.01" placeholder="Amount" className={`${inputClass} w-full`} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="flex-1 min-w-[100px]">
        <input type="text" placeholder="Note (optional)" className={`${inputClass} w-full`} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button type="submit" disabled={saving} className="rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--agency-color)" }}>
        {saving ? "..." : "Add"}
      </button>
    </form>
  );
}