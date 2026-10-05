"use client";

import { useEffect, useState } from "react";
import VendorQuickPaymentForm, { VendorQuickPaymentPayload } from "./VendorQuickPaymentForm";

type VendorPaymentRow = { id: string; amount: number; paidOn: string; note: string | null };

export default function VendorPaymentHistorySection({ vendorId, readOnly = false }: { vendorId: string; readOnly?: boolean }) {
  const [payments, setPayments] = useState<VendorPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDate, setEditDate] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/payments`);
      if (res.ok) setPayments(await res.json());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [vendorId]);

  async function handleAdd(payload: VendorQuickPaymentPayload) {
    setSaving(true);
    try {
      await fetch(`/api/vendors/${vendorId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await load();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: VendorPaymentRow) {
    setEditingId(p.id);
    setEditAmount(String(p.amount));
    setEditNote(p.note || "");
    setEditDate(p.paidOn.slice(0, 10));
  }

  async function saveEdit(id: string) {
    await fetch(`/api/vendors/${vendorId}/payments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editAmount) || 0, note: editNote || null, paidOn: editDate }),
    });
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payment?")) return;
    await fetch(`/api/vendors/${vendorId}/payments/${id}`, { method: "DELETE" });
    load();
  }

  const editInput = "rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs focus:outline-none";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>
        Payment History
      </h2>

      {!readOnly && (
        <div className="mb-4 pb-4 border-b border-gray-50">
          <VendorQuickPaymentForm saving={saving} onSubmit={handleAdd} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0 gap-2">
              {editingId === p.id ? (
                <>
                  <input type="date" className={editInput} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                  <input type="number" step="0.01" className={`${editInput} w-24`} value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                  <input type="text" className={`${editInput} flex-1`} value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Note" />
                  <button type="button" onClick={() => saveEdit(p.id)} className="text-xs font-semibold" style={{ color: "var(--agency-color)" }}>Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-xs font-semibold text-gray-400">Cancel</button>
                </>
              ) : (
                <>
                  <span className="text-gray-600">{p.paidOn.slice(0, 10)}{p.note ? ` — ${p.note}` : ""}</span>
                  <span className="font-medium text-emerald-600 ml-auto">{p.amount.toFixed(2)}</span>
                  {!readOnly && (
                    <div className="flex items-center gap-2 ml-2">
                      {/* Edit Icon Button */}
                      <button 
                        type="button" 
                        onClick={() => startEdit(p)} 
                        title="Edit Payment"
                        className="p-1 rounded-md transition-colors hover:bg-gray-100"
                        style={{ color: "var(--agency-color)" }}
                      >
                        <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      
                      {/* Delete Icon Button */}
                      <button 
                        type="button" 
                        onClick={() => handleDelete(p.id)} 
                        title="Delete Payment"
                        className="p-1 rounded-md text-red-500 transition-colors hover:bg-red-50"
                      >
                        <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {payments.length === 0 && <p className="text-gray-400 text-sm">No payments recorded yet.</p>}
        </div>
      )}
    </div>
  );
}
