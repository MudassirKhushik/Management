// src/lib/vendorHelpers.ts
//
// Vendor ledger — what WE owe a vendor, entirely separate from the client
// Payment ledger. Never appears on any client Invoice or Voucher.
//
// Currency rule: Hotel purchases are entered in SAR (same as the client
// side), everything else (Transport/Flight/Visa) is entered in PKR
// directly. Every vendor total, balance, and ledger line is expressed in
// PKR — a hotel line's SAR amount is converted using THAT booking's own
// exchangeRate (the rate recorded the day it was entered), never a
// current/live rate. This keeps a vendor's running balance meaningful even
// if they supplied a mix of hotels and transport/flights/visas.

import { prisma } from "@/src/lib/prisma";
import { calculateHotelEntryTotals, calculateFlightSegmentTotals } from "@/src/lib/pricingCalculations";

export type VendorPurchaseLine = {
  type: "purchase";
  bookingType: "hotel" | "transport" | "flight" | "visa";
  label: string;
  date: Date;
  amount: number; // ALWAYS PKR — converted for hotel lines, native for everything else
  // Present only for bookingType === "hotel" — the original SAR figure and
  // the exchange rate used to convert it, so the ledger can show the math.
  originalCurrency?: string;
  originalAmount?: number;
  exchangeRate?: number;
};

export type VendorPaymentLine = {
  type: "payment";
  date: Date;
  amount: number; // PKR — what we paid the vendor
  note: string | null;
};

export type VendorLedgerEntry = VendorPurchaseLine | VendorPaymentLine;

async function getVendorPurchaseLines(agencyId: string, vendorId: string): Promise<VendorPurchaseLine[]> {
  const [hotelEntries, transportSegments, flightSegments, visaEntries] = await Promise.all([
    prisma.hotelBookingEntry.findMany({
      where: { vendorId, OR: [{ hotelBooking: { agencyId } }, { packageBooking: { agencyId } }] },
      include: {
        hotelBooking: { select: { createdAt: true, exchangeRate: true } },
        packageBooking: { select: { createdAt: true, exchangeRate: true } },
      },
    }),
    prisma.transportSegment.findMany({
      where: { vendorId, OR: [{ booking: { agencyId } }, { packageBooking: { agencyId } }] },
      include: { booking: { select: { createdAt: true } }, packageBooking: { select: { createdAt: true } } },
    }),
    prisma.flightSegment.findMany({
      where: { vendorId, OR: [{ booking: { agencyId } }, { packageBooking: { agencyId } }] },
      include: { booking: { select: { createdAt: true } }, packageBooking: { select: { createdAt: true } } },
    }),
    prisma.visaEntry.findMany({
      where: { vendorId, OR: [{ booking: { agencyId } }, { packageBooking: { agencyId } }] },
      include: { booking: { select: { createdAt: true } }, packageBooking: { select: { createdAt: true } } },
    }),
  ]);

  const lines: VendorPurchaseLine[] = [];

  // Hotel — entered in SAR, converted to PKR using this specific booking's
  // own exchangeRate (not a live/current rate).
  hotelEntries.forEach((e) => {
    const t = calculateHotelEntryTotals(e);
    const rate = e.hotelBooking?.exchangeRate ?? e.packageBooking?.exchangeRate ?? 1;
    const sarAmount = t.buyingTotal;
    lines.push({
      type: "purchase",
      bookingType: "hotel",
      label: `${e.hotelName}, ${e.city}`,
      date: e.hotelBooking?.createdAt || e.packageBooking?.createdAt || new Date(),
      amount: sarAmount * rate,
      originalCurrency: "SAR",
      originalAmount: sarAmount,
      exchangeRate: rate,
    });
  });

  // Transport/Flight/Visa — already entered in PKR, no conversion needed.
  transportSegments.forEach((s) => {
    lines.push({
      type: "purchase",
      bookingType: "transport",
      label: `${s.vehicle} — ${s.sector}`,
      date: s.booking?.createdAt || s.packageBooking?.createdAt || new Date(),
      amount: s.buyingCost || 0,
    });
  });
  flightSegments.forEach((s) => {
    const t = calculateFlightSegmentTotals(s);
    lines.push({
      type: "purchase",
      bookingType: "flight",
      label: `${s.airline} ${s.flightNo}`,
      date: s.booking?.createdAt || s.packageBooking?.createdAt || new Date(),
      amount: t.buyingTotal,
    });
  });
  visaEntries.forEach((e) => {
    lines.push({
      type: "purchase",
      bookingType: "visa",
      label: `${e.visaCategory} — ${e.applicantName}`,
      date: e.booking?.createdAt || e.packageBooking?.createdAt || new Date(),
      amount: e.buyingCost || 0,
    });
  });

  return lines;
}

export async function sumVendorPayments(vendorId: string): Promise<number> {
  const result = await prisma.vendorPayment.aggregate({ where: { vendorId }, _sum: { amount: true } });
  return result._sum.amount || 0;
}

// totalBuying is always PKR here — purchase lines are pre-converted above.
export async function getVendorTotalOwed(agencyId: string, vendorId: string) {
  const lines = await getVendorPurchaseLines(agencyId, vendorId);
  const totalBuying = lines.reduce((s, l) => s + l.amount, 0);
  return { totalBuying, lines };
}

// Full chronological ledger — purchases and payments interleaved by date,
// every amount in PKR. Hotel purchase lines carry their SAR/rate alongside
// the converted PKR amount so the printable Ledger can show all three.
export async function getVendorLedger(agencyId: string, vendorId: string) {
  const purchaseLines = await getVendorPurchaseLines(agencyId, vendorId);
  const payments = await prisma.vendorPayment.findMany({ where: { vendorId }, orderBy: { paidOn: "asc" } });
  const paymentLines: VendorPaymentLine[] = payments.map((p) => ({
    type: "payment",
    date: p.paidOn,
    amount: p.amount,
    note: p.note,
  }));

  const entries: VendorLedgerEntry[] = [...purchaseLines, ...paymentLines].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalBought = purchaseLines.reduce((s, l) => s + l.amount, 0); // PKR
  const totalPaid = paymentLines.reduce((s, l) => s + l.amount, 0); // PKR

  return { entries, totalBought, totalPaid, remaining: totalBought - totalPaid };
}

export type VendorTier = "toPay" | "toReceive" | "settled" | "none";

export function vendorBalanceTier(totalOwed: number, totalPaid: number): VendorTier {
  if (totalOwed <= 0) return "none";
  const remaining = totalOwed - totalPaid;
  if (remaining > 0) return "toPay";
  if (remaining < 0) return "toReceive";
  return "settled";
}