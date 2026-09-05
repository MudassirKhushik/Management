// src/lib/pricingCalculations.ts
//
// Plain-language summary of the math on every form's footer:
//
//   Gross Buying   = sum of every line item's buying cost
//   Gross Selling  = sum of every line item's selling price
//   Tax Amount     = (Gross Selling - Discount) x (VAT % / 100)
//   Net Total      = Gross Selling - Discount + Tax Amount   <- what the
//                    CLIENT pays, shown on the Invoice
//   Profit         = Net Total - Gross Buying                <- STAFF ONLY,
//                    never on the client-facing Voucher
//
// None of these are ever stored. They're recalculated from the line items
// every time, per the project rule: never store a value you can calculate.

// ---------- Hotel entries need one extra step: nights ----------

export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const msPerNight = 1000 * 60 * 60 * 24;
  const nights = Math.round((end.getTime() - start.getTime()) / msPerNight);
  return nights > 0 ? nights : 0;
}

export type HotelEntryForCalc = {
  checkIn: Date | string;
  checkOut: Date | string;
  rooms: number;
  adults: number;
  children: number;
  adultBuyingPricePerNight: number;
  adultSellingPricePerNight: number;
  childBuyingPricePerNight: number;
  childSellingPricePerNight: number;
};

// Adult/Child pricing is per person, per night, per room — and `rooms`
// still multiplies in, because the adults/children counts describe the
// occupancy of ONE room, not the whole booking. Example: 2 rooms, each
// with 2 adults, adult rate 100/night, 3 nights → 3 × 2 × (2×100) = 1200,
// not 3 × (2×100) = 600. Fixed after real-world testing caught this.
export function calculateHotelEntryTotals(entry: HotelEntryForCalc) {
  const nights = calculateNights(entry.checkIn, entry.checkOut);
  const adults = entry.adults || 0;
  const children = entry.children || 0;
  const rooms = entry.rooms || 1;

  const buyingTotal =
    nights * rooms * (adults * (entry.adultBuyingPricePerNight || 0) + children * (entry.childBuyingPricePerNight || 0));
  const sellingTotal =
    nights * rooms * (adults * (entry.adultSellingPricePerNight || 0) + children * (entry.childSellingPricePerNight || 0));

  return { nights, buyingTotal, sellingTotal };
}

// ---------- Flight segments: per-passenger, per-leg ----------

export type FlightSegmentForCalc = {
  adults: number;
  children: number;
  infants: number;
  adultBuyingPricePerLeg: number;
  adultSellingPricePerLeg: number;
  childBuyingPricePerLeg: number;
  childSellingPricePerLeg: number;
  infantBuyingPricePerLeg: number;
  infantSellingPricePerLeg: number;
};

// Flat headcount × rate — no nights or rooms multiplier like hotel has.
// Infants ARE priced here (hotel treats them as headcount-only).
export function calculateFlightSegmentTotals(seg: FlightSegmentForCalc) {
  const adults = seg.adults || 0;
  const children = seg.children || 0;
  const infants = seg.infants || 0;

  const buyingTotal =
    adults * (seg.adultBuyingPricePerLeg || 0) +
    children * (seg.childBuyingPricePerLeg || 0) +
    infants * (seg.infantBuyingPricePerLeg || 0);
  const sellingTotal =
    adults * (seg.adultSellingPricePerLeg || 0) +
    children * (seg.childSellingPricePerLeg || 0) +
    infants * (seg.infantSellingPricePerLeg || 0);

  return { buyingTotal, sellingTotal };
}

// ---------- Summing line items ----------

export type LineItemForSum = {
  buyingCost: number;
  sellingPrice: number;
};

export function sumLineItems(items: LineItemForSum[]) {
  const grossBuying = items.reduce((sum, item) => sum + (item.buyingCost || 0), 0);
  const grossSelling = items.reduce((sum, item) => sum + (item.sellingPrice || 0), 0);
  return { grossBuying, grossSelling };
}

// ---------- Package: one PKR total across four different section types ----------

