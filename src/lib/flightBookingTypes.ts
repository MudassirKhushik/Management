// src/lib/flightBookingTypes.ts

export type FlightRow = {
  id: string;
  vendorId: string;
  airline: string;
  flightNo: string;
  pnr: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDateTime: string;
  arrivalDateTime: string;
  travelClass: string;
  adults: number;
  children: number;
  infants: number;
  baggage: string;
  passengerNames: string[];
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
    vendorId: "",
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