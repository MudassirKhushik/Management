// src/lib/sharedBookingFields.ts
//
// These are the fields that appear on EVERY booking form (Hotel, Transport,
// Flight, Visa, and the Full Package form) — the "Global Header" at the top
// and the "Pricing & Profit" footer at the bottom.
//
// Each booking table has its OWN copy of these columns in the database
// (that was your call), but the shape is identical everywhere, so we keep
// one shared TypeScript type + one shared React component for each, instead
// of writing the same fields five times.

// ---------- Global Header ----------

export type GlobalHeaderData = {
  agentName: string;
  guestName: string;
  nationality: string;
  mobileNo: string;
  referenceNo: string;
  currency: string;
};

export const emptyGlobalHeader: GlobalHeaderData = {
  agentName: "",
  guestName: "",
  nationality: "",
  mobileNo: "",
  referenceNo: "",
  currency: "USD",
};

// Matches the PDF spec: USD, SAR, PKR, AED, EUR, GBP
export const CURRENCIES = ["PKR", "SAR", "USD", "AED", "EUR", "GBP"] as const;

// ---------- Pricing & Profit footer ----------

export type FooterData = {
  discount: number; // flat amount taken off the gross selling total
  vatPercent: number; // tax %, applied AFTER the discount
  paymentType: string; // optional, e.g. "Bank Transfer"
  note: string; // optional free text
};

export const emptyFooterData: FooterData = {
  discount: 0,
  vatPercent: 0,
  paymentType: "",
  note: "",
};

export const PAYMENT_TYPES = ["Cash", "Bank Transfer", "Card", "Cheque"] as const;

// Booking-level fields every "Manage" list page needs to show, on top of
// whatever is specific to that booking type (hotels, segments, etc).
export type BookingHeaderAndFooter = GlobalHeaderData & FooterData;