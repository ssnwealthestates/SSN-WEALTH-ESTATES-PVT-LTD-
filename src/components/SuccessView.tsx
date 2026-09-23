import {
  CheckCircle2,
  Download,
  PlusCircle,
  FileText,
  Mail,
  Building,
  Phone,
  Calendar,
  FileCheck,
} from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

interface Props {
  applicationId: string;
  applicantName: string;
  loanType: string;
  loanAmount: string;
  pdfBlobUrl?: string;
  pdfFilename?: string;
  uploadedCount: number;
  onNewApplication: () => void;
  onDownloadPdf: () => void;
}

export function SuccessView({
  applicationId,
  applicantName,
  loanType,
  loanAmount,
  uploadedCount,
  onNewApplication,
  onDownloadPdf,
}: Props) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
        {/* Top Celebration Banner */}
        <div className="bg-[#001F3F] text-white p-5 sm:p-6 text-center relative overflow-hidden border-b border-[#D4AF37]">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white rounded-lg p-2 shadow-md border border-[#D4AF37]">
              <CompanyLogo className="w-12 h-12" showText={true} theme="light" />
            </div>
          </div>

          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 mb-2 shadow">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white uppercase">
            Application Submitted Successfully
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-amber-300 font-normal max-w-xl mx-auto">
            Your official loan application and verification documents have been recorded with SSN Wealth Capital.
          </p>
        </div>

        {/* Verification Messages & Checklist */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Main Info Statements */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-800">
                Your professional application PDF has been generated and downloaded.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-800">
                Your application PDF and all uploaded documents have been dispatched to{" "}
                <span className="text-[#001F3F] font-bold">
                  SSN Wealth & Estates (ssnwealthestates@gmail.com)
                </span>
                .
              </p>
            </div>
          </div>

          {/* Golden Application ID Badge */}
          <div className="bg-amber-50/50 border border-[#D4AF37] rounded p-4 text-center">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-widest block">
              Official Reference Number
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-[#001F3F] mt-0.5 tracking-wider">
              Application ID: {applicationId}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Please quote this reference ID for all queries regarding this application.
            </p>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Applicant: <strong className="text-slate-900">{applicantName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Loan: <strong className="text-slate-900">{loanType} ({loanAmount ? `₹ ${loanAmount}` : "Requested"})</strong></span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-600">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transmitted: <strong className="text-slate-900">PDF + {uploadedCount} Attachments</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date: <strong className="text-slate-900">{currentDate}</strong></span>
              </div>
            </div>
          </div>

          {/* Two Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onDownloadPdf}
              className="w-full sm:w-auto px-6 py-2.5 rounded bg-[#D4AF37] hover:bg-[#c9a22f] text-[#001F3F] font-bold text-xs sm:text-sm tracking-wide shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#001F3F]" />
              <span>DOWNLOAD PDF</span>
            </button>

            <button
              type="button"
              onClick={onNewApplication}
              className="w-full sm:w-auto px-5 py-2.5 rounded bg-[#001F3F] hover:bg-[#002d5c] text-white font-semibold text-xs sm:text-sm tracking-wide transition-colors border border-[#D4AF37] flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>NEW APPLICATION</span>
            </button>
          </div>

          {/* Company Contact Card */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CompanyLogo className="w-8 h-8" showText={false} />
              <div>
                <strong className="text-slate-900 block text-xs">SSN WEALTH CAPITAL</strong>
                <span className="text-[10px]">SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-700 text-xs">
              <a
                href="tel:9600245924"
                className="flex items-center gap-1 hover:text-amber-700 font-medium"
              >
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                9600245924
              </a>
              <a
                href="mailto:ssnwealthestates@gmail.com"
                className="flex items-center gap-1 hover:text-amber-700 font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                ssnwealthestates@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
