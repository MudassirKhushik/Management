// src/lib/flightBookingTypes.ts

export type FlightSegment = {
  id: string; // local-only id (React key), not necessarily a saved database id
  airline: string;
  flightNo: string;
  pnr: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string; // "YYYY-MM-DD"
  departureTime: string; // "HH:MM"
  // Separate from departureDate on purpose — arrival can land the next
  // calendar day (overnight/long-haul flights). The old single shared
  // "date" field silently broke for exactly this case.
  arrivalDate: string;
  arrivalTime: string;
  travelClass: string;
  adults: number;
  children: number;
  infants: number;
  baggage: string;
  buyingCost: number;   // Total Buying Cost for this leg
  sellingPrice: number; // Total Selling Price for this leg
};

export const TRAVEL_CLASSES = ["Economy", "Premium Economy", "Business", "First Class"];

export function emptyFlightSegment(): FlightSegment {
  return {
    id: crypto.randomUUID(),
    airline: "",
    flightNo: "",
    pnr: "",
    departureAirport: "",
    arrivalAirport: "",
    departureDate: "",
    departureTime: "",
    arrivalDate: "",
    arrivalTime: "",
    travelClass: TRAVEL_CLASSES[0],
    adults: 1,
    children: 0,
    infants: 0,
    baggage: "",
    buyingCost: 0,
    sellingPrice: 0,
  };
}