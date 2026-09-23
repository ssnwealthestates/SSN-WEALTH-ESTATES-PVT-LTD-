import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Copy,
  ExternalLink,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Phone,
  FileText,
  Check,
  MessageSquare,
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";
import { PaymentRequest, PaymentRequestStatus } from "../types";

interface AdminPaymentPanelProps {
  onBack: () => void;
  onOpenCustomerPay?: (requestId: string) => void;
}

interface RecentApp {
  applicationId: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  loanType: string;
  loanAmount: string;
  submittedAt: string;
}

export function AdminPaymentPanel({
  onBack,
  onOpenCustomerPay,
}: AdminPaymentPanelProps) {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [recentApps, setRecentApps] = useState<RecentApp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metaApiConfigured, setMetaApiConfigured] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return Boolean(localStorage.getItem("ssn_admin_token"));
    }
    return false;
  });
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Verify stored session token on mount
  useEffect(() => {
    const token = localStorage.getItem("ssn_admin_token");
    if (token) {
      fetch("/api/admin/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsAuthenticated(true);
            fetchPaymentRequests();
          } else {
            localStorage.removeItem("ssn_admin_token");
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          setIsAuthenticated(false);
        });
    }
  }, []);

  // Form State - only the exact controls requested
  const [applicationId, setApplicationId] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [paymentPurpose, setPaymentPurpose] = useState<string>("Loan Processing Fee");
  const [amount, setAmount] = useState<string>("2500");
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date(Date.now() + 5 * 86400000);
    return d.toISOString().split("T")[0];
  });
  const [paymentLink, setPaymentLink] = useState<string>("");
  const [sendWhatsAppOnCreate, setSendWhatsAppOnCreate] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load payment requests and recent submitted applications
  const fetchPaymentRequests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/payment-requests");
      const data = await res.json();
      if (data.success) {
        setPaymentRequests(data.paymentRequests || []);
        setRecentApps(data.recentApplications || []);
        setMetaApiConfigured(Boolean(data.metaApiConfigured));
      }
    } catch (err: any) {
      console.error("Failed to fetch payment requests:", err);
      setErrorMessage("Could not load payment requests. Please try refreshing.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  // When admin selects a recent application, auto-fill the controls
  const handleSelectRecentApp = (app: RecentApp) => {
    setApplicationId(app.applicationId);
    setCustomerName(app.customerName);
    setMobileNumber(app.mobileNumber);
    setSuccessMessage(`Selected Application ${app.applicationId}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Create Payment Request
  const handleCreatePaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!applicationId.trim()) {
      setErrorMessage("Please enter an Application ID.");
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage("Please enter Customer Name.");
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage("Please enter Mobile Number.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMessage("Please enter a valid Payment Amount.");
      return;
    }
    if (!paymentPurpose.trim()) {
      setErrorMessage("Please enter Payment Purpose.");
      return;
    }
    if (!dueDate) {
      setErrorMessage("Please select a Due Date.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: applicationId.trim(),
          customerName: customerName.trim(),
          mobileNumber: mobileNumber.trim(),
          paymentPurpose: paymentPurpose.trim(),
          amount: Number(amount),
          dueDate,
          paymentLink: paymentLink.trim() || undefined,
          sendWhatsApp: sendWhatsAppOnCreate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create payment request");
      }

      setSuccessMessage(
        `Payment request created successfully! ${
          sendWhatsAppOnCreate
            ? data.whatsAppResult?.configured
              ? "WhatsApp notification sent via Meta Cloud API."
              : "WhatsApp notification ready (direct link generated)."
            : ""
        }`
      );

      // Refresh list
      await fetchPaymentRequests();

      // Reset form
      setApplicationId("");
      setCustomerName("");
      setMobileNumber("");
      setPaymentLink("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create payment request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send or Resend WhatsApp notification
  const handleSendWhatsApp = async (requestId: string, type: "created" | "reminder") => {
    try {
      setActionLoadingId(`${requestId}_${type}`);
      setErrorMessage(null);

      const res = await fetch(`/api/payment-requests/${requestId}/send-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch WhatsApp message");
      }

      setSuccessMessage(
        type === "reminder"
          ? "Payment reminder WhatsApp sent successfully!"
          : "Payment request WhatsApp sent successfully!"
      );

      // If official direct link fallback is provided, let admin open it if desired
      if (data.whatsAppResult?.waLink && !data.whatsAppResult?.configured) {
        window.open(data.whatsAppResult.waLink, "_blank");
      }

      await fetchPaymentRequests();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send WhatsApp message.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Admin Login Action (Username: SSN, Password: sathya@1995)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError("Please enter both username and password.");
      return;
    }

    try {
      setIsLoggingIn(true);
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid username or password.");
      }

      localStorage.setItem("ssn_admin_token", data.token);
      setIsAuthenticated(true);
      setLoginPassword("");
      fetchPaymentRequests();
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Admin Logout Action
  const handleLogout = async () => {
    const token = localStorage.getItem("ssn_admin_token");
    if (token) {
      fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
    localStorage.removeItem("ssn_admin_token");
    setIsAuthenticated(false);
  };

  // If not authenticated, display Admin Login Gate
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#001F3F] transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Loan Application
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#001F3F] text-white p-6 border-b-2 border-[#D4AF37] text-center">
            <div className="inline-flex bg-white rounded p-1 shadow-sm border border-[#D4AF37]/60 mx-auto mb-3">
              <CompanyLogo className="w-9 h-9" showText={false} />
            </div>
            <h1 className="text-lg font-bold text-[#D4AF37]">SSN WEALTH CAPITAL</h1>
            <p className="text-[11px] text-slate-200 uppercase tracking-widest mt-0.5">
              Admin Portal Authentication
            </p>
          </div>

          <div className="p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-[#001F3F]" />
              <h2 className="text-sm font-bold text-slate-900">
                Sign In to Admin Panel
              </h2>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter admin username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter admin password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 py-2.5 px-4 bg-[#001F3F] hover:bg-[#002f5e] text-[#D4AF37] hover:text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-[#D4AF37]/30"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Admin Panel</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Protected Administrative Management Portal
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-3 sm:px-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#001F3F] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Loan Application
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#001F3F]">
              Payment Requests & WhatsApp Management
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-[#001F3F] text-[#D4AF37] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> ADMIN PANEL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create payment requests for loan applicants and dispatch official WhatsApp notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {metaApiConfigured ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Meta WhatsApp API Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-md">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              WhatsApp Direct Mode (Meta API Ready)
            </span>
          )}

          <button
            type="button"
            onClick={fetchPaymentRequests}
            disabled={isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-all cursor-pointer"
            title="Refresh payment requests"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-md border border-rose-200 transition-all cursor-pointer"
            title="Sign out of Admin Panel"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Action Required</p>
            <p>{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Success</p>
            <p>{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Autofill from Recent Submissions */}
      {recentApps.length > 0 && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#001F3F]" />
            Quick Select from Recent Submitted Applications:
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentApps.map((app) => (
              <button
                key={app.applicationId}
                type="button"
                onClick={() => handleSelectRecentApp(app)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-50 hover:bg-amber-50 text-slate-800 border border-slate-200 hover:border-[#D4AF37] rounded-lg transition-all cursor-pointer text-left"
              >
                <span className="font-mono font-semibold text-[#001F3F]">{app.applicationId}</span>
                <span className="text-slate-600">— {app.customerName}</span>
                <span className="text-slate-400">({app.mobileNumber})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Create Form (Left) and Requests List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Payment Request Form */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-[#001F3F]" />
            <h2 className="text-base font-bold text-[#001F3F]">
              Create Payment Request
            </h2>
          </div>

          <form onSubmit={handleCreatePaymentRequest} className="space-y-3.5">
            {/* Application ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. SSN-LA-2026-000128"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none font-mono"
                />
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Full name of applicant"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Payment Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Purpose <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentPurpose}
                onChange={(e) => setPaymentPurpose(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none bg-white"
              >
                <option value="Loan Processing Fee">Loan Processing Fee</option>
                <option value="Documentation & Legal Fee">Documentation & Legal Fee</option>
                <option value="Valuation & Inspection Charges">Valuation & Inspection Charges</option>
                <option value="Loan EMI Payment">Loan EMI Payment</option>
                <option value="Pre-Sanction Administrative Fee">Pre-Sanction Administrative Fee</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Amount in Rupees"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none font-semibold text-[#001F3F]"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Custom Payment Link (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custom Payment Link <span className="text-slate-400 font-normal">(Optional - auto-generated if left blank)</span>
              </label>
              <input
                type="text"
                placeholder="Leave blank to auto-generate portal pay link"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none text-slate-600"
              />
            </div>

            {/* Send WhatsApp Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendWhatsAppOnCreate}
                  onChange={(e) => setSendWhatsAppOnCreate(e.target.checked)}
                  className="w-4 h-4 rounded text-[#001F3F] focus:ring-[#001F3F] border-slate-300"
                />
                <span>Send WhatsApp notification immediately upon creation</span>
              </label>
              <p className="text-[11px] text-slate-500 pl-6 mt-0.5">
                Customer receives official template with Application ID, Purpose, Amount, Due Date &amp; “PAY NOW” link.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-2.5 px-4 bg-[#001F3F] hover:bg-[#002f5e] text-[#D4AF37] hover:text-white font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border border-[#D4AF37]/30"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating &amp; Generating WhatsApp...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Create Payment Request</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Payment Requests List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-[#001F3F]">
                Existing Payment Requests ({paymentRequests.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Manage payment links, monitor payment statuses, and trigger WhatsApp notifications.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                {paymentRequests.filter((p) => p.paymentStatus === "PAID").length} Paid
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Clock className="w-3 h-3" />
                {paymentRequests.filter((p) => p.paymentStatus === "PENDING").length} Pending
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#001F3F]" />
              <p className="text-xs">Loading payment requests...</p>
            </div>
          ) : paymentRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">No Payment Requests Yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Fill out the form on the left to create your first payment request.
              </p>
            </div>
          ) : (
            paymentRequests.map((req) => {
              const isPaid = req.paymentStatus === "PAID";
              const isActionLoading = actionLoadingId?.startsWith(req.id);

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${
                    isPaid ? "border-emerald-300 bg-emerald-50/20" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#001F3F] bg-slate-100 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        App ID: <strong className="text-slate-800">{req.applicationId}</strong>
                      </span>
                    </div>

                    {/* Payment Status Badge */}
                    <div>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer and Amount Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3.5">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Customer Name</span>
                      <span className="font-semibold text-slate-800">{req.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Mobile Number</span>
                      <span className="font-semibold text-slate-800">{req.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Purpose</span>
                      <span className="font-medium text-slate-700 truncate block" title={req.paymentPurpose}>
                        {req.paymentPurpose}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Amount</span>
                      <span className="font-bold text-[#001F3F] text-sm">
                        ₹{new Intl.NumberFormat("en-IN").format(req.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Paid Status Details (if paid) */}
                  {isPaid && (
                    <div className="mb-3.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-emerald-700 block uppercase">Transaction ID</span>
                        <span className="font-mono font-semibold">{req.transactionId || "Confirmed"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 block uppercase">Paid Date &amp; Time</span>
                        <span className="font-medium">{req.paidAt || "Confirmed"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 block uppercase">Amount Paid</span>
                        <span className="font-bold">
                          ₹{new Intl.NumberFormat("en-IN").format(req.amountPaid || req.amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Due Date & WhatsApp status info */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mb-3.5 pt-1 border-t border-slate-100 gap-2">
                    <div>
                      Due Date: <strong className="text-slate-700">{req.dueDate}</strong>
                    </div>
                    <div>
                      {req.whatsAppStatus?.lastSentAt ? (
                        <span className="text-slate-600">
                          WhatsApp:{" "}
                          <strong className="text-slate-800">
                            {req.whatsAppStatus.lastSentType === "reminder" ? "Reminder Sent" : "Request Sent"}
                          </strong>{" "}
                          ({new Date(req.whatsAppStatus.lastSentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                        </span>
                      ) : (
                        <span className="text-slate-400">WhatsApp not dispatched yet</span>
                      )}
                    </div>
                  </div>

                  {/* Controls: Send WhatsApp, Resend WhatsApp, Pay Now View */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    {/* Send WhatsApp (Payment Request) */}
                    <button
                      type="button"
                      disabled={isActionLoading}
                      onClick={() => handleSendWhatsApp(req.id, "created")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                      title="Send official Payment Request WhatsApp notification"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </button>

                    {/* Resend WhatsApp (Payment Reminder) */}
                    {!isPaid && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleSendWhatsApp(req.id, "reminder")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs"
                        title="Send Payment Reminder WhatsApp"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend WhatsApp</span>
                      </button>
                    )}

                    {/* Open Customer "PAY NOW" View */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenCustomerPay) {
                          onOpenCustomerPay(req.id);
                        } else {
                          window.location.href = `?payRequestId=${req.id}`;
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#001F3F] hover:bg-[#002f5e] text-[#D4AF37] transition-all cursor-pointer shadow-xs"
                      title="Open the Customer Pay Now page for this request"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isPaid ? "View Paid Receipt" : "Open Customer Pay Page"}</span>
                    </button>

                    {/* Copy Payment Link */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(req.paymentLink, req.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      title="Copy customer payment link to clipboard"
                    >
                      {copiedId === req.id ? (
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
