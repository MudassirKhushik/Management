export type VisaEntry = {
  applicantName: string;
  visaType: string;
  processingType: string;
  issueDate: string;
  expiryDate: string;
  visaFee: number;
  serviceCharge: number;
  confirmationNo: string;
};

export const emptyVisaEntry: VisaEntry = {
  applicantName: "",
  visaType: "",
  processingType: "",
  issueDate: "",
  expiryDate: "",
  visaFee: 0,
  serviceCharge: 0,
  confirmationNo: "",
};