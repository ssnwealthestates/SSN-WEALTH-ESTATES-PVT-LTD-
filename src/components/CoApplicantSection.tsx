import { Users, User, Phone, Briefcase, IndianRupee } from "lucide-react";
import { CoApplicantDetails } from "../types";

interface Props {
  data: CoApplicantDetails;
  onChange: (field: keyof CoApplicantDetails, value: string) => void;
}

export function CoApplicantSection({ data, onChange }: Props) {
  return (
    <div id="section-coapplicant" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center justify-center flex-shrink-0">
            05
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Co-Applicant Details
            </h2>
            <p className="text-[11px] text-amber-300 font-normal">
              Joint applicant or co-owner credentials (if applicable)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-slate-600">
          Optional
        </span>
      </div>

      {/* Fields */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Co-Applicant Name */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Co-Applicant Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.coApplicantName}
                onChange={(e) => onChange("coApplicantName", e.target.value)}
                placeholder="Full Legal Name"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Relationship with Applicant
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.relationship}
                onChange={(e) => onChange("relationship", e.target.value)}
                placeholder="e.g. Spouse, Father, Mother, Brother"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={data.mobileNumber}
                onChange={(e) => onChange("mobileNumber", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit contact"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Occupation / Business */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Occupation / Business
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.occupationBusiness}
                onChange={(e) => onChange("occupationBusiness", e.target.value)}
                placeholder="e.g. IT Professional / Merchant"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Monthly Income (₹)
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.monthlyIncome}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, "");
                  onChange("monthlyIncome", val);
                }}
                placeholder="e.g. 45,000"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono"
              />
              <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
