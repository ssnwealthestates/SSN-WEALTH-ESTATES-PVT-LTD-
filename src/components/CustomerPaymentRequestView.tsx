import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Phone,
  FileText,
  User,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { PaymentRequest } from "../types";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface CustomerPaymentRequestViewProps {
  requestId: string;
  onBack?: () => void;
}

export function CustomerPaymentRequestView({
  requestId,
  onBack,
}: CustomerPaymentRequestViewProps) {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [keyId, setKeyId] = useState<string>("rzp_test_SSNWealthCapital");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    transactionId: string;
    paidAt: string;
    amountPaid: number;
    receiptNumber?: string;
  } | null>(null);

  // Fetch payment request details
  const fetchRequestDetails = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await fetch(`/api/payment-requests/${requestId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Payment request not found or expired.");
      }
      setPaymentRequest(data.paymentRequest);
      if (data.keyId) {
        setKeyId(data.keyId);
      }
      if (data.paymentRequest.paymentStatus === "PAID") {
        setSuccessInfo({
          transactionId: data.paymentRequest.transactionId || "Confirmed",
          paidAt: data.paymentRequest.paidAt || "Confirmed",
          amountPaid: data.paymentRequest.amountPaid || data.paymentRequest.amount,
          receiptNumber: data.paymentRequest.receiptNumber,
        });
      }
    } catch (err: any) {
      console.error("Error loading payment request:", err);
      setErrorMessage(err.message || "Unable to load payment request details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  // Handler for Customer "PAY NOW" action
  const handlePayNow = async () => {
    if (!paymentRequest) return;
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // 1. Create secure order on server-side
      const orderRes = await fetch(`/api/payment-requests/${paymentRequest.id}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to initiate payment gateway.");
      }

      // 2. Open Razorpay secure checkout modal
      if (typeof window.Razorpay === "undefined") {
        throw new Error(
          "Payment gateway component is initializing. Please check your internet connection or try again."
        );
      }

      const options = {
        key: orderData.keyId || keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "SSN WEALTH CAPITAL",
        description: `${paymentRequest.paymentPurpose} (${paymentRequest.applicationId})`,
        image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=128&auto=format&fit=crop&q=80",
        order_id: orderData.orderId,
        prefill: {
          name: paymentRequest.customerName,
          contact: paymentRequest.mobileNumber,
          email: paymentRequest.email || "customer@ssnwealth.in",
        },
        theme: {
          color: "#001F3F",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        handler: async (response: any) => {
          try {
            // 3. Server-side payment verification & receipt generation
            const verifyRes = await fetch(`/api/payment-requests/${paymentRequest.id}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: response.razorpay_order_id || orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                paymentMethod: "UPI / Net Banking / Card",
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            // Update local state with success information
            setSuccessInfo({
              transactionId: verifyData.transactionId,
              paidAt: verifyData.paidAt,
              amountPaid: verifyData.amountPaid,
              receiptNumber: verifyData.receiptNumber,
            });

            // Update current request
            setPaymentRequest(verifyData.paymentRequest);
            setIsProcessing(false);
          } catch (verifyErr: any) {
            console.error("Verification error:", verifyErr);
            setErrorMessage(verifyErr.message || "Payment verification failed.");
            setIsProcessing(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", (response: any) => {
        setIsProcessing(false);
        setErrorMessage(
          `Payment failed: ${response.error?.description || "Transaction was declined by bank."}`
        );
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMessage(err.message || "Failed to start payment.");
      setIsProcessing(false);
    }
  };

  const handleDownloadReceipt = () => {
    const recNum = successInfo?.receiptNumber || paymentRequest?.receiptNumber;
    if (recNum) {
      window.open(`/api/payment/receipt/${recNum}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#001F3F] border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-600">
            Loading secure payment request...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage && !paymentRequest) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-rose-200 p-6 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Payment Request Unavailable
          </h2>
          <p className="text-xs text-slate-600 mb-6">{errorMessage}</p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#001F3F] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!paymentRequest) return null;

  const isPaid = paymentRequest.paymentStatus === "PAID" || Boolean(successInfo);
  const formattedAmount = new Intl.NumberFormat("en-IN").format(paymentRequest.amount);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-3 sm:px-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#001F3F] transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Loan Portal
        </button>
      )}

      {/* Main Payment Request Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        {/* Brand Header */}
        <div className="bg-[#001F3F] text-white p-5 sm:p-6 border-b-2 border-[#D4AF37]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded p-1 shadow-sm border border-[#D4AF37]/60 flex items-center justify-center">
                <CompanyLogo className="w-8 h-8" showText={false} />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#D4AF37] leading-tight">
                  SSN WEALTH CAPITAL
                </h1>
                <p className="text-[10px] text-slate-200 tracking-wider uppercase">
                  Official Payment Request
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] block uppercase text-slate-300">Request ID</span>
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-200">
                {paymentRequest.id}
              </span>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {isPaid ? (
          <div className="bg-emerald-500 text-white py-3 px-6 flex items-center justify-center gap-2 font-bold text-sm tracking-wide shadow-inner">
            <CheckCircle2 className="w-5 h-5" />
            <span>PAYMENT STATUS: PAID</span>
          </div>
        ) : (
          <div className="bg-amber-500 text-white py-2.5 px-6 flex items-center justify-center gap-2 font-semibold text-xs tracking-wide">
            <Clock className="w-4 h-4" />
            <span>PAYMENT STATUS: PENDING DUE ON {paymentRequest.dueDate}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Prominent Amount Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              {isPaid ? "Total Amount Paid" : "Total Amount Due"}
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#001F3F]">
              ₹{formattedAmount}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Purpose: <strong className="text-slate-800">{paymentRequest.paymentPurpose}</strong>
            </p>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-2.5 px-4 bg-slate-50/50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Application ID
              </span>
              <span className="font-mono font-bold text-slate-800">
                {paymentRequest.applicationId}
              </span>
            </div>

            <div className="flex justify-between py-2.5 px-4">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Customer Name
              </span>
              <span className="font-semibold text-slate-800">
                {paymentRequest.customerName}
              </span>
            </div>

            <div className="flex justify-between py-2.5 px-4 bg-slate-50/50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number
              </span>
              <span className="font-medium text-slate-800">
                {paymentRequest.mobileNumber}
              </span>
            </div>

            <div className="flex justify-between py-2.5 px-4">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date
              </span>
              <span className="font-semibold text-slate-800">
                {paymentRequest.dueDate}
              </span>
            </div>
          </div>

          {/* If Payment is Successful, Display exact required info */}
          {isPaid && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm pb-2 border-b border-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Transaction &amp; Payment Confirmation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                    Payment Status
                  </span>
                  <span className="font-bold text-emerald-800 text-sm">PAID</span>
                </div>

                <div>
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                    Amount Paid
                  </span>
                  <span className="font-bold text-emerald-800 text-sm">
                    ₹{new Intl.NumberFormat("en-IN").format(successInfo?.amountPaid || paymentRequest.amount)}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                    Transaction / Reference ID
                  </span>
                  <span className="font-mono font-semibold text-slate-800 break-all">
                    {successInfo?.transactionId || paymentRequest.transactionId || "Confirmed"}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] text-emerald-700 block uppercase font-bold">
                    Payment Date &amp; Time
                  </span>
                  <span className="font-medium text-slate-800">
                    {successInfo?.paidAt || paymentRequest.paidAt || "Confirmed"}
                  </span>
                </div>
              </div>

              {/* Download Official Receipt Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Official A4 Payment Receipt (PDF)</span>
                </button>
              </div>
            </div>
          )}

          {/* If NOT Paid yet, Show the Clear "PAY NOW" button */}
          {!isPaid && (
            <div className="space-y-4 pt-2">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                id="customer-pay-now-button"
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full py-4 px-6 bg-[#001F3F] hover:bg-[#002f5e] text-[#D4AF37] hover:text-white font-extrabold text-base sm:text-lg rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-2 border-[#D4AF37]"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-white rounded-full animate-spin"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>PAY NOW (₹{formattedAmount})</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encryption
                </span>
                <span>•</span>
                <span>UPI, Cards, Net Banking</span>
                <span>•</span>
                <span>RBI Authorized Gateway</span>
              </div>
            </div>
          )}

          {/* Company Contact & Information */}
          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-500 text-center space-y-1">
            <p className="font-semibold text-slate-700">
              SSN WEALTH &amp; ESTATES (OPC) PRIVATE LIMITED
            </p>
            <p>
              Mettupalayam Road, Near Mettur Super Service, Annur – 641653
            </p>
            <p>
              Support: <a href="tel:9600245924" className="text-[#001F3F] font-bold">9600245924</a> |{" "}
              <a href="mailto:ssnwealthestates@gmail.com" className="text-[#001F3F] font-bold">ssnwealthestates@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
