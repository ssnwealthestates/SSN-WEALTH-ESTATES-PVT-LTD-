export type LoanType =
  | 'Property Loan'
  | 'Mortgage Loan'
  | 'Business Loan'
  | 'Agriculture Land Loan'
  | 'Bank Cheque Based Loan'
  | 'Other';

export type PropertyType =
  | 'Residential Property'
  | 'Commercial Property'
  | 'Agriculture Land'
  | 'Vacant Site'
  | 'Other';

export interface ApplicantDetails {
  applicantFullName: string;
  fatherHusbandName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  emailAddress: string;
  aadhaarNumber: string;
  panNumber: string;
  residentialAddress: string;
  villageTown: string;
  district: string;
  state: string;
  pincode: string;
}

export interface OccupationIncomeDetails {
  occupationBusiness: string;
  companyBusinessName: string;
  monthlyIncome: string;
  otherIncome: string;
  existingLoanDetails: string;
  monthlyEmi: string;
}

export interface LoanDetails {
  loanType: LoanType | '';
  loanTypeOther: string;
  loanAmountRequired: string;
  purposeOfLoan: string;
  preferredLoanTenure: string;
}

export interface PropertyDetails {
  propertyType: PropertyType | '';
  propertyTypeOther: string;
  propertyLocation: string;
  district: string;
  taluk: string;
  village: string;
  surveyNumber: string;
  extentPropertyArea: string;
  estimatedPropertyValue: string;
}

export interface CoApplicantDetails {
  coApplicantName: string;
  relationship: string;
  mobileNumber: string;
  occupationBusiness: string;
  monthlyIncome: string;
}

export interface GuarantorDetails {
  guarantorName: string;
  relationship: string;
  mobileNumber: string;
  occupationBusiness: string;
  address: string;
}

export interface DeclarationDetails {
  isAccepted: boolean;
  applicantName: string;
  date: string;
  place: string;
  signatureDataUrl?: string;
}

export interface DocumentItemDef {
  key: string;
  label: string;
  sanitizedName: string;
  isRequired: boolean;
}

export interface UploadedDocument {
  key: string;
  label: string;
  sanitizedName: string;
  file: File | null;
  fileName: string | null;
  fileSize: number | null;
  fileType: string | null;
}

export interface LoanApplicationFormData {
  applicant: ApplicantDetails;
  occupation: OccupationIncomeDetails;
  loan: LoanDetails;
  property: PropertyDetails;
  coApplicant: CoApplicantDetails;
  guarantor: GuarantorDetails;
  declaration: DeclarationDetails;
}

export const DOCUMENT_DEFINITIONS: DocumentItemDef[] = [
  { key: 'currentDeed', label: '1. Current Deed / Current Sale Deed', sanitizedName: 'Current_Deed', isRequired: true },
  { key: 'parentDeed', label: '2. Parent / Full Deed', sanitizedName: 'Parent_Deed', isRequired: true },
  { key: 'patta', label: '3. Patta', sanitizedName: 'Patta', isRequired: true },
  { key: 'chitta', label: '4. Chitta', sanitizedName: 'Chitta', isRequired: true },
  { key: 'ec', label: '5. Encumbrance Certificate (EC)', sanitizedName: 'EC', isRequired: true },
  { key: 'fmb', label: '6. FMB / Sketch', sanitizedName: 'FMB', isRequired: false },
  { key: 'aadhaarCopy', label: '7. Aadhaar Copy', sanitizedName: 'Aadhaar', isRequired: true },
  { key: 'panCopy', label: '8. PAN Copy', sanitizedName: 'PAN', isRequired: true },
  { key: 'bankStatement', label: '9. Bank Statement', sanitizedName: 'Bank_Statement', isRequired: true },
  { key: 'incomeProof', label: '10. Income Proof', sanitizedName: 'Income_Proof', isRequired: false },
  { key: 'coApplicantDoc', label: '11. Co-Applicant Documents', sanitizedName: 'Co_Applicant_Document', isRequired: false },
  { key: 'guarantorDoc', label: '12. Guarantor Documents', sanitizedName: 'Guarantor_Document', isRequired: false },
  { key: 'otherDoc', label: '13. Other Documents', sanitizedName: 'Other_Document', isRequired: false },
];

export type PaymentPurpose =
  | "Loan EMI"
  | "Processing Fee"
  | "Documentation Fee"
  | "Other Charges";

export interface PaymentFormData {
  customerName: string;
  applicationId: string;
  mobileNumber: string;
  email: string;
  amount: number | string;
  paymentPurpose: PaymentPurpose;
  remarks: string;
}

export interface PaymentReceipt {
  receiptNumber: string;
  paymentDate: string;
  customerName: string;
  applicationId: string;
  mobileNumber: string;
  email: string;
  paymentPurpose: PaymentPurpose;
  amount: number;
  amountInWords: string;
  transactionId: string;
  orderId: string;
  paymentMethod: string;
  status: "PAYMENT SUCCESSFUL" | "PAYMENT FAILED";
  remarks?: string;
  pdfBase64?: string;
}

export type PaymentRequestStatus = "PENDING" | "PAID";

export interface PaymentRequest {
  id: string; // e.g., PR-2026-0001
  applicationId: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  paymentPurpose: string;
  amount: number;
  dueDate: string;
  paymentLink: string;
  paymentStatus: PaymentRequestStatus;
  transactionId?: string;
  paidAt?: string;
  amountPaid?: number;
  paymentMethod?: string;
  receiptNumber?: string;
  createdAt: string;
  whatsAppStatus?: {
    lastSentType?: "created" | "reminder" | "paid" | "submitted";
    lastSentAt?: string;
    success?: boolean;
    provider?: string;
    messageId?: string;
  };
}

