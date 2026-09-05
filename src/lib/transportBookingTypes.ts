// src/lib/transportBookingTypes.ts

export type TransportRow = {
  id: string; // local-only id (React key), not necessarily a saved database id
  vehicle: string;
  sector: string;
  pickupDate: string; // "YYYY-MM-DD", matches an <input type="date">
  pickupTime: string;
  qty: number;
  driverContact: string; // optional — voucher-only, never on the invoice
  buyingCost: number;
  sellingPrice: number;
};

export const VEHICLE_TYPES = [
  "Sedan",
  "SUV",
  "Minivan",
  "Hiace",
  "Coach",
  "Luxury Bus",
  "Train Ticket",
];

export function emptyTransportRow(): TransportRow {
  return {
    id: crypto.randomUUID(),
    vehicle: VEHICLE_TYPES[0],
    sector: "",
    pickupDate: "",
    pickupTime: "",
    qty: 1,
    driverContact: "",
    buyingCost: 0,
    sellingPrice: 0,
  };
}