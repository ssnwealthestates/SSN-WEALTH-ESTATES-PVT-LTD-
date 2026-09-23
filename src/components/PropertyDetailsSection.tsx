import { Home, MapPin, IndianRupee, Layers, FileSpreadsheet } from "lucide-react";
import { PropertyDetails, PropertyType } from "../types";

interface Props {
  data: PropertyDetails;
  onChange: (field: keyof PropertyDetails, value: string) => void;
}

export function PropertyDetailsSection({ data, onChange }: Props) {
  const propertyTypes: PropertyType[] = [
    "Residential Property",
    "Commercial Property",
    "Agriculture Land",
    "Vacant Site",
    "Other",
  ];

  return (
    <div id="section-property" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center justify-center flex-shrink-0">
            04
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Property Details
            </h2>
            <p className="text-[11px] text-amber-300 font-normal">
              Security / Collateral property identification and land survey records
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
          {/* 25. Property Type Dropdown */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              25. Property Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                required
                value={data.propertyType}
                onChange={(e) => onChange("propertyType", e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-medium"
              >
                <option value="">-- Select Property Type --</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Home className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {data.propertyType === "Other" && (
              <div className="mt-2">
                <input
                  type="text"
                  required
                  value={data.propertyTypeOther}
                  onChange={(e) => onChange("propertyTypeOther", e.target.value)}
                  placeholder="Specify property type (e.g. Industrial / Warehouse)"
                  className="w-full px-3 py-1.5 bg-amber-50/50 border border-amber-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            )}
          </div>

          {/* 26. Property Location */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              26. Property Location / Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.propertyLocation}
                onChange={(e) => onChange("propertyLocation", e.target.value)}
                placeholder="Street name, Landmark, Highway / Main Road"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 27-30: District, Taluk, Village, Survey Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 27. District */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              27. District <span className="text-red-500">*</span>
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

          {/* 28. Taluk */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              28. Taluk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.taluk}
              onChange={(e) => onChange("taluk", e.target.value)}
              placeholder="e.g. Annur / Avinashi"
              className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* 29. Village */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              29. Village <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={data.village}
              onChange={(e) => onChange("village", e.target.value)}
              placeholder="Revenue Village"
              className="w-full px-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* 30. Survey Number */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              30. Survey Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.surveyNumber}
                onChange={(e) => onChange("surveyNumber", e.target.value)}
                placeholder="e.g. 142/2A, 145/1B"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono font-semibold"
              />
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 31 & 32: Extent and Estimated Value */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 31. Extent / Property Area */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              31. Extent / Property Area <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.extentPropertyArea}
                onChange={(e) => onChange("extentPropertyArea", e.target.value)}
                placeholder="e.g. 2400 Sq.Ft / 3 Cents / 1.50 Acres"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
              />
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 32. Estimated Property Value */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              32. Estimated Property Value (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={data.estimatedPropertyValue}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9,.]/g, "");
                  onChange("estimatedPropertyValue", val);
                }}
                placeholder="e.g. 50,00,000"
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-mono font-bold text-[#001F3F]"
              />
              <IndianRupee className="w-3.5 h-3.5 text-[#D4AF37] absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
