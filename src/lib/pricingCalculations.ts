// src/lib/pricingCalculations.ts
//
// Plain-language summary of the math on every form's footer:
//
//   Gross Buying   = sum of every line item's buying cost
//   Gross Selling  = sum of every line item's selling price
//   Tax Amount     = (Gross Selling - Discount) x (VAT % / 100)
//   Net Total      = Gross Selling - Discount + Tax Amount   <- this is what
//                    the CLIENT pays, shown on the Invoice/Voucher
//   Profit         = Net Total - Gross Buying                <- STAFF ONLY,
//                    never shown on the client-facing Voucher
//
// None of these numbers are ever stored in the database. They're
// recalculated every time from the line items + discount/VAT inputs,
// following the project rule: never store a value you can calculate.

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
  buyingCostPerNight: number;
  sellingPricePerNight: number;
};

// Hotel is the one type where the stored price is "per night" — every other
// booking type (transport/flight/visa) stores an already-final line total.
export function calculateHotelEntryTotals(entry: HotelEntryForCalc) {
  const nights = calculateNights(entry.checkIn, entry.checkOut);
  const buyingTotal = nights * entry.rooms * entry.buyingCostPerNight;
  const sellingTotal = nights * entry.rooms * entry.sellingPricePerNight;
  return { nights, buyingTotal, sellingTotal };
}

// ---------- Summing line items (works for transport/flight/visa AND hotel
// once you've converted hotel rows to totals with the function above) ----------

export type LineItemForSum = {
  buyingCost: number;
  sellingPrice: number;
};

export function sumLineItems(items: LineItemForSum[]) {
  const grossBuying = items.reduce((sum, item) => sum + (item.buyingCost || 0), 0);
  const grossSelling = items.reduce((sum, item) => sum + (item.sellingPrice || 0), 0);
  return { grossBuying, grossSelling };
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
  netTotal: number; // what the client pays — safe to show on a Voucher
  profit: number; // staff-only — must be hidden on Voucher, shown on Invoice
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