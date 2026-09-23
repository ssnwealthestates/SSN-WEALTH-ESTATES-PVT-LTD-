import { Briefcase, Building, IndianRupee, CreditCard } from "lucide-react";
import { OccupationIncomeDetails } from "../types";

interface Props {
  data: OccupationIncomeDetails;
  onChange: (field: keyof OccupationIncomeDetails, value: string) => void;
}

export function OccupationIncomeSection({ data, onChange }: Props) {
  return (
    <div id="section-occupation" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center justify-center flex-shrink-0">
            02
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Occupation & Income
            </h2>
            <p className="text-[11px] text-amber-300 font-normal">
              Employment, business turnover and monthly financial capability
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
          Required
        </span>
      </div>

      {/* Fields */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 15. Occupation / Business */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              15. Occupation / Business <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.occupationBusiness}
                onChange={(e) => onChange("occupationBusiness", e.target.value)}
                placeholder="e.g. Salaried / Business / Agriculture"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 16. Company / Business Name */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              16. Company / Business Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.companyBusinessName}
                onChange={(e) => onChange("companyBusinessName", e.target.value)}
                placeholder="Employer or Enterprise name"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 17. Monthly Income */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              17. Monthly Income (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.monthlyIncome}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, "");
                  onChange("monthlyIncome", val);
                }}
                placeholder="e.g. 75,000"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono font-semibold"
              />
              <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 18. Other Income */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              18. Other Income (₹)
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.otherIncome}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, "");
                  onChange("otherIncome", val);
                }}
                placeholder="Rent, Agriculture, Investments"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono"
              />
              <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 19. Existing Loan Details */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              19. Existing Loan Details
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.existingLoanDetails}
                onChange={(e) => onChange("existingLoanDetails", e.target.value)}
                placeholder="Bank Name, Loan Type, or 'None'"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 20. Monthly EMI */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              20. Current Total Monthly EMI (₹)
            </label>
            <div className="relative">
              <input
                type="text"
                value={data.monthlyEmi}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, "");
                  onChange("monthlyEmi", val);
                }}
                placeholder="e.g. 15,000 or Nil"
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
