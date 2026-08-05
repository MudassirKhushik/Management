export type HotelRow = {
  hotelName: string;
  city: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  meals: string;
  dayRate: number;
  mlRate: number;
  confirmationNo: string;
};

export const emptyHotelRow: HotelRow = {
  hotelName: "",
  city: "",
  roomType: "",
  checkIn: "",
  checkOut: "",
  rooms: 1,
  adults: 1,
  children: 0,
  meals: "",
  dayRate: 0,
  mlRate: 0,
  confirmationNo: "",
};