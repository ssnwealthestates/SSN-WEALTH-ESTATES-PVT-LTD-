import React, { useRef, useState, useEffect } from "react";
import { CheckSquare, Square, PenTool, RotateCcw, Calendar, MapPin, UserCheck } from "lucide-react";
import { DeclarationDetails } from "../types";

interface Props {
  data: DeclarationDetails;
  applicantFullName: string;
  defaultPlace: string;
  onChange: (field: keyof DeclarationDetails, value: any) => void;
}

export function DeclarationSection({
  data,
  applicantFullName,
  defaultPlace,
  onChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Sync applicant name and place if empty
  useEffect(() => {
    if (!data.applicantName && applicantFullName) {
      onChange("applicantName", applicantFullName);
    }
    if (!data.place && defaultPlace) {
      onChange("place", defaultPlace);
    }
    if (!data.date) {
      const today = new Date().toISOString().split("T")[0];
      onChange("date", today);
    }
  }, [applicantFullName, defaultPlace]);

  // Set up canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set background and stroke style
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0B192C";
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onChange("signatureDataUrl", dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange("signatureDataUrl", undefined);
  };

  return (
    <div id="section-declaration" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-xs flex items-center justify-center flex-shrink-0">
            08
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
              Declaration & Signature
            </h2>
            <p className="text-[11px] text-amber-300 font-normal">
              Legal undertaking, authorization and borrower verification consent
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
          Mandatory
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Exact Mandatory Declaration Statement */}
        <div
          onClick={() => onChange("isAccepted", !data.isAccepted)}
          className={`p-3.5 sm:p-4 rounded border transition-colors cursor-pointer flex items-start gap-3 ${
            data.isAccepted
              ? "bg-amber-50/50 border-[#D4AF37] ring-1 ring-[#D4AF37]/40"
              : "bg-slate-50 border-slate-300 hover:border-slate-400"
          }`}
        >
          <div className="mt-0.5 flex-shrink-0">
            {data.isAccepted ? (
              <CheckSquare className="w-5 h-5 text-[#001F3F]" />
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed select-none">
              &quot;I hereby declare that the information provided by me is true and correct to the best of my knowledge. I authorize SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED to verify the information and documents submitted by me for the purpose of processing my loan application.&quot;
            </p>
            <p className="text-[11px] text-amber-800 font-medium">
              * The applicant MUST tick this checkbox before submission.
            </p>
          </div>
        </div>

        {/* Verification Meta: Applicant Name, Date, Place, Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Left: Text Meta */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Applicant Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={data.applicantName || applicantFullName}
                  onChange={(e) => onChange("applicantName", e.target.value)}
                  placeholder="Applicant Full Name"
                  className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors font-medium"
                />
                <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={data.date}
                    onChange={(e) => onChange("date", e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Place <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={data.place}
                    onChange={(e) => onChange("place", e.target.value)}
                    placeholder="e.g. Annur / Coimbatore"
                    className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border border-slate-300 rounded text-xs sm:text-sm text-slate-900 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-colors"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Digital Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <PenTool className="w-3 h-3 text-[#D4AF37]" />
                <span>Applicant Digital Signature</span>
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[10px] font-semibold text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="relative border border-dashed border-slate-300 rounded bg-slate-50/70 hover:bg-white transition-colors overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={100}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[100px] cursor-crosshair touch-none bg-white"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs">
                  <PenTool className="w-4 h-4 mb-0.5 text-slate-300" />
                  <span className="text-[11px]">Sign here using touch or mouse</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-1">
              Digital signature is affixed onto the final loan documentation PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
