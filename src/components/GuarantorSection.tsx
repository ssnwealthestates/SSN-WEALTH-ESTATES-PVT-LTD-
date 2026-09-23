import { Shield, User, Phone, Briefcase, MapPin } from "lucide-react";
import { GuarantorDetails } from "../types";

interface Props {
  data: GuarantorDetails;
  onChange: (field: keyof GuarantorDetails, value: string) => void;
}

export function GuarantorSection({ data, onChange }: Props) {
  return (
    <div id="section-guarantor" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center justify-center flex-shrink-0">
            06
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Guarantor Details
            </h2>
            <p className="text-[11px] text-amber-300 font-normal">
              Third-party financial guarantor or surety credentials (if applicable)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-slate-600">
          Optional
        </span>
      </div>

      {/* Fields */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Guarantor Name */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Guarantor Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.guarantorName}
                onChange={(e) => onChange("guarantorName", e.target.value)}
                placeholder="Full Name as per ID"
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
                placeholder="e.g. Friend, Business Partner, Relative"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Guarantor Mobile Number
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={data.mobileNumber}
                onChange={(e) => onChange("mobileNumber", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile number"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Occupation / Business */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Occupation / Business
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.occupationBusiness}
                onChange={(e) => onChange("occupationBusiness", e.target.value)}
                placeholder="Profession or Business"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Guarantor Residential Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.address}
                onChange={(e) => onChange("address", e.target.value)}
                placeholder="Full address with town and pincode"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
