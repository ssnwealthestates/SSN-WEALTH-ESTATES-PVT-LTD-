import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Check,
  Loader2,
  FileText,
  UploadCloud,
  Mail,
  CheckCircle2,
} from "lucide-react";

export type CheckStatus = "pending" | "active" | "completed" | "error";

export interface StatusCheckItem {
  id: "pdf" | "upload" | "email";
  label: string;
  shortLabel: string;
  status: CheckStatus;
  detail?: string;
}

interface SubmitButtonWithProgressProps {
  isSubmitting: boolean;
  activeStatusHeadline: string;
  checks: StatusCheckItem[];
  overallProgress: number; // 0 to 100
  disabled?: boolean;
}

export const SubmitButtonWithProgress: React.FC<SubmitButtonWithProgressProps> = ({
  isSubmitting,
  activeStatusHeadline,
  checks,
  overallProgress,
  disabled = false,
}) => {
  if (!isSubmitting) {
    return (
      <button
        id="btn-submit-loan-application"
        type="submit"
        disabled={disabled}
        className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px] px-8 py-3.5 rounded-lg bg-[#D4AF37] hover:bg-[#C59B27] active:bg-[#B38820] text-[#001F3F] font-bold text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mx-auto group focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2"
      >
        <Send className="w-4 h-4 text-[#001F3F] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        <span className="font-extrabold tracking-widest">SUBMIT LOAN APPLICATION</span>
      </button>
    );
  }

  // Active Submission Progress State
  return (
    <div className="w-full max-w-xl mx-auto space-y-2.5">
      <div
        id="btn-submitting-progress"
        aria-live="polite"
        aria-busy="true"
        className="relative w-full rounded-lg bg-[#001F3F] text-white border border-[#D4AF37] shadow-lg overflow-hidden transition-all duration-300"
      >
        {/* Subtle background ambient progress tint */}
        <motion.div
          className="absolute inset-0 bg-[#D4AF37]/10 pointer-events-none"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min(overallProgress, 100)}%` }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        />

        <div className="relative z-10 px-4 py-3 sm:px-6 sm:py-3.5 space-y-2.5">
          {/* Top Line: Active Step Headline & Progress Counter */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin flex-shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeStatusHeadline}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs sm:text-sm font-bold text-white tracking-wide truncate"
                >
                  {activeStatusHeadline}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11px] font-mono font-bold text-[#D4AF37]">
                {Math.round(overallProgress)}%
              </span>
            </div>
          </div>

          {/* Middle Line: Individual Status Checks (PDF Ready • Uploading Files • Email Sending) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {checks.map((check) => {
              const isCompleted = check.status === "completed";
              const isActive = check.status === "active";
              const isPending = check.status === "pending";

              return (
                <div
                  key={check.id}
                  id={`status-check-${check.id}`}
                  className={`relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-md border text-[10px] sm:text-[11px] font-medium transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold"
                      : isActive
                      ? "bg-[#D4AF37]/15 border-[#D4AF37] text-amber-200 font-semibold ring-1 ring-[#D4AF37]/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-400"
                  }`}
                >
                  {/* Icon Indicator */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0.6, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-[#001F3F] flex items-center justify-center"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
                    ) : check.id === "pdf" ? (
                      <FileText className="w-3 h-3 text-slate-500" />
                    ) : check.id === "upload" ? (
                      <UploadCloud className="w-3 h-3 text-slate-500" />
                    ) : (
                      <Mail className="w-3 h-3 text-slate-500" />
                    )}
                  </div>

                  {/* Status Check Label */}
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span className="truncate whitespace-nowrap hidden sm:inline">
                      {check.label}
                    </span>
                    <span className="truncate whitespace-nowrap sm:hidden">
                      {check.shortLabel || check.label}
                    </span>
                    {isActive && check.detail && (
                      <span className="text-[9px] text-[#D4AF37] font-mono whitespace-nowrap">
                        {check.detail}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Micro Progress Bar Track */}
        <div className="w-full bg-slate-900/90 h-1 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#D4AF37] via-amber-400 to-emerald-400"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(overallProgress, 100)}%` }}
            transition={{ ease: "easeOut", duration: 0.25 }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>Please do not close or refresh this tab while your application is transmitted.</span>
      </div>
    </div>
  );
};
