export type TransportSegment = {
  date: string;
  time: string;
  fromLoc: string;
  toLoc: string;
  vehicle: string;
  qty: number;
  adults: number;
  mlRate: number;
  rate: number;
};

export const emptySegment: TransportSegment = {
  date: "",
  time: "",
  fromLoc: "",
  toLoc: "",
  vehicle: "",
  qty: 1,
  adults: 1,
  mlRate: 0,
  rate: 0,
};