// src/lib/flightBookingTypes.ts

export type FlightRow = {
  id: string; // local-only id (React key), not necessarily a saved database id
  airline: string;
  flightNo: string;
  pnr: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDateTime: string; // "YYYY-MM-DDTHH:mm", matches <input type="datetime-local">
  arrivalDateTime: string;
  travelClass: string;
  adults: number;
  children: number;
  infants: number;
  baggage: string;

  // Held as an array in the form for the add/remove UI, then joined with
  // newlines before it's sent to the API (stored as one text column).
  passengerNames: string[];

  // Per passenger, per leg. Infants DO get their own price here, unlike
  // hotel where they're headcount-only.
  adultBuyingPricePerLeg: number;
  adultSellingPricePerLeg: number;
  childBuyingPricePerLeg: number;
  childSellingPricePerLeg: number;
  infantBuyingPricePerLeg: number;
  infantSellingPricePerLeg: number;
};

export const TRAVEL_CLASSES = ["Economy", "Premium Economy", "Business", "First Class"];

export function emptyFlightRow(): FlightRow {
  return {
    id: crypto.randomUUID(),
    airline: "",
    flightNo: "",
    pnr: "",
    departureAirport: "",
    arrivalAirport: "",
    departureDateTime: "",
    arrivalDateTime: "",
    travelClass: TRAVEL_CLASSES[0],
    adults: 1,
    children: 0,
    infants: 0,
    baggage: "",
    passengerNames: [""],
    adultBuyingPricePerLeg: 0,
    adultSellingPricePerLeg: 0,
    childBuyingPricePerLeg: 0,
    childSellingPricePerLeg: 0,
    infantBuyingPricePerLeg: 0,
    infantSellingPricePerLeg: 0,
  };
}