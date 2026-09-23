import { User, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
import { ApplicantDetails } from "../types";

interface Props {
  data: ApplicantDetails;
  onChange: (field: keyof ApplicantDetails, value: string) => void;
}

export function ApplicantDetailsSection({ data, onChange }: Props) {
  return (
    <div id="section-applicant" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center justify-center flex-shrink-0">
            01
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Applicant Details
            </h2>
            <p className="text-[11px] text-amber-300 font-normal">
              Primary borrower personal and contact credentials
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
          Required
        </span>
      </div>

      {/* Fields Grid */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Applicant Full Name */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              1. Applicant Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.applicantFullName}
                onChange={(e) => onChange("applicantFullName", e.target.value)}
                placeholder="As per Aadhaar / PAN"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. Father's / Husband's Name */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              2. Father's / Husband's Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.fatherHusbandName}
                onChange={(e) => onChange("fatherHusbandName", e.target.value)}
                placeholder="Full Name of Father or Spouse"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3. Date of Birth */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              3. Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={data.dateOfBirth}
                onChange={(e) => onChange("dateOfBirth", e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 4. Gender */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              4. Gender <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={data.gender}
              onChange={(e) => onChange("gender", e.target.value)}
              className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* 5. Mobile Number */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              5. Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                maxLength={10}
                value={data.mobileNumber}
                onChange={(e) => onChange("mobileNumber", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit primary mobile"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 6. Alternate Mobile Number */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              6. Alternate Mobile Number
            </label>
            <div className="relative">
              <input
                type="tel"
                maxLength={10}
                value={data.alternateMobileNumber}
                onChange={(e) => onChange("alternateMobileNumber", e.target.value.replace(/\D/g, ""))}
                placeholder="Secondary contact"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 7. Email Address */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              7. Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={data.emailAddress}
                onChange={(e) => onChange("emailAddress", e.target.value)}
                placeholder="example@mail.com"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 8. Aadhaar Number */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              8. Aadhaar Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={14}
                value={data.aadhaarNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                  const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                  onChange("aadhaarNumber", formatted);
                }}
                placeholder="XXXX XXXX XXXX"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono tracking-wider"
              />
              <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 9. PAN Number */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              9. PAN Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={10}
                value={data.panNumber}
                onChange={(e) => onChange("panNumber", e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors uppercase font-mono tracking-wider"
              />
              <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 10. Residential Address */}
        <div>
          <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            10. Residential Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              required
              rows={2}
              value={data.residentialAddress}
              onChange={(e) => onChange("residentialAddress", e.target.value)}
              placeholder="Door No, Building Name, Street / Road Name"
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            />
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* 11-14: Village, District, State, Pincode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 11. Village / Town */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              11. Village / Town <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.villageTown}
              onChange={(e) => onChange("villageTown", e.target.value)}
              placeholder="e.g. Annur"
              className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* 12. District */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              12. District <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.district}
              onChange={(e) => onChange("district", e.target.value)}
              placeholder="e.g. Coimbatore"
              className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* 13. State */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              13. State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.state}
              onChange={(e) => onChange("state", e.target.value)}
              placeholder="e.g. Tamil Nadu"
              className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* 14. Pincode */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              14. Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={data.pincode}
              onChange={(e) => onChange("pincode", e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit PIN"
              className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono tracking-wider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
