// src/app/verify/[slug]/page.tsx
//
// One public verification page for every voucher — hotel, transport,
// flight, visa, package. Deliberately shows NO booking data: just the
// agency's identity, so a scan confirms "this voucher came from a real
// agency" without leaking a guest's itinerary to whoever finds the paper.

import { prisma } from "@/src/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function VerifyAgencyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const agency = await prisma.agency.findUnique({
    where: { slug },
    select: { name: true, city: true, logoUrl: true, primaryColor: true, isActive: true, licenseNo: true },
  });

  if (!agency || !agency.isActive) notFound();

  const accent = agency.primaryColor || "#D2232A";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-black/5 p-8 text-center">
        {agency.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agency.logoUrl} alt={agency.name} className="h-20 w-auto mx-auto mb-5 object-contain" />
        ) : (
          <h1 className="text-2xl font-black uppercase tracking-tight mb-5 text-[#121212]">{agency.name}</h1>
        )}

        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white mb-5"
          style={{ backgroundColor: accent }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Verified Agency
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">
          This document was issued by <span className="font-semibold text-[#121212]">{agency.name}</span>
          {agency.city ? `, a licensed travel agency based in ${agency.city}` : ", a licensed travel agency"}, providing
          Hajj, Umrah and international tour services.
        </p>

        {agency.licenseNo && (
          <p className="text-xs text-gray-400 mt-4">License No: {agency.licenseNo}</p>
        )}

        <p className="text-[11px] text-gray-400 mt-6 pt-5 border-t border-gray-100">
          For any query regarding this document, please contact the agency using the numbers printed on your voucher.
        </p>
      </div>
    </div>
  );
}