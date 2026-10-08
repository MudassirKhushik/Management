"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/src/components/ui/Spinner";
import VendorQuickPaymentForm, { VendorQuickPaymentPayload } from "@/src/components/booking/VendorQuickPaymentForm";

type VendorRow = {
  id: string; name: string; vendorCode: string | null; country: string | null; phone: string | null; isActive: boolean;
  totalOwed: number; totalPaid: number; remaining: number; tier: "toPay" | "toReceive" | "settled" | "none";
};

function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function EditIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" strokeLinecap="round" strokeLinejoin="round" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function TrashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function LedgerIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" /><line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" /><line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" /></svg>;
}
function CashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function IconLink({ href, title, children, external = false }: { href: string; title: string; children: React.ReactNode; external?: boolean }) {
  const cls = "w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white";
  const inner = (
    <span className={cls} title={title}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--agency-color)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
      {children}
    </span>
  );
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{inner}</a>
    : <Link href={href}>{inner}</Link>;
}

export default function ManageVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentOpenId, setPaymentOpenId] = useState<string | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);

  async function loadVendors() {
    const res = await fetch("/api/vendors");
    if (res.ok) setVendors(await res.json());
    setLoading(false);
  }
  useEffect(() => { loadVendors(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Remove this vendor?")) return;
    const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    if (res.ok) {
      const result = await res.json();
      if (result.deactivated) setVendors((rows) => rows.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
      else setVendors((rows) => rows.filter((r) => r.id !== id));
    }
  }

  async function handleQuickPayment(vendorId: string, payload: VendorQuickPaymentPayload) {
    setPaymentSaving(true);
    try {
      await fetch(`/api/vendors/${vendorId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      await loadVendors();
      setPaymentOpenId(null);
    } finally {
      setPaymentSaving(false);
    }
  }

  if (loading) return <Spinner label="Loading vendors..." />;
  const filtered = vendors.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()) || (v.vendorCode || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h1 className="text-2xl font-bold text-[#121212]">Vendors</h1>
        <Link href="/portal/vendors/add" className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--agency-color)" }}>
          + Add Vendor
        </Link>
      </div>

      <input type="text" placeholder="Search your vendor..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md mb-2 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none" />
      <p className="text-[11px] text-gray-400 mb-5">
        All amounts are in PKR. Hotel purchases (entered in SAR) are converted using each booking's own exchange rate.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((v) => {
          const isOpen = paymentOpenId === v.id;
          return (
            <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${v.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                  {v.isActive ? "Active" : "Inactive"}
                </span>
                <IconLink href={`/api/vendors/${v.id}/ledger/pdf`} title="Print Ledger" external>
                  <LedgerIcon />
                </IconLink>
              </div>

              <Link href={`/portal/vendors/${v.id}/view`}><p className="text-sm font-bold text-[#121212] hover:underline">{v.name}</p></Link>
              <p className="text-[11px] text-gray-400 mt-0.5">{v.vendorCode || "—"}{v.country ? ` · ${v.country}` : ""}</p>

              <button
                type="button"
                onClick={() => setPaymentOpenId(isOpen ? null : v.id)}
                className="w-full text-left mt-3 pt-3 border-t border-gray-50"
                title="Click to add a payment"
              >
                {v.tier === "none" && <p className="text-sm font-semibold text-gray-400">—</p>}
                {v.tier === "toPay" && <p className="text-sm font-bold text-red-600">To Pay: PKR {v.remaining.toFixed(2)}</p>}
                {v.tier === "toReceive" && <p className="text-sm font-bold text-emerald-600">To Receive: PKR {Math.abs(v.remaining).toFixed(2)}</p>}
                {v.tier === "settled" && <p className="text-sm font-bold text-emerald-600">Fully Paid</p>}
                <p className="text-[11px] text-gray-400 mt-0.5">Bought PKR {v.totalOwed.toFixed(2)} · Paid PKR {v.totalPaid.toFixed(2)}</p>
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <VendorQuickPaymentForm saving={paymentSaving} onSubmit={(payload) => handleQuickPayment(v.id, payload)} />
                </div>
              )}

              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-50">
                <IconLink href={`/portal/vendors/${v.id}/view`} title="View"><EyeIcon /></IconLink>
                <IconLink href={`/portal/vendors/${v.id}/edit`} title="Edit"><EditIcon /></IconLink>
                <button type="button" onClick={() => setPaymentOpenId(isOpen ? null : v.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--agency-color)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Record Payment">
                  <CashIcon />
                </button>
                <button type="button" onClick={() => handleDelete(v.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-red-500 transition-colors" title="Delete">
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center py-10">{search ? "No matches." : "No vendors yet — add your first one."}</p>}
      </div>
    </div>
  );
}
