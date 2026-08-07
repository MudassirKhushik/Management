// src/lib/transportBookingTypes.ts

export type TransportRow = {
  id: string; // local-only id (React key), not necessarily a saved database id
  vehicle: string;
  sector: string; // e.g. "Jeddah to Makkah" — replaces the old fromLoc/toLoc pair
  pickupDate: string; // "YYYY-MM-DD" string, matches an <input type="date">
  pickupTime: string; // "HH:MM" string, matches an <input type="time">
  qty: number;
  buyingCost: number; // TOTAL for this segment, not a per-unit rate
  sellingPrice: number; // TOTAL for this segment, not a per-unit rate
};

export const VEHICLE_TYPES = ["Sedan", "SUV", "Minivan", "Coach", "Luxury Bus", "Train Ticket"];

export function emptyTransportRow(): TransportRow {
  return {
    id: crypto.randomUUID(),
    vehicle: VEHICLE_TYPES[0],
    sector: "",
    pickupDate: "",
    pickupTime: "",
    qty: 1,
    buyingCost: 0,
    sellingPrice: 0,
  };
}