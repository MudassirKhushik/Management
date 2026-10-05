// src/lib/visaBookingTypes.ts

export type VisaRow = {
  id: string;
  vendorId: string;
  visaCategory: string;
  applicantName: string;
  passportNumber: string;
  companyName: string;
  processingType: string;
  submissionDate: string;
  expiryDate: string;
  buyingCost: number;
  sellingPrice: number;
};

export const PROCESSING_TYPES = ["Normal", "Urgent", "Express"];

export function emptyVisaRow(): VisaRow {
  return {
    id: crypto.randomUUID(),
    vendorId: "",
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