export type PackageSectionsForCalc = {
  hotels?: HotelEntryForCalc[];
  transportSegments?: LineItemForSum[];
  flightSegments?: FlightSegmentForCalc[];
  visaEntries?: LineItemForSum[];
};

// Hotel rows in a package are entered in SAR like standalone hotel
// bookings, so they get multiplied by the package's exchangeRate to become
// PKR. Transport/flight/visa are already PKR and pass through untouched.
// Example: hotel line of 100 SAR at rate 75 contributes 7500 PKR to the
// same total a 7500 PKR flight line contributes to.
export function calculatePackageLineItems(
  sections: PackageSectionsForCalc,
  exchangeRate: number
): LineItemForSum[] {
  const rate = exchangeRate || 1;

  const hotelLines = (sections.hotels || []).map((h) => {
    const t = calculateHotelEntryTotals(h);
    return { buyingCost: t.buyingTotal * rate, sellingPrice: t.sellingTotal * rate };
  });

  const flightLines = (sections.flightSegments || []).map((f) => {
    const t = calculateFlightSegmentTotals(f);
    return { buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal };
  });

  const transportLines = (sections.transportSegments || []).map((t) => ({
    buyingCost: t.buyingCost || 0,
    sellingPrice: t.sellingPrice || 0,
  }));

  const visaLines = (sections.visaEntries || []).map((v) => ({
    buyingCost: v.buyingCost || 0,
    sellingPrice: v.sellingPrice || 0,
  }));

  return [...hotelLines, ...transportLines, ...flightLines, ...visaLines];
}

// ---------- Footer math: tax, net total, profit ----------

export type FooterCalcInput = {
  grossBuying: number;
  grossSelling: number;
  discount: number;
  vatPercent: number;
};

export type FooterCalcResult = {
  grossBuying: number;
  grossSelling: number;
  discount: number;
  taxAmount: number;
  netTotal: number; // what the client pays — Invoice total
  profit: number; // staff-only — hidden on Voucher, shown on Invoice
};

export function calculateFooterTotals(input: FooterCalcInput): FooterCalcResult {
  const discount = input.discount || 0;
  const vatPercent = input.vatPercent || 0;

  const afterDiscount = input.grossSelling - discount;
  const taxAmount = afterDiscount * (vatPercent / 100);
  const netTotal = afterDiscount + taxAmount;
  const profit = netTotal - input.grossBuying;

  return {
    grossBuying: input.grossBuying,
    grossSelling: input.grossSelling,
    discount,
    taxAmount,
    netTotal,
    profit,
  };
}

// ============================================================
// Payment / installment ledger helpers
// ============================================================

export type PaymentForCalc = {
  amount: number;
};

export function sumPayments(payments: PaymentForCalc[]): number {
  return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}

export function calculateRemainingBalance(netTotal: number, payments: PaymentForCalc[]): number {
  const totalPaid = sumPayments(payments);
  const remaining = netTotal - totalPaid;
  // never show a negative "remaining" if the client overpaid slightly —
  // clamp at 0 for display purposes
  return remaining > 0 ? remaining : 0;
}

// Auto-flip logic: recording a payment automatically updates paymentStatus.
// No manual "Cancelled" state — a booking that needs cancelling gets
// deleted. Only three states: Pending, Partially Paid, Paid.
export function computeAutoPaymentStatus(totalPaid: number, netTotal: number): string {
  if (netTotal > 0 && totalPaid >= netTotal) return "Paid";
  if (totalPaid > 0) return "Partially Paid";
  return "Pending";
}

// Shared "how much is left, and what color should that be" logic — used by
// every Manage page's Remaining Balance badge and the Payments section.
export type RemainingTier = "paid" | "partial" | "unpaid" | "none";

export function remainingBalanceTier(remaining: number, netTotal: number): RemainingTier {
  if (netTotal <= 0) return "none";
  if (remaining <= 0) return "paid";
  if (remaining < netTotal) return "partial";
  return "unpaid";
}