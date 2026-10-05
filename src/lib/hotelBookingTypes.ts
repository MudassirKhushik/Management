// src/lib/hotelBookingTypes.ts

export type HotelRow = {
  id: string;
  vendorId: string;
  hotelName: string;
  city: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;   // headcount only — kept for occupancy/meal-plan record, no pricing effect
  children: number;
  infants: number;
  mealPlan: string;
  confirmationNo: string;
  buyingRatePerNight: number;
  sellingRatePerNight: number;
};

export const ROOM_TYPES = ["Single", "Double", "Triple", "Quad", "Quint Suite", "Family Room", "Sharing"];

export const MEAL_PLANS = [
  { value: "RO", label: "RO (Room Only)" },
  { value: "BB", label: "BB (Bed & Breakfast)" },
  { value: "HB", label: "HB (Half Board)" },
  { value: "FB", label: "FB (Full Board)" },
];

export function emptyHotelRow(): HotelRow {
  return {
    id: crypto.randomUUID(),
    vendorId: "",
    hotelName: "",
    city: "",
    roomType: ROOM_TYPES[0],
    checkIn: "",
    checkOut: "",
    rooms: 1,
    adults: 1,
    children: 0,
    infants: 0,
    mealPlan: "",
    confirmationNo: "",
    buyingRatePerNight: 0,
    sellingRatePerNight: 0,
  };
}