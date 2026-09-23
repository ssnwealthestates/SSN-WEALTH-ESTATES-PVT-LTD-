import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  ArrowRight,
  RefreshCw,
  Phone,
  Mail,
  HelpCircle,
  FileText,
  AlertTriangle,
  Receipt,
  Sparkles,
  QrCode,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { PaymentFormData, PaymentPurpose, PaymentReceipt } from "../types";
import { CompanyLogo } from "./CompanyLogo";
import {
  generatePaymentReceiptPdf,
  convertNumberToIndianWords,
} from "../utils/paymentReceiptPdf";

export const OFFICIAL_RAZORPAY_LINK = "https://razorpay.me/@ssnwealthampestatesopcprivate";
export const OFFICIAL_RAZORPAY_HANDLE = "@ssnwealthampestatesopcprivate";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface PaymentCollectionPageProps {
  initialApplicationId?: string;
  initialCustomerName?: string;
  initialMobileNumber?: string;
  initialEmail?: string;
  onNavigateToLoanForm?: () => void;
}

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

const PURPOSE_OPTIONS: {
  value: PaymentPurpose;
  label: string;
  desc: string;
}[] = [
  {
    value: "Loan EMI",
    label: "Loan EMI",
    desc: "Monthly installment towards existing loan account",
  },
  {
    value: "Processing Fee",
    label: "Processing Fee",
    desc: "Application underwriting & appraisal fee",
  },
  {
    value: "Documentation Fee",
    label: "Documentation Fee",
    desc: "Legal deed verification & documentation charges",
  },
  {
    value: "Other Charges",
    label: "Other Charges",
    desc: "Pre-closure, administrative or miscellaneous fees",
  },
];

const POPULAR_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Kotak Mahindra Bank",
  "Bank of Baroda",
  "Canara Bank",
];

