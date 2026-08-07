// src/lib/hotelBookingTypes.ts

export type HotelRow = {
  id: string; // local-only id (React key), not necessarily a saved database id
  hotelName: string;
  city: string;
  roomType: string;
  checkIn: string; // "YYYY-MM-DD" string, matches an <input type="date">
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  infants: number;
  mealPlan: string;
  confirmationNo: string;
  buyingCostPerNight: number;
  sellingPricePerNight: number;
};

export const ROOM_TYPES = ["Single", "Double", "Triple", "Quad", "Quint Suite", "Family Room"];

export const MEAL_PLANS = [
  { value: "RO", label: "RO (Room Only)" },
  { value: "BB", label: "BB (Bed & Breakfast)" },
  { value: "HB", label: "HB (Half Board)" },
  { value: "FB", label: "FB (Full Board)" },
];

export function emptyHotelRow(): HotelRow {
  return {
    id: crypto.randomUUID(),
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
    buyingCostPerNight: 0,
    sellingPricePerNight: 0,
  };
}