import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  FileText,
  Send,
  Sparkles,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ApplicantDetailsSection } from "./components/ApplicantDetailsSection";
import { OccupationIncomeSection } from "./components/OccupationIncomeSection";
import { LoanDetailsSection } from "./components/LoanDetailsSection";
import { PropertyDetailsSection } from "./components/PropertyDetailsSection";
import { CoApplicantSection } from "./components/CoApplicantSection";
import { GuarantorSection } from "./components/GuarantorSection";
import { DocumentUploadSection } from "./components/DocumentUploadSection";
import { DeclarationSection } from "./components/DeclarationSection";
import { SuccessView } from "./components/SuccessView";
import { AiCustomerChat } from "./components/AiCustomerChat";
import { AdminPaymentPanel } from "./components/AdminPaymentPanel";
import { CustomerPaymentRequestView } from "./components/CustomerPaymentRequestView";
import {
  LoanApplicationFormData,
  UploadedDocument,
  DOCUMENT_DEFINITIONS,
} from "./types";
import { generateLoanApplicationPdf } from "./utils/pdfGenerator";
import {
  SubmitButtonWithProgress,
  StatusCheckItem,
  CheckStatus,
} from "./components/SubmitButtonWithProgress";
import {
  uploadLoanApplicationWithProgress,
  createLoanApplicationFormData,
} from "./utils/uploadService";

const initialFormData: LoanApplicationFormData = {
  applicant: {
    applicantFullName: "",
    fatherHusbandName: "",
    dateOfBirth: "",
    gender: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    emailAddress: "",
    aadhaarNumber: "",
    panNumber: "",
    residentialAddress: "",
    villageTown: "",
    district: "",
    state: "Tamil Nadu",
    pincode: "",
  },
  occupation: {
    occupationBusiness: "",
    companyBusinessName: "",
    monthlyIncome: "",
    otherIncome: "",
    existingLoanDetails: "",
    monthlyEmi: "",
  },
  loan: {
    loanType: "Property Loan",
    loanTypeOther: "",
    loanAmountRequired: "",
    purposeOfLoan: "",
    preferredLoanTenure: "",
  },
  property: {
    propertyType: "Residential Property",
    propertyTypeOther: "",
    propertyLocation: "",
    district: "",
    taluk: "",
    village: "",
    surveyNumber: "",
    extentPropertyArea: "",
    estimatedPropertyValue: "",
  },
  coApplicant: {
    coApplicantName: "",
    relationship: "",
    mobileNumber: "",
    occupationBusiness: "",
    monthlyIncome: "",
  },
  guarantor: {
    guarantorName: "",
    relationship: "",
    mobileNumber: "",
    occupationBusiness: "",
    address: "",
  },
  declaration: {
    isAccepted: false,
    applicantName: "",
    date: new Date().toISOString().split("T")[0],
    place: "",
  },
};

