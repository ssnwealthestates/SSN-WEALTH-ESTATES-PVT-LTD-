import React, { useRef } from "react";
import {
  UploadCloud,
  FileText,
  FileCheck2,
  Trash2,
  RefreshCw,
  FileImage,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { UploadedDocument, DOCUMENT_DEFINITIONS } from "../types";
import { CompanyLogo } from "./CompanyLogo";

interface Props {
  documents: UploadedDocument[];
  onFileChange: (key: string, file: File | null) => void;
}

export function DocumentUploadSection({ documents, onFileChange }: Props) {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Validate file format
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!validTypes.includes(file.type.toLowerCase())) {
        alert("Please upload only PDF, JPG, JPEG, or PNG files.");
        e.target.value = "";
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        alert(
          `The selected file (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 30 MB per-file limit. Please upload a compressed version.`
        );
        e.target.value = "";
        return;
      }
      onFileChange(key, file);
    }
  };

  const handleRemove = (key: string) => {
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = "";
    }
    onFileChange(key, null);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const uploadedCount = documents.filter((d) => d.file !== null).length;
  const mandatoryCount = DOCUMENT_DEFINITIONS.filter((d) => d.isRequired).length;
  const mandatoryUploaded = documents.filter(
    (d) => d.file !== null && DOCUMENT_DEFINITIONS.find((def) => def.key === d.key)?.isRequired
  ).length;

  return (
    <div id="section-documents" className="bg-white rounded-lg shadow-sm border border-slate-200 ring-1 ring-slate-200/60 overflow-hidden">
      {/* Section Header */}
      <div className="bg-[#001F3F] px-4 py-2.5 sm:px-5 sm:py-3 border-b border-[#D4AF37] flex flex-wrap items-center justify-between gap-2 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded p-1 shadow-sm border border-[#D4AF37]/50 flex items-center justify-center flex-shrink-0">
            <CompanyLogo className="w-8 h-8" showText={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-[#D4AF37] text-[#001F3F] font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                07
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Document Upload & Verification
              </h2>
            </div>
            <p className="text-[11px] text-amber-300 font-normal">
              Official Document Submission Portal — Upload original deeds, revenue records, identity and financial proofs
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 bg-black/30 border border-[#D4AF37]/40 rounded px-2.5 py-1 text-xs">
          <FileCheck2 className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="text-slate-200 text-[11px]">
            Uploaded: <strong className="text-[#D4AF37]">{uploadedCount}</strong> / 13
          </span>
          <span className="text-slate-500">•</span>
          <span className={mandatoryUploaded === mandatoryCount ? "text-emerald-400 font-medium text-[11px]" : "text-amber-300 text-[11px]"}>
            Mandatory: {mandatoryUploaded}/{mandatoryCount}
          </span>
        </div>
      </div>

      {/* Format Notice */}
      <div className="bg-amber-50/60 border-b border-amber-200/60 px-4 py-2 text-xs text-amber-950 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
          <span className="text-[11px]">
            Accepted Formats: <strong>PDF, JPG, JPEG, PNG</strong> (Max 25 MB per document)
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          Transmitted to SSN Wealth Capital processing center: ssnwealthestates@gmail.com
        </span>
      </div>

      {/* Upload Items List */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DOCUMENT_DEFINITIONS.map((def) => {
            const docState = documents.find((d) => d.key === def.key);
            const isUploaded = !!docState?.file;
            const isImage =
              docState?.fileType?.includes("image") ||
              docState?.fileName?.toLowerCase().match(/\.(jpg|jpeg|png)$/);

            return (
              <div
                key={def.key}
                className={`p-3 rounded border transition-colors ${
                  isUploaded
                    ? "bg-emerald-50/30 border-emerald-300 ring-1 ring-emerald-200/60"
                    : def.isRequired
                    ? "bg-white border-slate-200 hover:border-[#D4AF37]"
                    : "bg-slate-50/40 border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[def.key] = el)}
                  onChange={(e) => handleFileSelect(def.key, e)}
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  id={`upload-${def.key}`}
                />

                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800 leading-tight">
                      {def.label}
                    </span>
                  </div>
                  {def.isRequired ? (
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex-shrink-0 uppercase">
                      Mandatory
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                      Optional
                    </span>
                  )}
                </div>

                {isUploaded ? (
                  /* Uploaded state */
                  <div className="mt-1.5 bg-white rounded p-2 border border-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isImage ? (
                        <FileImage className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate" title={docState.fileName || ""}>
                          {docState.fileName}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Ready ({formatSize(docState.fileSize)})</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[def.key]?.click()}
                        title="Replace this file"
                        className="px-2 py-1 text-slate-600 hover:text-[#001F3F] hover:bg-slate-100 rounded border border-slate-200 text-[11px] flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span className="hidden xs:inline">Replace</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(def.key)}
                        title="Remove this file"
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty upload dropzone button */
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[def.key]?.click()}
                    className="w-full mt-1 border border-dashed border-slate-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 rounded py-2 px-3 flex items-center justify-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#D4AF37] transition-colors" />
                    <span className="text-[11px] font-medium">Select File (PDF, JPG, PNG)</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
