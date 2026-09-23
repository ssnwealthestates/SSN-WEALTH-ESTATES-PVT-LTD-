import { Phone, Mail, MapPin, Check, Sparkles, MessageSquare } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

export interface StepItem {
  id: string;
  stepNumber: string;
  title: string;
  isCompleted?: boolean;
}

const STEPS: StepItem[] = [
  { id: "section-applicant", stepNumber: "01", title: "Applicant Details" },
  { id: "section-occupation", stepNumber: "02", title: "Occupation & Income" },
  { id: "section-loan", stepNumber: "03", title: "Loan Details" },
  { id: "section-property", stepNumber: "04", title: "Property Details" },
  { id: "section-coapplicant", stepNumber: "05", title: "Co-Applicant Details" },
  { id: "section-guarantor", stepNumber: "06", title: "Guarantor Details" },
  { id: "section-documents", stepNumber: "07", title: "Document Upload" },
  { id: "section-declaration", stepNumber: "08", title: "Declaration & Sign" },
];

interface SidebarProps {
  activeStepId?: string;
  onStepClick?: (id: string) => void;
  completedSteps?: Record<string, boolean>;
  onOpenChat?: () => void;
}

export function Sidebar({
  activeStepId = "section-applicant",
  onStepClick,
  completedSteps = {},
  onOpenChat,
}: SidebarProps) {
  const handleScrollTo = (id: string) => {
    if (onStepClick) {
      onStepClick(id);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-4 lg:p-5 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Official Brand Logo Box */}
      <div className="mb-5 p-3 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 shadow-xs">
        <CompanyLogo className="w-10 h-10" showText={true} theme="light" />
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Application Steps
        </h2>
        <nav className="space-y-1">
          {STEPS.map((step) => {
            const isActive = activeStepId === step.id;
            const isDone = completedSteps[step.id];

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleScrollTo(step.id)}
                className={`w-full text-left flex items-center gap-3 py-2 pl-3 pr-2 transition-colors rounded-r ${
                  isActive
                    ? "border-l-2 border-[#D4AF37] bg-[#F4F4F9]"
                    : "hover:bg-slate-50 opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0 transition-colors ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isActive
                      ? "bg-[#001F3F] text-white"
                      : "border border-slate-300 text-slate-500 bg-white"
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : step.stepNumber}
                </div>
                <span
                  className={`text-xs truncate ${
                    isActive
                      ? "font-bold text-[#001F3F]"
                      : isDone
                      ? "font-semibold text-slate-700"
                      : "font-medium text-slate-600"
                  }`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* AI Assistant Callout Box */}
      {onOpenChat && (
        <div className="mb-4 p-3 bg-[#001F3F]/5 border border-[#D4AF37]/40 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#001F3F]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Need Loan Advice?</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Get instant automated answers on documents, rates, &amp; eligibility.
          </p>
          <button
            type="button"
            onClick={onOpenChat}
            className="mt-2.5 w-full py-1.5 px-2.5 bg-[#001F3F] hover:bg-[#002d5c] text-[#D4AF37] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask SSN Loan AI</span>
          </button>
        </div>
      )}

      {/* Contact Support in High-Density theme */}
      <div className="mt-auto border-t border-slate-100 pt-4">
        <div className="space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Contact Support
          </div>
          <a
            href="tel:9600245924"
            className="text-xs font-semibold text-[#001F3F] hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>9600245924</span>
          </a>
          <a
            href="mailto:ssnwealthestates@gmail.com"
            className="text-[10px] text-slate-500 hover:text-slate-800 block truncate transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
              <span className="truncate">ssnwealthestates@gmail.com</span>
            </span>
          </a>
          <div className="text-[9px] leading-relaxed text-slate-400 flex items-start gap-1 pt-1">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Annur, Mettupalayam Road,
              <br />
              Tamil Nadu – 641653
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
