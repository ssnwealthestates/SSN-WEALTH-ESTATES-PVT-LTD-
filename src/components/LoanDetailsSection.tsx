import { Landmark, IndianRupee, Clock, HelpCircle } from "lucide-react";
import { LoanDetails, LoanType } from "../types";

interface Props {
  data: LoanDetails;
  onChange: (field: keyof LoanDetails, value: string) => void;
}

export function LoanDetailsSection({ data, onChange }: Props) {
  const loanTypes: LoanType[] = [
    "Property Loan",
    "Mortgage Loan",
    "Business Loan",
    "Agriculture Land Loan",
    "Bank Cheque Based Loan",
    "Other",
  ];

  return (
    <div id="section-loan" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center justify-center flex-shrink-0">
            03
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Loan Details
            </h2>
            <p className="text-[11px] text-amber-300 font-normal">
              Loan category, amount requested and preferred duration
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
          {/* 21. Loan Type Dropdown */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              21. Loan Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={data.loanType}
                onChange={(e) => onChange("loanType", e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-medium"
              >
                <option value="">-- Select Loan Product --</option>
                {loanTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Landmark className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {data.loanType === "Other" && (
              <div className="mt-2">
                <input
                  type="text"
                  required
                  value={data.loanTypeOther}
                  onChange={(e) => onChange("loanTypeOther", e.target.value)}
                  placeholder="Please specify your loan type"
                  className="w-full px-3 py-1.5 bg-amber-50/50 border border-amber-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none"
                />
              </div>
            )}
          </div>

          {/* 22. Loan Amount Required */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              22. Loan Amount Required (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.loanAmountRequired}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, "");
                  onChange("loanAmountRequired", val);
                }}
                placeholder="e.g. 25,00,000"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono font-bold text-[#001F3F]"
              />
              <IndianRupee className="w-3.5 h-3.5 text-[#D4AF37] absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 24. Preferred Loan Tenure */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              24. Preferred Loan Tenure <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.preferredLoanTenure}
                onChange={(e) => onChange("preferredLoanTenure", e.target.value)}
                placeholder="e.g. 3 Years, 5 Years, 10 Years"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 23. Purpose of Loan */}
        <div>
          <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            23. Purpose of Loan <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              required
              rows={2}
              value={data.purposeOfLoan}
              onChange={(e) => onChange("purposeOfLoan", e.target.value)}
              placeholder="Detail your financial requirement (e.g., Business expansion, Property acquisition, Agriculture development, Working capital)"
              className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            />
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
