import { ShieldCheck, Phone, Sparkles, Lock } from "lucide-react";
import { CompanyLogo } from "./CompanyLogo";

interface HeaderProps {
  applicationId?: string;
  onOpenChat?: () => void;
  onToggleAdmin?: () => void;
  isAdminActive?: boolean;
}

export function Header({
  applicationId = "SSN-LA-2026-000001",
  onOpenChat,
  onToggleAdmin,
  isAdminActive = false,
}: HeaderProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-[#D4AF37] bg-[#001F3F] px-4 sm:px-8 text-white sticky top-0 z-40 shadow-sm">
      {/* Brand Identity */}
      <div className="flex items-center gap-3.5">
        <div className="bg-white rounded p-1 shadow-sm border border-[#D4AF37]/60 flex items-center justify-center flex-shrink-0">
          <CompanyLogo className="w-9 h-9" showText={false} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight text-[#D4AF37]">
              SSN WEALTH CAPITAL
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-semibold bg-white/10 px-1.5 py-0.5 rounded text-amber-200 border border-[#D4AF37]/30">
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" /> LOAN APPLICATION PORTAL
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-80 text-slate-200">
            Your Trusted Financial Partner
          </p>
        </div>
      </div>

      {/* Actions & Contact */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {onToggleAdmin && (
          <button
            type="button"
            onClick={onToggleAdmin}
            id="header-admin-toggle-button"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs border ${
              isAdminActive
                ? "bg-[#D4AF37] text-[#001F3F] border-[#D4AF37]"
                : "bg-white/10 hover:bg-white/20 text-slate-200 border-white/20 hover:border-[#D4AF37]"
            }`}
            title="Admin Panel - Manage Payment Requests & WhatsApp Notifications"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        )}

        {onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            id="header-ask-ai-button"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Open AI Customer Assistant for Instant Loan Answers"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Ask AI</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-300 border-l border-slate-700/80 pl-3">
          <a
            href="tel:9600245924"
            className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="font-semibold">9600245924</span>
          </a>
        </div>
      </div>
    </header>
  );
}



