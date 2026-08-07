// src/lib/visaBookingTypes.ts

export type VisaRow = {
  id: string; // local-only id (React key), not necessarily a saved database id
  visaCategory: string; // e.g. "Saudi Umrah", "UK Tourist", "Schengen Business" — replaces old visaType
  applicantName: string;
  passportNumber: string; // NEW field this session, wasn't in the old schema at all
  processingType: string;
  submissionDate: string; // "YYYY-MM-DD" string, matches an <input type="date">
  expiryDate: string;
  buyingCost: number;
  sellingPrice: number;
};

export const PROCESSING_TYPES = ["Normal", "Urgent", "Express"];

export function emptyVisaRow(): VisaRow {
  return {
    id: crypto.randomUUID(),
    visaCategory: "",
    applicantName: "",
    passportNumber: "",
    processingType: "",
    submissionDate: "",
    expiryDate: "",
    buyingCost: 0,
    sellingPrice: 0,
  };
}