export default function App() {
  const [formData, setFormData] = useState<LoanApplicationFormData>(initialFormData);
  const [documents, setDocuments] = useState<UploadedDocument[]>(() =>
    DOCUMENT_DEFINITIONS.map((def) => ({
      key: def.key,
      label: def.label,
      sanitizedName: def.sanitizedName,
      file: null,
      fileName: null,
      fileSize: null,
      fileType: null,
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<string>("");
  const [submissionProgress, setSubmissionProgress] = useState<number>(0);
  const [submissionChecks, setSubmissionChecks] = useState<StatusCheckItem[]>([
    { id: "pdf", label: "PDF Ready", shortLabel: "PDF", status: "pending" },
    { id: "upload", label: "Uploading Files", shortLabel: "Upload", status: "pending" },
    { id: "email", label: "Email Sending", shortLabel: "Email", status: "pending" },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateStatusCheck = (
    id: "pdf" | "upload" | "email",
    status: CheckStatus,
    detail?: string
  ) => {
    setSubmissionChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, detail } : c))
    );
  };
  const [successInfo, setSuccessInfo] = useState<{
    applicationId: string;
    applicantName: string;
    loanType: string;
    loanAmount: string;
    pdfBlobUrl?: string;
    pdfFilename?: string;
    uploadedCount: number;
  } | null>(null);

  // AI Customer Assistant Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Admin Payment Management & Customer Pay Now states
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("admin") === "true" || window.location.hash === "#admin";
    }
    return false;
  });

  const [activePayRequestId, setActivePayRequestId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("payRequestId");
      if (id) return id;
      if (window.location.hash.startsWith("#pay=")) {
        return window.location.hash.replace("#pay=", "");
      }
    }
    return null;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const payId = params.get("payRequestId");
      if (payId) {
        setActivePayRequestId(payId);
      } else if (window.location.hash.startsWith("#pay=")) {
        setActivePayRequestId(window.location.hash.replace("#pay=", ""));
      } else {
        setActivePayRequestId(null);
      }

      if (params.get("admin") === "true" || window.location.hash === "#admin") {
        setIsAdminOpen(true);
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("hashchange", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("hashchange", handleLocationChange);
    };
  }, []);

  // Auto-restore draft from localStorage (especially helpful if user opens in a new tab to bypass iframe cookie limits)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ssn_loan_form_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFormData((prev) => ({
            ...prev,
            applicant: { ...prev.applicant, ...(parsed.applicant || {}) },
            occupation: { ...prev.occupation, ...(parsed.occupation || {}) },
            loan: { ...prev.loan, ...(parsed.loan || {}) },
            property: { ...prev.property, ...(parsed.property || {}) },
            coApplicant: { ...prev.coApplicant, ...(parsed.coApplicant || {}) },
            guarantor: { ...prev.guarantor, ...(parsed.guarantor || {}) },
            declaration: { ...prev.declaration, ...(parsed.declaration || {}) },
          }));
        }
      }
    } catch (e) {
      console.warn("Could not restore saved form draft", e);
    }
  }, []);

  const handleOpenInNewTab = () => {
    try {
      localStorage.setItem("ssn_loan_form_draft", JSON.stringify(formData));
    } catch (e) {
      console.warn("Could not save form draft", e);
    }
    window.open(window.location.href, "_blank");
  };

  // Field change handlers
  const handleApplicantChange = (field: keyof LoanApplicationFormData["applicant"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      applicant: { ...prev.applicant, [field]: value },
    }));
  };

  const handleOccupationChange = (field: keyof LoanApplicationFormData["occupation"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      occupation: { ...prev.occupation, [field]: value },
    }));
  };

  const handleLoanChange = (field: keyof LoanApplicationFormData["loan"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      loan: { ...prev.loan, [field]: value },
    }));
  };

  const handlePropertyChange = (field: keyof LoanApplicationFormData["property"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      property: { ...prev.property, [field]: value },
    }));
  };

  const handleCoApplicantChange = (field: keyof LoanApplicationFormData["coApplicant"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      coApplicant: { ...prev.coApplicant, [field]: value },
    }));
  };

  const handleGuarantorChange = (field: keyof LoanApplicationFormData["guarantor"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      guarantor: { ...prev.guarantor, [field]: value },
    }));
  };

  const handleDeclarationChange = (field: keyof LoanApplicationFormData["declaration"], value: any) => {
    setFormData((prev) => ({
      ...prev,
      declaration: { ...prev.declaration, [field]: value },
    }));
  };

  const handleFileChange = (key: string, file: File | null) => {
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.key === key) {
          return {
            ...doc,
            file,
            fileName: file ? file.name : null,
            fileSize: file ? file.size : null,
            fileType: file ? file.type : null,
          };
        }
        return doc;
      })
    );
  };

  const [activeStepId, setActiveStepId] = useState<string>("section-applicant");

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        "section-applicant",
        "section-occupation",
        "section-loan",
        "property-details",
        "section-coapplicant",
        "section-guarantor",
        "section-documents",
        "section-declaration",
      ];
      const scrollPosition = window.scrollY + 160;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveStepId(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const completedSteps: Record<string, boolean> = {
    "section-applicant": Boolean(
      formData.applicant.applicantFullName &&
      formData.applicant.mobileNumber &&
      formData.applicant.aadhaarNumber &&
      formData.applicant.panNumber &&
      formData.applicant.residentialAddress
    ),
    "section-occupation": Boolean(
      formData.occupation.occupationBusiness &&
      formData.occupation.monthlyIncome
    ),
    "section-loan": Boolean(
      formData.loan.loanType &&
      formData.loan.loanAmountRequired &&
      formData.loan.purposeOfLoan
    ),
    "section-property": Boolean(
      formData.property.propertyType &&
      formData.property.propertyLocation &&
      formData.property.surveyNumber
    ),
    "section-coapplicant": Boolean(formData.coApplicant.coApplicantName),
    "section-guarantor": Boolean(formData.guarantor.guarantorName),
    "section-documents":
      documents.filter((d) => d.file !== null && DOCUMENT_DEFINITIONS.find((def) => def.key === d.key)?.isRequired).length ===
      DOCUMENT_DEFINITIONS.filter((d) => d.isRequired).length,
    "section-declaration": formData.declaration.isAccepted,
  };

  // Helper to generate Application ID: SSN-LA-2026-XXXXXX
  const generateApplicationId = () => {
    const year = new Date().getFullYear();
    // Unique 6-digit sequence
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `SSN-LA-${year}-${randomSeq}`;
  };

  // Validation
  const validateForm = (): string | null => {
    const { applicant, occupation, loan, property, declaration } = formData;

    // Applicant Details
    if (!applicant.applicantFullName.trim()) return "Please enter Applicant Full Name.";
    if (!applicant.fatherHusbandName.trim()) return "Please enter Father's / Husband's Name.";
    if (!applicant.dateOfBirth) return "Please enter Applicant Date of Birth.";
    if (!applicant.gender) return "Please select Applicant Gender.";
    if (!applicant.mobileNumber || applicant.mobileNumber.length < 10)
      return "Please enter a valid 10-digit primary Mobile Number.";
    if (!applicant.emailAddress || !applicant.emailAddress.includes("@"))
      return "Please enter a valid Email Address.";
    if (!applicant.aadhaarNumber || applicant.aadhaarNumber.replace(/\s/g, "").length < 12)
      return "Please enter a valid 12-digit Aadhaar Number.";
    if (!applicant.panNumber || applicant.panNumber.length < 10)
      return "Please enter a valid 10-character PAN Number.";
    if (!applicant.residentialAddress.trim()) return "Please enter Residential Address.";
    if (!applicant.villageTown.trim()) return "Please enter Village / Town.";
    if (!applicant.district.trim()) return "Please enter District.";
    if (!applicant.state.trim()) return "Please enter State.";
    if (!applicant.pincode || applicant.pincode.length < 6)
      return "Please enter a valid 6-digit Pincode.";

    // Occupation Details
    if (!occupation.occupationBusiness.trim()) return "Please enter Occupation / Business.";
    if (!occupation.companyBusinessName.trim()) return "Please enter Company / Business Name.";
    if (!occupation.monthlyIncome.trim()) return "Please enter Monthly Income.";

    // Loan Details
    if (!loan.loanType) return "Please select Loan Type.";
    if (loan.loanType === "Other" && !loan.loanTypeOther.trim())
      return "Please specify your loan type in the other field.";
    if (!loan.loanAmountRequired.trim()) return "Please enter Loan Amount Required.";
    if (!loan.purposeOfLoan.trim()) return "Please enter Purpose of Loan.";
    if (!loan.preferredLoanTenure.trim()) return "Please enter Preferred Loan Tenure.";

    // Property Details
    if (!property.propertyType) return "Please select Property Type.";
    if (property.propertyType === "Other" && !property.propertyTypeOther.trim())
      return "Please specify your property type in the other field.";
    if (!property.propertyLocation.trim()) return "Please enter Property Location.";
    if (!property.district.trim()) return "Please enter Property District.";
    if (!property.taluk.trim()) return "Please enter Property Taluk.";
    if (!property.village.trim()) return "Please enter Property Village.";
    if (!property.surveyNumber.trim()) return "Please enter Property Survey Number.";
    if (!property.extentPropertyArea.trim()) return "Please enter Extent / Property Area.";
    if (!property.estimatedPropertyValue.trim()) return "Please enter Estimated Property Value.";

    // Mandatory Document Uploads Check
    const mandatoryDefs = DOCUMENT_DEFINITIONS.filter((d) => d.isRequired);
    for (const def of mandatoryDefs) {
      const doc = documents.find((d) => d.key === def.key);
      if (!doc || !doc.file) {
        return `Mandatory Document Missing: Please upload ${def.label}.`;
      }
    }

    // Declaration Check
    if (!declaration.isAccepted) {
      return "You must accept the Declaration checkbox before submitting the loan application.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      window.scrollTo({ top: 400, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setSubmissionProgress(5);
    setSubmitStep("Preparing application submission...");
    setSubmissionChecks([
      { id: "pdf", label: "PDF Ready", shortLabel: "PDF", status: "active", detail: "generating..." },
      { id: "upload", label: "Uploading Files", shortLabel: "Upload", status: "pending" },
      { id: "email", label: "Email Sending", shortLabel: "Email", status: "pending" },
    ]);

    try {
      // 1. Generate Unique Application ID
      const appId = generateApplicationId();
      setSubmissionProgress(15);
      setSubmitStep("Generating official A4 Loan Application PDF...");

      // 2. Generate Professional A4 Loan Application PDF with Official Logo
      const pdfResult = await generateLoanApplicationPdf(appId, formData, documents);

      // Status Check 1: PDF Ready!
      updateStatusCheck("pdf", "completed");
      setSubmissionProgress(30);
      setSubmitStep("PDF Ready • Initiating automatic download...");

      // 3. Initiate automatic PDF download for applicant
      const downloadUrl = URL.createObjectURL(pdfResult.blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = pdfResult.filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Subtle pause so user perceives the verified check
      await new Promise((r) => setTimeout(r, 300));

      // 4. Send the generated PDF + ALL uploaded documents to backend
      updateStatusCheck("upload", "active", "0%");
      setSubmissionProgress(35);
      setSubmitStep("Uploading application files & deeds...");

      // Prepare audited FormData: captures all selected documents and formats filenames with Application ID
      const submitData = createLoanApplicationFormData({
        applicationId: appId,
        formData,
        pdfBlob: pdfResult.blob,
        pdfFilename: pdfResult.filename,
        documents,
      });

      // Upload with live XMLHttpRequest progress tracking
      const uploadResponse = await uploadLoanApplicationWithProgress(
        submitData,
        (percent) => {
          // Map file upload progress 0-100% to 35% -> 80%
          const overall = Math.min(80, Math.round(35 + (percent * 0.45)));
          setSubmissionProgress(overall);

          if (percent < 100) {
            updateStatusCheck("upload", "active", `${percent}%`);
            setSubmitStep(`Uploading files (${percent}%)...`);
          } else {
            // Status Check 2: Upload complete, transition to Email Sending
            updateStatusCheck("upload", "completed");
            updateStatusCheck("email", "active");
            setSubmissionProgress(85);
            setSubmitStep("Email sending to ssnwealthestates@gmail.com...");
          }
        }
      );

      // Process server response
      let result = uploadResponse.data;
      const rawText = uploadResponse.rawText;

      if (!result && rawText && rawText.trim().length > 0) {
        let extractedError = "";
        if (rawText.includes("<title>")) {
          const titleMatch = rawText.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            extractedError = titleMatch[1].trim();
          }
        } else if (rawText.includes("<h1>")) {
          const h1Match = rawText.match(/<h1>(.*?)<\/h1>/i);
          if (h1Match && h1Match[1]) {
            extractedError = h1Match[1].trim();
          }
        }

        const isCookieCheck =
          uploadResponse.isCookieCheck ||
          extractedError.toLowerCase().includes("cookie check") ||
          rawText.toLowerCase().includes("cookie check");

        if (isCookieCheck) {
          extractedError =
            "Third-Party Cookie Restriction: Browser privacy settings blocked session cookies inside the embedded preview frame. Please click 'Open in New Tab & Submit' below to submit directly in a dedicated window without any restrictions.";
        } else if (
          uploadResponse.status === 413 ||
          extractedError.toLowerCase().includes("large")
        ) {
          extractedError =
            "Uploaded documents exceed the maximum upload size limit. Please ensure your files are compressed and under 30MB.";
        } else if (
          uploadResponse.status === 504 ||
          extractedError.toLowerCase().includes("timeout")
        ) {
          extractedError =
            "The server timed out while transmitting attachments. Please check connection and retry.";
        } else if (!extractedError) {
          extractedError = `Server returned HTTP status ${uploadResponse.status} (${
            rawText.slice(0, 100) || "Error"
          }).`;
        }

        result = {
          success: false,
          error: extractedError,
        };
      }

      if (!uploadResponse.ok || !result || !result.success) {
        updateStatusCheck("email", "error");
        let errDesc =
          result?.error ||
          result?.details ||
          `Unable to deliver your application email (HTTP ${uploadResponse.status}). Please try again.`;

        if (
          uploadResponse.isCookieCheck ||
          errDesc.toLowerCase().includes("cookie check")
        ) {
          errDesc =
            "Third-Party Cookie Restriction: Browser privacy settings blocked session cookies inside the embedded preview frame. Please click 'Open in New Tab & Submit' below to submit directly in a dedicated window without any restrictions.";
        }

        throw new Error(errDesc);
      }

      // Status Check 3: Email Sending successfully finished!
      updateStatusCheck("pdf", "completed");
      updateStatusCheck("upload", "completed");
      updateStatusCheck("email", "completed");
      setSubmissionProgress(100);
      setSubmitStep("Application successfully sent to SSN Wealth Capital!");

      // Clear draft on successful submission
      try {
        localStorage.removeItem("ssn_loan_form_draft");
      } catch {
        // ignore
      }

      // Brief visual completion pause
      await new Promise((r) => setTimeout(r, 400));

      // Final Success State
      const uploadedFilesCount = documents.filter((d) => d.file !== null).length;
      setSuccessInfo({
        applicationId: appId,
        applicantName: formData.applicant.applicantFullName,
        loanType: formData.loan.loanType,
        loanAmount: formData.loan.loanAmountRequired,
        pdfBlobUrl: downloadUrl,
        pdfFilename: pdfResult.filename,
        uploadedCount: uploadedFilesCount,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Submission failed:", err);
      const userMessage =
        err.message ||
        "Unable to send your application at this time. Please try again.";
      setErrorMessage(userMessage);

      // Smoothly scroll to the error notification so the user sees it immediately
      setTimeout(() => {
        const errorEl = document.getElementById("submission-error-banner");
        if (errorEl) {
          errorEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  };

  const handleDownloadExistingPdf = async () => {
    if (successInfo?.pdfBlobUrl) {
      const link = document.createElement("a");
      link.href = successInfo.pdfBlobUrl;
      link.download = successInfo.pdfFilename || `SSN_Loan_Application_${successInfo.applicationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (successInfo) {
      // Regenerate on demand
      const pdfResult = await generateLoanApplicationPdf(
        successInfo.applicationId,
        formData,
        documents
      );
      const url = URL.createObjectURL(pdfResult.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleStartNewApplication = () => {
    setFormData(initialFormData);
    setDocuments(
      DOCUMENT_DEFINITIONS.map((def) => ({
        key: def.key,
        label: def.label,
        sanitizedName: def.sanitizedName,
        file: null,
        fileName: null,
        fileSize: null,
        fileType: null,
      }))
    );
    setSuccessInfo(null);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F4F4F9] text-slate-900 flex flex-col font-sans selection:bg-[#D4AF37] selection:text-[#001F3F]">
      {/* Brand Header */}
      <Header
        applicationId={successInfo?.applicationId || "SSN-LA-2026-000001"}
        onOpenChat={() => setIsChatOpen(true)}
        onToggleAdmin={() => {
          setIsAdminOpen((prev) => !prev);
          if (!isAdminOpen) {
            setActivePayRequestId(null);
          }
        }}
        isAdminActive={isAdminOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5">
        {activePayRequestId ? (
          /* Customer Payment Request View ("PAY NOW" flow) */
          <CustomerPaymentRequestView
            requestId={activePayRequestId}
            onBack={() => {
              setActivePayRequestId(null);
              window.history.pushState({}, "", window.location.pathname);
            }}
          />
        ) : isAdminOpen ? (
          /* Admin Payment Request & WhatsApp Panel */
          <AdminPaymentPanel
            onBack={() => {
              setIsAdminOpen(false);
              if (window.location.hash === "#admin") {
                window.history.pushState({}, "", window.location.pathname);
              }
            }}
            onOpenCustomerPay={(reqId) => setActivePayRequestId(reqId)}
          />
        ) : successInfo ? (
          /* Final Success View */
          <SuccessView
            applicationId={successInfo.applicationId}
            applicantName={successInfo.applicantName}
            loanType={successInfo.loanType}
            loanAmount={successInfo.loanAmount}
            pdfBlobUrl={successInfo.pdfBlobUrl}
            pdfFilename={successInfo.pdfFilename}
            uploadedCount={successInfo.uploadedCount}
            onNewApplication={handleStartNewApplication}
            onDownloadPdf={handleDownloadExistingPdf}
          />
        ) : (
          <div className="flex gap-5 items-start">
            {/* Sidebar Navigation */}
            <Sidebar
              activeStepId={activeStepId}
              onStepClick={setActiveStepId}
              completedSteps={completedSteps}
              onOpenChat={() => setIsChatOpen(true)}
            />

            {/* Main Form Content */}
            <main className="flex-1 min-w-0">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                {/* Quick Informational Notice */}
                <div className="bg-white border border-slate-200 border-l-4 border-l-[#D4AF37] p-3 sm:p-3.5 rounded shadow-sm flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-[#001F3F]">Confidential Online Processing:</span>{" "}
                    Please fill in all mandatory fields with accurate records. An official A4 Loan Application PDF will be automatically generated, downloaded to your device, and dispatched along with all uploaded document attachments directly to our loan underwriting committee.
                  </div>
                </div>

                {/* Error Notification Alert */}
                {errorMessage && (
                  <div
                    id="submission-error-banner"
                    className="bg-red-50 border-2 border-red-400 rounded-lg p-3.5 sm:p-4 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-red-900 text-xs sm:text-sm">
                            {errorMessage.includes("SMTP") ||
                            errorMessage.includes("Email") ||
                            errorMessage.includes("Credentials")
                              ? "Email Transmission Failed"
                              : "Submission Incomplete"}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setErrorMessage(null)}
                            className="text-red-500 hover:text-red-800 text-[11px] font-semibold underline cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                        <p className="text-red-800 text-xs font-medium leading-relaxed break-words">
                          {errorMessage}
                        </p>
                        <p className="text-[10px] text-red-600 italic">
                          Your entered form data and all uploaded files have been safely preserved. You can retry immediately.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-red-200">
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e)}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Submission</span>
                      </button>
                      <span className="text-[11px] text-red-700">
                        Attempts sending with all attachments to ssnwealthestates@gmail.com
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Sections (1 to 8) */}
                <div className="space-y-4 sm:space-y-5">
                  {/* 1. Applicant Details */}
                  <ApplicantDetailsSection
                    data={formData.applicant}
                    onChange={handleApplicantChange}
                  />

                  {/* 2. Occupation & Income */}
                  <OccupationIncomeSection
                    data={formData.occupation}
                    onChange={handleOccupationChange}
                  />

                  {/* 3. Loan Details */}
                  <LoanDetailsSection
                    data={formData.loan}
                    onChange={handleLoanChange}
                  />

                  {/* 4. Property Details */}
                  <PropertyDetailsSection
                    data={formData.property}
                    onChange={handlePropertyChange}
                  />

                  {/* 5. Co-Applicant Details */}
                  <CoApplicantSection
                    data={formData.coApplicant}
                    onChange={handleCoApplicantChange}
                  />

                  {/* 6. Guarantor Details */}
                  <GuarantorSection
                    data={formData.guarantor}
                    onChange={handleGuarantorChange}
                  />

                  {/* 7. Document Upload */}
                  <DocumentUploadSection
                    documents={documents}
                    onFileChange={handleFileChange}
                  />

                  {/* 8. Declaration */}
                  <DeclarationSection
                    data={formData.declaration}
                    applicantFullName={formData.applicant.applicantFullName}
                    defaultPlace={formData.applicant.villageTown || "Annur"}
                    onChange={handleDeclarationChange}
                  />
                </div>

                {/* High Density Gold Submit Button Area */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 p-4 sm:p-5 text-center space-y-3">
                  {errorMessage && (
                    <div id="submission-error-banner" className="bg-red-50 border border-red-300 rounded p-3 text-left space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>
                            {errorMessage.toLowerCase().includes("cookie") ||
                            errorMessage.toLowerCase().includes("third-party")
                              ? "Browser Privacy Notice: Cookie Check"
                              : "Submission Error: Email Not Sent"}
                          </span>
                        </div>
                      </div>
                      <p className="text-red-800 text-[11px] leading-relaxed break-words">
                        {errorMessage}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {(errorMessage.toLowerCase().includes("cookie") ||
                          errorMessage.toLowerCase().includes("third-party")) && (
                          <button
                            type="button"
                            onClick={handleOpenInNewTab}
                            className="px-3.5 py-1.5 bg-[#001F3F] hover:bg-[#002d5c] text-[#D4AF37] border border-[#D4AF37] text-[11px] font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open in New Tab &amp; Submit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleSubmit(e)}
                          disabled={isSubmitting}
                          className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Click to Retry Submission</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {!isSubmitting && (
                    <div className="max-w-md mx-auto space-y-1 text-xs text-slate-600">
                      <p className="font-semibold text-slate-900">
                        Ready to submit your application?
                      </p>
                      <p className="text-[11px]">
                        Clicking submit validates your form, generates an official A4 PDF, starts immediate file download, and securely transmits all uploaded documents to{" "}
                        <strong className="text-[#001F3F]">ssnwealthestates@gmail.com</strong>.
                      </p>
                    </div>
                  )}

                  {/* Submit Button with subtle progress animation and individual status checks */}
                  <SubmitButtonWithProgress
                    isSubmitting={isSubmitting}
                    activeStatusHeadline={submitStep || "Processing Submission..."}
                    checks={submissionChecks}
                    overallProgress={submissionProgress}
                    disabled={isSubmitting}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Instant A4 PDF Generation
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Automatic PDF Download
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Original Deeds Attached
                    </span>
                  </div>
                </div>
              </form>
            </main>
          </div>
        )}
      </div>

      {/* Corporate High Density Footer */}
      <footer className="bg-[#001F3F] text-white border-t border-[#D4AF37] mt-8 py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-0.5">
            <h3 className="font-bold text-xs sm:text-sm text-[#D4AF37] tracking-wider uppercase">
              SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED
            </h3>
            <p className="text-[11px] text-slate-300">
              SSN Wealth Capital • Your Trusted Financial Partner
            </p>
            <p className="text-[10px] text-slate-400">
              Mettupalayam Road, Near Mettur Super Service, Annur – 641653
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-300">
            <div>
              <span className="text-slate-400 text-[10px] mr-1">Direct Helpline:</span>
              <a href="tel:9600245924" className="text-[#D4AF37] hover:underline font-semibold text-xs">
                9600245924
              </a>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <div>
              <span className="text-slate-400 text-[10px] mr-1">Submission Email:</span>
              <a href="mailto:ssnwealthestates@gmail.com" className="text-[#D4AF37] hover:underline font-semibold text-xs">
                ssnwealthestates@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-800 text-center text-[10px] text-slate-400">
          © {new Date().getFullYear()} SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED. All rights reserved. Official online loan processing portal.
        </div>
      </footer>

      {/* 24/7 AI Customer Loan Advisor Chat Widget */}
      <AiCustomerChat
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen((prev) => !prev)}
      />
    </div>
  );
}
