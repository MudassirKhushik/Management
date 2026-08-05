export type FlightSegment = {
  date: string;
  airline: string;
  flightNo: string;
  pnr: string;
  fromAirport: string;
  toAirport: string;
  departureTime: string;
  arrivalTime: string;
  travelClass: string;
  adults: number;
  children: number;
  infants: number;
  baggage: string;
  rate: number;
};

export const emptyFlightSegment: FlightSegment = {
  date: "",
  airline: "",
  flightNo: "",
  pnr: "",
  fromAirport: "",
  toAirport: "",
  departureTime: "",
  arrivalTime: "",
  travelClass: "",
  adults: 1,
  children: 0,
  infants: 0,
  baggage: "",
  rate: 0,
};