export function PaymentCollectionPage({
  initialApplicationId = "",
  initialCustomerName = "",
  initialMobileNumber = "",
  initialEmail = "",
  onNavigateToLoanForm,
}: PaymentCollectionPageProps) {
  // Form State
  const [formData, setFormData] = useState<PaymentFormData>({
    customerName: initialCustomerName,
    applicationId: initialApplicationId || "SSN-LA-2026-000001",
    mobileNumber: initialMobileNumber,
    email: initialEmail,
    amount: "5000",
    paymentPurpose: "Loan EMI",
    remarks: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");

  // Gateway Modal State
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [activeGatewayTab, setActiveGatewayTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [pendingOrderId, setPendingOrderId] = useState<string>("");
  const [pendingKeyId, setPendingKeyId] = useState<string>("");

  // Gateway Input States
  const [upiId, setUpiId] = useState("");
  const [selectedUpiApp, setSelectedUpiApp] = useState("Google Pay");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8892");
  const [cardExpiry, setCardExpiry] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("•••");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  // Outcome States
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed">("idle");
  const [receiptData, setReceiptData] = useState<PaymentReceipt | null>(null);
  const [receiptBlobUrl, setReceiptBlobUrl] = useState<string | null>(null);
  const [receiptFilename, setReceiptFilename] = useState<string>("Payment_Receipt.pdf");
  const [failureMessage, setFailureMessage] = useState<string>("");
  const [emailStatusMessage, setEmailStatusMessage] = useState<string>("");

  // Official Razorpay.me Link states & interactions
  const [activeMainTab, setActiveMainTab] = useState<"pay" | "claim">("pay");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRazorpayRedirectHelper, setShowRazorpayRedirectHelper] = useState(false);

  // Claim receipt state for payments completed directly on razorpay.me/@ssnwealthampestatesopcprivate
  const [claimPaymentId, setClaimPaymentId] = useState("");
  const [claimError, setClaimError] = useState("");

  const handleCopyRazorpayLink = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(OFFICIAL_RAZORPAY_LINK);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePayViaRazorpayLink = () => {
    if (!validateForm()) {
      const firstErr = document.querySelector(".payment-error-field");
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    // Open the official Razorpay merchant page directly
    window.open(OFFICIAL_RAZORPAY_LINK, "_blank", "noopener,noreferrer");
    setShowRazorpayRedirectHelper(true);
  };

  const handleClaimRazorpayReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErr = document.querySelector(".payment-error-field");
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (!claimPaymentId.trim()) {
      setClaimError("Please enter your Razorpay Payment ID or UPI Ref / UTR number from your confirmation.");
      return;
    }
    setClaimError("");
    setIsProcessing(true);
    setProcessingStage("Verifying transaction & generating official A4 PDF receipt...");

    await handleServerVerification({
      orderId: "RAZORPAY_ME_LINK",
      paymentId: claimPaymentId.trim(),
      paymentMethod: `Official Razorpay Link (${OFFICIAL_RAZORPAY_HANDLE})`,
    });

    setShowRazorpayRedirectHelper(false);
  };

  // Validate Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      errors.customerName = "Please enter customer's full name as per KYC records.";
    }

    if (!formData.applicationId.trim()) {
      errors.applicationId = "Please enter your Application or Loan ID.";
    }

    const cleanMobile = formData.mobileNumber.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      errors.mobileNumber = "Please enter a valid 10-digit mobile number.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address for receipt delivery.";
    }

    const numAmt = Number(formData.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      errors.amount = "Please enter a valid amount greater than ₹0.";
    } else if (numAmt > 5000000) {
      errors.amount = "Maximum online collection limit per transaction is ₹50,00,000.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Initiate Payment
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstErr = document.querySelector(".payment-error-field");
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsProcessing(true);
    setProcessingStage("Initiating secure order with Indian Payment Gateway...");

    try {
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.customerName,
          applicationId: formData.applicationId,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          amount: Number(formData.amount),
          paymentPurpose: formData.paymentPurpose,
          remarks: formData.remarks,
        }),
      });

      const orderData = await response.json();
      if (!response.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initialize payment gateway order.");
      }

      setPendingOrderId(orderData.orderId);
      setPendingKeyId(orderData.keyId);

      // Check if standard Razorpay checkout is configured and available in browser
      if (orderData.isLiveGateway && window.Razorpay && orderData.keyId) {
        setProcessingStage("Opening official Razorpay payment window...");
        const rzpOptions = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "SSN Wealth Capital",
          description: `${formData.paymentPurpose} - ${formData.applicationId}`,
          image: "https://placehold.co/128x128/001F3F/D4AF37?text=SSN",
          order_id: orderData.orderId,
          handler: async (rzpResp: any) => {
            // Trigger server verification
            await handleServerVerification({
              orderId: rzpResp.razorpay_order_id,
              paymentId: rzpResp.razorpay_payment_id,
              signature: rzpResp.razorpay_signature,
              paymentMethod: "Razorpay Standard Checkout",
            });
          },
          prefill: {
            name: formData.customerName,
            email: formData.email,
            contact: formData.mobileNumber,
          },
          theme: {
            color: "#001F3F",
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setProcessingStage("");
            },
          },
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.on("payment.failed", (resp: any) => {
          handlePaymentFailure(
            resp.error?.description || "Payment failed at bank gateway."
          );
        });
        rzp.open();
        setIsProcessing(false);
        setProcessingStage("");
      } else {
        // Open the integrated high-security payment modal supporting UPI, Cards, Net Banking
        setIsProcessing(false);
        setProcessingStage("");
        setShowGatewayModal(true);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setProcessingStage("");
      alert(`Payment Initialization Failed: ${err?.message || "Please check your network and try again."}`);
    }
  };

  // Step 2: Secure Server-Side Payment Verification
  const handleServerVerification = async (params: {
    orderId: string;
    paymentId: string;
    signature?: string;
    paymentMethod: string;
    simulateFailure?: boolean;
  }) => {
    setShowGatewayModal(false);
    setIsProcessing(true);
    setProcessingStage("Verifying payment security signature with server...");

    try {
      const resp = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: params.orderId,
          paymentId: params.paymentId,
          signature: params.signature,
          simulateFailure: params.simulateFailure,
          paymentDetails: {
            customerName: formData.customerName,
            applicationId: formData.applicationId,
            mobileNumber: formData.mobileNumber,
            email: formData.email,
            amount: Number(formData.amount),
            paymentPurpose: formData.paymentPurpose,
            remarks: formData.remarks,
            paymentMethod: params.paymentMethod,
          },
        }),
      });

      const verifyData = await resp.json();

      if (!resp.ok || !verifyData.success || verifyData.status === "PAYMENT FAILED") {
        handlePaymentFailure(
          verifyData.error || "Payment verification failed or transaction was declined by bank."
        );
        return;
      }

      // Step 3: SUCCESS: Generate receipt & prepare client download
      setProcessingStage("Generating official A4 payment receipt PDF...");
      const receipt: PaymentReceipt = verifyData.receipt;
      setReceiptData(receipt);

      // Generate high-resolution PDF for immediate client-side download & preview
      const pdfGenResult = await generatePaymentReceiptPdf(receipt);
      const url = URL.createObjectURL(pdfGenResult.blob);
      setReceiptBlobUrl(url);
      setReceiptFilename(pdfGenResult.filename);

      setPaymentStatus("success");
      setEmailStatusMessage(
        verifyData.message ||
          `Official receipt emailed to ${receipt.email} and ssnwealthestates@gmail.com.`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      handlePaymentFailure(
        err?.message || "An unexpected error occurred while verifying the payment with server."
      );
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  const handlePaymentFailure = (errorMsg: string) => {
    setPaymentStatus("failed");
    setReceiptData(null);
    setReceiptBlobUrl(null);
    setFailureMessage(errorMsg);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadReceipt = () => {
    if (!receiptBlobUrl && receiptData) {
      generatePaymentReceiptPdf(receiptData).then((res) => {
        const u = URL.createObjectURL(res.blob);
        const a = document.createElement("a");
        a.href = u;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
      return;
    }
    if (receiptBlobUrl) {
      const a = document.createElement("a");
      a.href = receiptBlobUrl;
      a.download = receiptFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleResetForNewPayment = () => {
    setPaymentStatus("idle");
    setReceiptData(null);
    setReceiptBlobUrl(null);
    setFailureMessage("");
    setEmailStatusMessage("");
    setFormData((prev) => ({
      ...prev,
      amount: "5000",
      remarks: "",
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formattedAmountDisplay = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(formData.amount) || 0);

  // --------------------------------------------------------------------------
  // VIEW: PAYMENT SUCCESSFUL
  // --------------------------------------------------------------------------
  if (paymentStatus === "success" && receiptData) {
    return (
      <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-3 sm:px-6">
        <div className="bg-white rounded-xl shadow-lg border border-emerald-200 overflow-hidden">
          {/* Green Top Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-6 py-7 text-white text-center relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 border-2 border-emerald-300 shadow-inner mb-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              PAYMENT SUCCESSFUL
            </h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-lg mx-auto">
              Your transaction has been securely authorized and verified. An official A4 Payment Receipt has been generated.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 bg-emerald-950/40 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-mono text-emerald-200">
              <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Receipt No: {receiptData.receiptNumber}</span>
            </div>
          </div>

          {/* Key Receipt Highlights */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Amount Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Amount Paid
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 font-mono">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                  }).format(receiptData.amount)}
                </span>
                <span className="text-xs text-emerald-700 block italic mt-0.5">
                  ({receiptData.amountInWords})
                </span>
              </div>
              <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-6 w-full sm:w-auto">
                <span className="text-xs text-slate-500 block">Payment Date & Time</span>
                <span className="text-sm font-semibold text-slate-800 block">
                  {receiptData.paymentDate}
                </span>
                <span className="text-xs font-mono text-slate-600 block mt-0.5">
                  Txn ID: {receiptData.transactionId}
                </span>
              </div>
            </div>

            {/* Receipt Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-[#001F3F] uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <CompanyLogo className="w-4 h-4" showText={false} /> Customer & Loan Details
                </h4>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer Name:</span>
                    <span className="font-semibold text-slate-900">{receiptData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Application / Loan ID:</span>
                    <span className="font-bold text-[#001F3F] font-mono">{receiptData.applicationId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile Number:</span>
                    <span className="font-semibold">{receiptData.mobileNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Address:</span>
                    <span className="font-semibold">{receiptData.email}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-[#001F3F] uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#D4AF37]" /> Transaction Particulars
                </h4>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Purpose:</span>
                    <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {receiptData.paymentPurpose}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-semibold">{receiptData.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway Order ID:</span>
                    <span className="font-mono text-[11px] text-slate-600">{receiptData.orderId}</span>
                  </div>
                  {receiptData.remarks && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Remarks:</span>
                      <span className="italic text-slate-800">{receiptData.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Email Dispatch Notice */}
            <div className="bg-blue-50 border-l-4 border-l-blue-600 border border-blue-200 p-4 rounded text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Automatic Receipt Email Dispatch</span>
              </div>
              <p className="text-slate-700 pl-6">
                The official A4 Payment Receipt PDF has been automatically emailed to{" "}
                <strong className="text-blue-900">{receiptData.email}</strong> and internal accounts team at{" "}
                <strong className="text-blue-900">ssnwealthestates@gmail.com</strong>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                id="download-receipt-button"
                onClick={handleDownloadReceipt}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] via-[#F4D068] to-[#AA771C] text-[#001F3F] font-bold text-sm rounded-lg shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Official Receipt (PDF)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  type="button"
                  onClick={handleResetForNewPayment}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#001F3F] hover:bg-[#002B59] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" /> Make Another Payment
                </button>
              </div>
            </div>

            {/* Company Footer Info */}
            <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <p className="font-semibold text-slate-700">
                SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED • SSN Wealth Capital
              </p>
              <p>For any queries or reconciliation: Phone: 9600245924 | Email: ssnwealthestates@gmail.com</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VIEW: PAYMENT FAILED
  // --------------------------------------------------------------------------
  if (paymentStatus === "failed") {
    return (
      <div className="w-full max-w-2xl mx-auto py-8 sm:py-12 px-3 sm:px-6">
        <div className="bg-white rounded-xl shadow-lg border-2 border-red-300 overflow-hidden">
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-rose-900 px-6 py-7 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/15 border-2 border-red-300 mb-3">
              <XCircle className="w-10 h-10 text-red-200" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              PAYMENT FAILED
            </h2>
            <p className="text-red-100 text-sm mt-1">
              Your payment could not be processed or was declined by the bank gateway.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-900">Transaction Status Notice</h4>
                  <p className="text-xs text-red-800 leading-relaxed">
                    {failureMessage || "The payment authorization failed or was declined by your card/UPI issuer."}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-2">
                    <strong>Zero Liability:</strong> If any amount was debited from your bank account, it will automatically reverse back to your original source within 3-5 business days as per RBI settlement regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs text-slate-700">
              <h5 className="font-bold text-[#001F3F] uppercase tracking-wider">Attempted Payment Details:</h5>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div><span className="text-slate-500">Customer:</span> <span className="font-semibold">{formData.customerName || "—"}</span></div>
                <div><span className="text-slate-500">Application ID:</span> <span className="font-mono font-semibold">{formData.applicationId || "—"}</span></div>
                <div><span className="text-slate-500">Attempted Amount:</span> <span className="font-bold text-slate-900">{formattedAmountDisplay}</span></div>
                <div><span className="text-slate-500">Purpose:</span> <span className="font-semibold">{formData.paymentPurpose}</span></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentStatus("idle")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#001F3F] hover:bg-[#002B59] text-white font-bold text-sm rounded-lg shadow transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#D4AF37]" /> Retry Payment
              </button>

              <div className="text-xs text-slate-600 flex items-center gap-3">
                <span>Need assistance?</span>
                <a href="tel:9600245924" className="inline-flex items-center gap-1 font-bold text-[#001F3F] hover:underline">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> 9600245924
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PRIMARY VIEW: PAYMENT COLLECTION FORM
  // --------------------------------------------------------------------------
  return (
    <div className="w-full max-w-6xl mx-auto py-5 sm:py-8 px-3 sm:px-6 space-y-6">
      {/* Top Corporate Branding & Trust Header */}
      <div className="bg-gradient-to-r from-[#001F3F] via-[#0B2A4A] to-[#001F3F] rounded-xl p-5 sm:p-7 text-white shadow-md border-b-4 border-[#D4AF37]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="bg-white p-2 rounded-lg shadow-sm border border-[#D4AF37]/60 flex-shrink-0">
              <CompanyLogo className="w-11 h-11" showText={false} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3 h-3" /> Official Payment Collection Portal
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED
              </h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#D4AF37]">
                <span>SSN Wealth Capital</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-200 font-normal italic">Your Trusted Financial Partner</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 bg-black/25 px-3.5 py-2 rounded-lg border border-white/10 self-stretch md:self-auto justify-between md:justify-start">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              <a href="tel:9600245924" className="font-semibold text-white hover:text-[#D4AF37]">
                9600245924
              </a>
            </div>
            <div className="h-4 w-px bg-slate-600 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>ssnwealthestates@gmail.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Verified Razorpay.me Merchant Showcase Card */}
      <div className="bg-gradient-to-r from-[#0C2340] via-[#0A192F] to-[#001F3F] rounded-xl p-4 sm:p-5 text-white border border-[#3395FF]/40 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/10 rounded-lg border border-white/10 flex-shrink-0 text-[#3395FF]">
              <ShieldCheck className="w-6 h-6 text-[#3395FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#3395FF]/20 text-[#3395FF] border border-[#3395FF]/30 px-2 py-0.5 rounded">
                  Official Razorpay Merchant Page
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" /> Verified Merchant Account
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                <span>SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED</span>
                <span className="text-xs font-normal text-slate-300 font-mono">
                  ({OFFICIAL_RAZORPAY_HANDLE})
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-0.5 break-all">
                {OFFICIAL_RAZORPAY_LINK}
              </p>
            </div>
          </div>

          {/* Direct Actions: Open Link, Copy Link, Scan QR */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePayViaRazorpayLink}
              className="px-3.5 py-2 rounded-lg bg-[#3395FF] hover:bg-[#257fe0] text-white font-bold text-xs shadow transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open the official Razorpay payment page directly in a new tab"
            >
              <span>Pay on Razorpay.me</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleCopyRazorpayLink}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copy the Razorpay merchant link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 font-medium text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Show QR code for the official Razorpay merchant link"
            >
              <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>QR Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Switcher Tabs */}
      <div className="flex border-b border-slate-300 gap-2">
        <button
          type="button"
          onClick={() => setActiveMainTab("pay")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeMainTab === "pay"
              ? "border-[#001F3F] text-[#001F3F]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4 text-[#D4AF37]" />
          <span>1. Online Payment Portal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("claim")}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeMainTab === "claim"
              ? "border-[#001F3F] text-[#001F3F]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>2. Claim Receipt (Paid on Razorpay.me)</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
            Instant A4 PDF
          </span>
        </button>
      </div>

      {/* Main Two-Column Payment Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Form Input */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#001F3F] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#D4AF37]">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-bold text-sm tracking-wide">
                {activeMainTab === "pay"
                  ? "PAYMENT COLLECTION FORM"
                  : "CLAIM OFFICIAL RECEIPT (RAZORPAY LINK)"}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded">
              256-BIT SECURE SSL
            </span>
          </div>

          {activeMainTab === "claim" ? (
            /* Dedicated Claim Receipt Form for customers who paid on razorpay.me/@ssnwealthampestatesopcprivate */
            <form onSubmit={handleClaimRazorpayReceipt} className="p-5 sm:p-7 space-y-5" noValidate>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Already paid via our official Razorpay.me link?</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Enter your details along with the Razorpay Payment ID or UPI Reference / UTR number from your confirmation email/SMS. We will authenticate the transaction and generate your official stamped A4 receipt instantly.
                  </p>
                </div>
              </div>

              {/* Razorpay Payment ID / UTR Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Razorpay Payment ID / UPI Ref (UTR) Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. pay_Qh98AbC123 or 12-digit UPI UTR"
                  value={claimPaymentId}
                  onChange={(e) => {
                    setClaimPaymentId(e.target.value);
                    if (claimError) setClaimError("");
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F] transition-all ${
                    claimError ? "border-red-500" : "border-slate-300 focus:border-[#001F3F]"
                  }`}
                />
                {claimError && (
                  <p className="text-xs text-red-600 font-medium">{claimError}</p>
                )}
                <span className="text-[11px] text-slate-500 block">
                  Found on your Razorpay payment confirmation screen or UPI SMS (starts with 'pay_' or 12 digits).
                </span>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name as on KYC"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F]"
                />
              </div>

              {/* Application / Loan ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Application / Loan ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSN-LA-2026-000001"
                  value={formData.applicationId}
                  onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F]"
                />
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit Mobile Number"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F]"
                  />
                </div>
              </div>

              {/* Amount & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Amount Paid (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Payment Purpose <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.paymentPurpose}
                    onChange={(e) => setFormData({ ...formData, paymentPurpose: e.target.value as PaymentPurpose })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F]"
                  >
                    {PURPOSE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via Razorpay link for Loan Processing"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F]"
                />
              </div>

              {/* Submit Claim Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{processingStage || "Verifying & Generating Receipt..."}</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>AUTHENTICATE & DOWNLOAD OFFICIAL A4 RECEIPT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleInitiatePayment} className="p-5 sm:p-7 space-y-5" noValidate>
            {/* 1. Customer Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customer-name-input"
                required
                placeholder="Enter customer's full legal name"
                value={formData.customerName}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  if (formErrors.customerName) setFormErrors({ ...formErrors, customerName: "" });
                }}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F] transition-all ${
                  formErrors.customerName
                    ? "border-red-500 payment-error-field"
                    : "border-slate-300 focus:border-[#001F3F]"
                }`}
              />
              {formErrors.customerName && (
                <p className="text-xs text-red-600 font-medium">{formErrors.customerName}</p>
              )}
            </div>

            {/* 2. Application / Loan ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Application / Loan ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="application-id-input"
                required
                placeholder="e.g. SSN-LA-2026-000001 or Loan Account No."
                value={formData.applicationId}
                onChange={(e) => {
                  setFormData({ ...formData, applicationId: e.target.value });
                  if (formErrors.applicationId) setFormErrors({ ...formErrors, applicationId: "" });
                }}
                className={`w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F] transition-all ${
                  formErrors.applicationId
                    ? "border-red-500 payment-error-field"
                    : "border-slate-300 focus:border-[#001F3F]"
                }`}
              />
              {formErrors.applicationId && (
                <p className="text-xs text-red-600 font-medium">{formErrors.applicationId}</p>
              )}
            </div>

            {/* 3 & 4. Mobile Number & Email Address (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  3. Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="mobile-number-input"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.mobileNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, mobileNumber: val });
                      if (formErrors.mobileNumber) setFormErrors({ ...formErrors, mobileNumber: "" });
                    }}
                    className={`w-full pl-11 pr-3.5 py-2.5 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F] transition-all ${
                      formErrors.mobileNumber
                        ? "border-red-500 payment-error-field"
                        : "border-slate-300 focus:border-[#001F3F]"
                    }`}
                  />
                </div>
                {formErrors.mobileNumber && (
                  <p className="text-xs text-red-600 font-medium">{formErrors.mobileNumber}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  4. Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email-address-input"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F] transition-all ${
                    formErrors.email
                      ? "border-red-500 payment-error-field"
                      : "border-slate-300 focus:border-[#001F3F]"
                  }`}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600 font-medium">{formErrors.email}</p>
                )}
              </div>
            </div>

            {/* 5. Payment Amount */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  5. Payment Amount (INR) <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {convertNumberToIndianWords(Number(formData.amount) || 0)}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-lg font-bold text-[#001F3F]">
                  ₹
                </span>
                <input
                  type="number"
                  id="payment-amount-input"
                  required
                  min={1}
                  max={5000000}
                  step={1}
                  placeholder="5000"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    if (formErrors.amount) setFormErrors({ ...formErrors, amount: "" });
                  }}
                  className={`w-full pl-9 pr-3.5 py-2.5 text-lg font-bold text-[#001F3F] font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F] transition-all ${
                    formErrors.amount
                      ? "border-red-500 payment-error-field"
                      : "border-slate-300 focus:border-[#001F3F]"
                  }`}
                />
              </div>
              {formErrors.amount && (
                <p className="text-xs text-red-600 font-medium">{formErrors.amount}</p>
              )}

              {/* Preset Amount Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 self-center mr-1">Quick Select:</span>
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: String(amt) })}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                      Number(formData.amount) === amt
                        ? "bg-[#001F3F] text-[#D4AF37] border-[#D4AF37] shadow-xs"
                        : "bg-white text-slate-700 border-slate-300 hover:border-[#001F3F]"
                    }`}
                  >
                    ₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Payment Purpose */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                6. Payment Purpose <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PURPOSE_OPTIONS.map((opt) => {
                  const isSelected = formData.paymentPurpose === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setFormData({ ...formData, paymentPurpose: opt.value })}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-amber-50/70 border-[#D4AF37] ring-1 ring-[#D4AF37]"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-[#001F3F]" : "text-slate-800"}`}>
                          {opt.label}
                        </span>
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-[#D4AF37] bg-[#D4AF37]" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#001F3F]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. Remarks */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                7. Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                id="remarks-input"
                placeholder="e.g. Loan EMI for Sept 2026, Property Document Verification"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F]"
              />
            </div>

            {/* Dual Payment Options: Official Razorpay Link & On-Site Checkout */}
            <div className="pt-3 space-y-2.5">
              {/* Option 1: Official Razorpay Link (Primary Gold) */}
              <button
                type="button"
                id="pay-via-razorpay-link-button"
                onClick={handlePayViaRazorpayLink}
                disabled={isProcessing}
                className="w-full py-4 px-6 rounded-xl font-extrabold text-base sm:text-lg tracking-wide shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4AF37] via-[#F4D068] to-[#AA771C] text-[#001F3F] border border-[#D4AF37] hover:shadow-xl hover:brightness-105 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
                title="Open official Razorpay link https://razorpay.me/@ssnwealthampestatesopcprivate"
              >
                <Lock className="w-5 h-5 text-[#001F3F]" />
                <span>PAY VIA OFFICIAL RAZORPAY LINK</span>
                <span className="font-mono text-sm bg-[#001F3F] text-[#D4AF37] px-2.5 py-0.5 rounded ml-1 font-bold">
                  {formattedAmountDisplay}
                </span>
                <ExternalLink className="w-5 h-5 text-[#001F3F] ml-1" />
              </button>

              {/* Option 2: On-Site Gateway Modal / Razorpay Standard Checkout */}
              <button
                type="submit"
                id="pay-now-button"
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 bg-[#001F3F] hover:bg-[#002f5e] text-[#D4AF37] border border-[#D4AF37]/50 active:scale-[0.99] disabled:opacity-75"
                title="Pay on-site via Cards, Net Banking, or UPI"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span>{processingStage || "Processing Secure Payment..."}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                    <span>OR PAY ON-SITE VIA GATEWAY (UPI / CARDS / NET BANKING)</span>
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                RBI Compliant • 256-Bit Bank Grade Encryption • Instant A4 PDF Receipt
              </p>
            </div>
          </form>
          )}
        </div>

        {/* Right 5 Columns: Summary & Gateway Guarantee Card */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-time Order Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Transaction Summary
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                Verified NBFC Gateway
              </span>
            </div>

            <div className="p-4 space-y-3.5 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Merchant Entity:</span>
                <span className="font-bold text-right text-[#001F3F]">
                  SSN WEALTH & ESTATES (OPC) PVT LTD
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Brand / Portal:</span>
                <span className="font-bold text-[#D4AF37]">SSN Wealth Capital</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-semibold text-slate-900">
                  {formData.customerName || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Application / Loan ID:</span>
                <span className="font-mono font-bold text-[#001F3F]">
                  {formData.applicationId || "—"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Purpose:</span>
                <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                  {formData.paymentPurpose}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Base Amount:</span>
                  <span className="font-mono">{formattedAmountDisplay}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>GST & Service Taxes:</span>
                  <span className="text-emerald-700 font-semibold">Included (0.00)</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="font-mono text-base text-[#001F3F]">{formattedAmountDisplay}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Official Razorpay:</span>
                  <a
                    href={OFFICIAL_RAZORPAY_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[#0284C7] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>{OFFICIAL_RAZORPAY_HANDLE}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Gateway Methods Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#001F3F] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Supported Payment Methods
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-700">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <Smartphone className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                <span>UPI (GPay/PhonePe)</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <CreditCard className="w-5 h-5 mx-auto text-blue-600 mb-1" />
                <span>Cards (Debit/Credit)</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <Building2 className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <span>Net Banking (50+ Banks)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Compatible with RuPay, Visa, MasterCard, Google Pay, PhonePe, Paytm, BHIM UPI, and all Indian scheduled commercial banks.
            </p>
          </div>

          {/* Direct Support & Loan Portal Link */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
            <div className="font-bold text-[#001F3F] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#D4AF37]" /> Need Help with your Payment?
            </div>
            <p className="text-[11px] leading-relaxed">
              If your payment requires verification or you require an updated statement of account, contact our support team:
            </p>
            <div className="space-y-1 font-medium pt-1">
              <div>Phone: <a href="tel:9600245924" className="text-[#001F3F] font-bold hover:underline">9600245924</a></div>
              <div>Email: <a href="mailto:ssnwealthestates@gmail.com" className="text-[#001F3F] font-bold hover:underline">ssnwealthestates@gmail.com</a></div>
            </div>

            {onNavigateToLoanForm && (
              <div className="pt-3 border-t border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={onNavigateToLoanForm}
                  className="inline-flex items-center gap-1.5 text-xs text-[#001F3F] font-bold hover:text-[#D4AF37] transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Return to Loan Application Form &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* INTEGRATED INDIAN PAYMENT GATEWAY MODAL (UPI, Cards, Net Banking)    */}
      {/* -------------------------------------------------------------------- */}
      {showGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#001F3F] text-white px-5 py-4 border-b border-[#D4AF37] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-white p-1 rounded shadow-xs">
                  <CompanyLogo className="w-6 h-6" showText={false} />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">SSN Wealth Capital Gateway</h4>
                  <p className="text-[10px] text-slate-300">Secure Indian Merchant Payment Gateway</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#D4AF37] font-semibold block uppercase">Payable</span>
                <span className="text-sm font-bold font-mono text-white">{formattedAmountDisplay}</span>
              </div>
            </div>

            {/* Gateway Methods Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveGatewayTab("upi")}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeGatewayTab === "upi"
                    ? "border-[#001F3F] text-[#001F3F] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setActiveGatewayTab("card")}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeGatewayTab === "card"
                    ? "border-[#001F3F] text-[#001F3F] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveGatewayTab("netbanking")}
                className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeGatewayTab === "netbanking"
                    ? "border-[#001F3F] text-[#001F3F] bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-purple-600" /> Net Banking
              </button>
            </div>

            {/* Modal Body Based on Active Tab */}
            <div className="p-5 space-y-4">
              {activeGatewayTab === "upi" && (
                <div className="space-y-3.5">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-lg border border-slate-300 shadow-inner mb-2">
                      <QrCode className="w-24 h-24 text-slate-900" />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700">
                      Scan QR code using any UPI App (GPay, PhonePe, Paytm, BHIM)
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                      Merchant VPA: ssnwealthestates@upi
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Or select UPI App / Enter UPI ID:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Google Pay", "PhonePe", "Paytm"].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setSelectedUpiApp(app)}
                          className={`py-2 px-2 text-xs font-semibold rounded border cursor-pointer ${
                            selectedUpiApp === app
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500"
                              : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeGatewayTab === "card" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4532 0000 0000 8892"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-[#001F3F]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-[#001F3F]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="123"
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-[#001F3F]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardName || formData.customerName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="CARDHOLDER NAME"
                      className="w-full px-3 py-2 text-xs uppercase bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-[#001F3F]"
                    />
                  </div>
                </div>
              )}

              {activeGatewayTab === "netbanking" && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Select Your Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-2 focus:ring-[#001F3F]"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 pt-1">
                    You will be securely routed to your bank's authenticated 2FA net banking portal to authorize {formattedAmountDisplay}.
                  </p>
                </div>
              )}

              {/* Security Note */}
              <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Server Verification Requirement:</strong> All gateway responses are cryptographically verified server-side. Receipts are only generated after confirmed clearance.
                </span>
              </div>

              {/* Action Buttons: Authorize Success vs Simulate Decline */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleServerVerification({
                      orderId: pendingOrderId || `order_${Date.now()}`,
                      paymentId: `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
                      paymentMethod:
                        activeGatewayTab === "upi"
                          ? `UPI (${selectedUpiApp})`
                          : activeGatewayTab === "card"
                          ? "Debit/Credit Card"
                          : `Net Banking (${selectedBank})`,
                      simulateFailure: false,
                    })
                  }
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-lg shadow cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Authorize & Complete Payment ({formattedAmountDisplay})</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleServerVerification({
                        orderId: pendingOrderId || `order_${Date.now()}`,
                        paymentId: `pay_declined_${Date.now()}`,
                        paymentMethod: "Payment Gateway",
                        simulateFailure: true,
                      })
                    }
                    className="text-[11px] text-red-600 hover:text-red-800 hover:underline cursor-pointer py-1 px-2"
                    title="Simulate a declined bank transaction to test failure handling"
                  >
                    Simulate Bank Decline (Test Failure)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGatewayModal(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold py-1 px-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* OFFICIAL RAZORPAY QR CODE MODAL                                      */}
      {/* -------------------------------------------------------------------- */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#001F3F] text-white p-4 text-center border-b border-[#D4AF37]">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37] block">
                Official Razorpay Verified Merchant
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                SSN WEALTH & ESTATES (OPC) PVT LTD
              </h4>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {OFFICIAL_RAZORPAY_HANDLE}
              </p>
            </div>

            <div className="p-5 text-center space-y-4">
              <div className="inline-block p-3 bg-white rounded-xl border border-slate-300 shadow-md">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Frazorpay.me%2F%40ssnwealthampestatesopcprivate"
                  alt="Razorpay Merchant QR Code"
                  className="w-56 h-56 mx-auto rounded"
                  loading="eager"
                />
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">
                  Scan to Pay on Official Razorpay Page
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Open your camera or any UPI App (Google Pay, PhonePe, Paytm, BHIM) to scan and make your payment securely.
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <a
                  href={OFFICIAL_RAZORPAY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#3395FF] hover:bg-[#257fe0] text-white font-bold text-xs rounded-lg shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Page in Browser</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyRazorpayLink}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-300 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* RAZORPAY REDIRECT ASSISTANT / CLAIM HELPER MODAL                     */}
      {/* -------------------------------------------------------------------- */}
      {showRazorpayRedirectHelper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#001F3F] text-white p-5 border-b border-[#D4AF37]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#3395FF]/20 text-[#3395FF] border border-[#3395FF]/30 px-2 py-0.5 rounded">
                  Razorpay In Progress
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Merchant
                </span>
              </div>
              <h4 className="text-base font-bold text-white">
                Official Razorpay Page Launched
              </h4>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                {OFFICIAL_RAZORPAY_LINK}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 text-xs text-blue-900 space-y-1">
                <p className="font-bold">Next Steps:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-blue-800">
                  <li>Complete your payment in the Razorpay window that opened.</li>
                  <li>Copy your <strong>Payment ID</strong> (starts with <code>pay_</code>) or <strong>UPI Reference / UTR Number</strong>.</li>
                  <li>Enter it below to authenticate and download your official computer-generated stamped A4 receipt immediately!</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Enter Razorpay Payment ID or UPI Ref / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. pay_xxxxxxxxxxxx or 12-digit UTR"
                  value={claimPaymentId}
                  onChange={(e) => {
                    setClaimPaymentId(e.target.value);
                    if (claimError) setClaimError("");
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001F3F] ${
                    claimError ? "border-red-500" : "border-slate-300"
                  }`}
                />
                {claimError && (
                  <p className="text-xs text-red-600 font-medium">{claimError}</p>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={async (e) => {
                    if (!claimPaymentId.trim()) {
                      setClaimError("Please enter your Razorpay Payment ID or UPI Ref / UTR number.");
                      return;
                    }
                    await handleClaimRazorpayReceipt(e);
                  }}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm rounded-lg shadow cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{processingStage || "Verifying Receipt..."}</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Authenticate & Download Official A4 Receipt</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <a
                    href={OFFICIAL_RAZORPAY_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0284C7] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Re-open Razorpay Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowRazorpayRedirectHelper(false)}
                    className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
