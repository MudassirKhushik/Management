// src/lib/visaBookingTypes.ts

export type VisaRow = {
  id: string; // local-only id (React key), not necessarily a saved database id
  visaCategory: string;
  applicantName: string;
  passportNumber: string;
  companyName: string; // Phase 4a — applicant's employer, optional in the DB
  processingType: string;
  submissionDate: string; // "YYYY-MM-DD", matches an <input type="date">
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
    companyName: "",
    processingType: "",
    submissionDate: "",
    expiryDate: "",
    buyingCost: 0,
    sellingPrice: 0,
  };
}