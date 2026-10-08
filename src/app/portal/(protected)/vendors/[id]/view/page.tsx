"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Spinner from "@/src/components/ui/Spinner";
import VendorPaymentHistorySection from "@/src/components/booking/VendorPaymentHistorySection";
import { VendorLedgerEntry } from "@/src/lib/vendorHelpers";

type VendorProfile = {
  id: string; name: string; vendorCode: string | null; phone: string | null; email: string | null;
  country: string | null; address: string | null; isActive: boolean;
  totalOwed: number; totalPaid: number; remaining: number; tier: string;
  ledger: VendorLedgerEntry[];
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm font-medium text-[#121212] text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function VendorViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vendors/${id}`).then((r) => r.json()).then(setVendor).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="Loading vendor..." />;
  if (!vendor) return <p className="p-6 text-red-600">Vendor not found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-[#121212]">{vendor.name}</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push("/portal/vendors/manage")} className="rounded-lg px-4 py-2 text-sm font-semibold border border-gray-200 hover:bg-gray-50">Back</button>
          <Link href={`/portal/vendors/${id}/edit`} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: "var(--agency-color)" }}>Edit</Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--agency-color)" }}>Documents</h2>
        <a href={`/api/vendors/${id}/ledger/pdf`} target="_blank" rel="noopener noreferrer"
          className="inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--agency-color)" }}>
          Print Ledger
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"><p className="text-xs text-gray-400 mb-1">Total Bought (PKR)</p><p className="text-xl font-bold text-[#121212]">{vendor.totalOwed.toFixed(2)}</p></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"><p className="text-xs text-gray-400 mb-1">Total Paid (PKR)</p><p className="text-xl font-bold text-emerald-600">{vendor.totalPaid.toFixed(2)}</p></div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 mb-1">{vendor.remaining >= 0 ? "To Pay (PKR)" : "To Receive (PKR)"}</p>
          <p className={`text-xl font-bold ${vendor.tier === "toPay" ? "text-red-600" : "text-emerald-600"}`}>
            {vendor.tier === "none" ? "—" : Math.abs(vendor.remaining).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--agency-color)" }}>Vendor Info</h2>
        <DetailRow label="Vendor ID" value={vendor.vendorCode} />
        <DetailRow label="Country" value={vendor.country} />
        <DetailRow label="Phone" value={vendor.phone} />
        <DetailRow label="Email" value={vendor.email} />
        <DetailRow label="Address" value={vendor.address} />
        <DetailRow label="Status" value={vendor.isActive ? "Active" : "Inactive"} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--agency-color)" }}>Ledger</h2>
          <span className="text-[11px] text-gray-400">All amounts in PKR</span>
        </div>
        <div className="space-y-1">
          {vendor.ledger.map((e, i) => {
            const isHotel = e.type === "purchase" && e.bookingType === "hotel";
            return (
              <div key={i} className="flex flex-col sm:flex-row sm:justify-between text-sm py-1.5 border-b border-gray-50 last:border-0 gap-0.5">
                <span className="text-gray-600">
                  {new Date(e.date).toLocaleDateString()} — {e.type === "purchase" ? `${e.bookingType.toUpperCase()}: ${e.label}` : `Payment${e.note ? ` (${e.note})` : ""}`}
                  {isHotel && e.originalAmount != null && e.exchangeRate != null && (
                    <span className="text-[11px] text-gray-400 block sm:inline sm:ml-2">
                      (SAR {e.originalAmount.toFixed(2)} × {e.exchangeRate.toFixed(2)})
                    </span>
                  )}
                </span>
                <span className={`font-medium ${e.type === "purchase" ? "text-[#121212]" : "text-emerald-600"}`}>
                  {e.type === "purchase" ? `-PKR ${e.amount.toFixed(2)}` : `+PKR ${e.amount.toFixed(2)}`}
                </span>
              </div>
            );
          })}
          {vendor.ledger.length === 0 && <p className="text-gray-400 text-sm">No transactions yet.</p>}
        </div>
      </div>

      <VendorPaymentHistorySection vendorId={id} readOnly />
    </div>
  );
}
