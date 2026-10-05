// src/lib/transportBookingTypes.ts

export type TransportRow = {
  id: string;
  vendorId: string;
  vehicle: string; // free text now — staff types any car/vehicle name directly
  sector: string;
  pickupDate: string;
  pickupTime: string;
  qty: number;
  driverContact: string;
  buyingCost: number;
  sellingPrice: number;
};

// Only used as <datalist> suggestions on the free-text vehicle input now —
// not a restrictive dropdown anymore.
export const VEHICLE_SUGGESTIONS = ["Sedan", "SUV", "Minivan", "Hiace", "Coach", "Luxury Bus", "Train Ticket"];

export function emptyTransportRow(): TransportRow {
  return {
    id: crypto.randomUUID(),
    vendorId: "",
    vehicle: "",
    sector: "",
    pickupDate: "",
    pickupTime: "",
    qty: 1,
    driverContact: "",
    buyingCost: 0,
    sellingPrice: 0,
  };
}