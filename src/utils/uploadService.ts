import { UploadedDocument, LoanApplicationFormData } from "../types";

export interface UploadResponse {
  status: number;
  ok: boolean;
  data: any;
  rawText: string;
  isCookieCheck?: boolean;
  applicationId?: string;
  filesAttached?: number;
}

export interface UploadLoanApplicationPayload {
  applicationId: string;
  formData: LoanApplicationFormData | any;
  pdfBlob?: Blob | null;
  pdfFilename?: string | null;
  documents?: UploadedDocument[];
  files?: Array<{ file: File; key: string; sanitizedName?: string; label?: string }>;
}

/**
 * Safely extracts a clean file extension (e.g., ".pdf", ".jpg", ".png").
 * If the filename lacks an extension or has a trailing dot, infers it from the MIME type.
 */
export function getSafeFileExtension(file: { name?: string; type?: string }): string {
  const name = (file.name || "").trim();
  const lastDotIndex = name.lastIndexOf(".");

  if (lastDotIndex > 0 && lastDotIndex < name.length - 1) {
    const ext = name.substring(lastDotIndex).toLowerCase();
    // Verify it looks like a valid 2 to 5 character extension
    if (/^\.[a-z0-9]{2,5}$/i.test(ext)) {
      return ext;
    }
  }

  // Infer extension from MIME type
  const mime = (file.type || "").toLowerCase();
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";

  // Default fallback for financial & legal loan documentation
  return ".pdf";
}

/**
 * Formats a document filename with the required Application ID:
 * Format: {Application_ID}_{Document_Descriptor}.{ext}
 * Example: SSN-LA-2026-000001_Current_Deed.pdf
 */
export function formatDocumentFilename(
  applicationId: string,
  descriptor: string,
  file: { name?: string; type?: string }
): string {
  const cleanAppId = (applicationId || "SSN-LA-2026-000001").trim();
  const ext = getSafeFileExtension(file);

  // Clean the descriptor: replace spaces, slashes, and special characters with underscores
  let cleanDesc = (descriptor || "Document")
    .trim()
    .replace(/[^\w.-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  // If the descriptor already starts with the Application ID, do not duplicate it
  if (cleanDesc.startsWith(cleanAppId)) {
    cleanDesc = cleanDesc.substring(cleanAppId.length).replace(/^_+/, "");
  }

  // Strip extension from descriptor if it was already included
  if (cleanDesc.toLowerCase().endsWith(ext)) {
    cleanDesc = cleanDesc.substring(0, cleanDesc.length - ext.length);
  }

  return `${cleanAppId}_${cleanDesc || "Attachment"}${ext}`;
}

/**
 * Generates a standard Application ID if none was provided
 */
function generateFallbackAppId(): string {
  const year = new Date().getFullYear();
  const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
  return `SSN-LA-${year}-${randomSixDigits}`;
}

/**
 * Creates and formats a complete FormData payload ensuring:
 * 1. Application ID is strictly included as a top-level field
 * 2. Form JSON is safely encoded
 * 3. The official Application PDF is attached with the Application ID in the filename
 * 4. ALL selected verification documents are captured and formatted as {Application_ID}_{Document_Name}.{ext}
 */
export function createLoanApplicationFormData(payload: UploadLoanApplicationPayload): FormData {
  const submitData = new FormData();
  const appId = (payload.applicationId || generateFallbackAppId()).trim();

  // 1. Set top-level identifiers
  submitData.append("applicationId", appId);
  submitData.append(
    "formData",
    typeof payload.formData === "string"
      ? payload.formData
      : JSON.stringify(payload.formData || {})
  );

  // 2. Append generated Loan Application PDF (Attachment 1)
  if (payload.pdfBlob) {
    const pdfFilename =
      payload.pdfFilename && payload.pdfFilename.startsWith(`SSN_Loan_Application_${appId}`)
        ? payload.pdfFilename
        : `SSN_Loan_Application_${appId}.pdf`;

    submitData.append("pdfDocument", payload.pdfBlob, pdfFilename);
  }

  // 3. Append all applicant verification documents (Attachment 2 onwards)
  if (Array.isArray(payload.documents)) {
    payload.documents.forEach((doc) => {
      if (doc && doc.file) {
        const descriptor = doc.sanitizedName || doc.key || "Document";
        const formattedFilename = formatDocumentFilename(appId, descriptor, doc.file);
        submitData.append(doc.key || "document", doc.file, formattedFilename);
      }
    });
  }

  // 4. Append any additional raw files if provided
  if (Array.isArray(payload.files)) {
    payload.files.forEach((item) => {
      if (item && item.file) {
        const descriptor = item.sanitizedName || item.label || item.key || "Document";
        const formattedFilename = formatDocumentFilename(appId, descriptor, item.file);
        submitData.append(item.key || "document", item.file, formattedFilename);
      }
    });
  }

  return submitData;
}

/**
 * Audits an existing FormData object:
 * - Guarantees Application ID exists
 * - Normalizes and verifies that all attached files carry the Application ID prefix
 * - Counts valid file attachments
 */
function auditAndFormatFormData(
  inputFormData: FormData,
  fallbackAppId?: string
): { auditedFormData: FormData; applicationId: string; fileCount: number } {
  let appId = (inputFormData.get("applicationId") as string)?.trim() || "";

  if (!appId && fallbackAppId) {
    appId = fallbackAppId.trim();
  }

  // If still missing, check if formData JSON contains an id
  if (!appId) {
    const rawForm = inputFormData.get("formData");
    if (typeof rawForm === "string") {
      try {
        const parsed = JSON.parse(rawForm);
        if (parsed.applicationId) {
          appId = parsed.applicationId;
        }
      } catch {
        // ignore
      }
    }
  }

  if (!appId) {
    appId = generateFallbackAppId();
  }

  const auditedFormData = new FormData();
  let fileCount = 0;

  // Append validated applicationId first to optimize multipart stream parsing
  auditedFormData.append("applicationId", appId);

  // Re-append other fields and ensure all files are formatted with Application ID
  inputFormData.forEach((value, key) => {
    if (key === "applicationId") {
      // Already appended at top
      return;
    }

    if (value instanceof File) {
      fileCount++;
      let filename = value.name;

      if (key === "pdfDocument") {
        if (!filename || !filename.includes(appId)) {
          filename = `SSN_Loan_Application_${appId}.pdf`;
        }
      } else {
        // Ensure the file is prefixed with Application ID
        if (!filename.startsWith(`${appId}_`)) {
          filename = formatDocumentFilename(appId, key, value);
        }
      }

      auditedFormData.append(key, value, filename);
    } else if (typeof value !== "string" && (value as any) instanceof Blob) {
      fileCount++;
      const blobVal = value as any as Blob;
      let filename = `Attachment_${fileCount}`;
      if (key === "pdfDocument") {
        filename = `SSN_Loan_Application_${appId}.pdf`;
      } else {
        filename = formatDocumentFilename(appId, key, { name: filename, type: blobVal.type });
      }
      auditedFormData.append(key, blobVal, filename);
    } else {
      // Regular text field
      auditedFormData.append(key, value);
    }
  });

  return { auditedFormData, applicationId: appId, fileCount };
}

/**
 * Uploads loan application multipart form data with real-time progress tracking,
 * credentials handling (to prevent proxy cookie checks), and resilient fetch fallback.
 *
 * Accepts either:
 * - A structured UploadLoanApplicationPayload object (recommended)
 * - An existing FormData object
 */
export async function uploadLoanApplicationWithProgress(
  dataOrPayload: FormData | UploadLoanApplicationPayload,
  onProgress?: (percent: number) => void,
  optionalAppId?: string
): Promise<UploadResponse> {
  const reportProgress = (p: number) => {
    if (typeof onProgress === "function") {
      onProgress(Math.max(0, Math.min(100, Math.round(p))));
    }
  };

  // 1. Prepare and audit FormData and Application ID
  let submitData: FormData;
  let applicationId: string;
  let fileCount = 0;

  if (dataOrPayload instanceof FormData) {
    const audited = auditAndFormatFormData(dataOrPayload, optionalAppId);
    submitData = audited.auditedFormData;
    applicationId = audited.applicationId;
    fileCount = audited.fileCount;
  } else {
    submitData = createLoanApplicationFormData(dataOrPayload);
    applicationId = dataOrPayload.applicationId || generateFallbackAppId();
    fileCount =
      (dataOrPayload.pdfBlob ? 1 : 0) +
      (dataOrPayload.documents?.filter((d) => !!d.file).length || 0) +
      (dataOrPayload.files?.filter((f) => !!f.file).length || 0);
  }

  // Helper to test if a response is an authentication proxy "Cookie check" page
  const checkIsCookieCheck = (text: string): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return (
      lower.includes("cookie check") ||
      (lower.includes("<title>") && lower.includes("cookie"))
    );
  };

  // 2. Primary Transport: XMLHttpRequest with credentials and upload progress tracking
  const runXhr = (): Promise<UploadResponse> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/submit-loan-application");
      xhr.withCredentials = true;

      // Essential headers
      xhr.setRequestHeader("Accept", "application/json, text/plain, */*");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      if (applicationId) {
        xhr.setRequestHeader("X-Application-ID", applicationId);
      }

      // Track network upload progress for all document attachments
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          // Cap at 99% during active network transmission; 100% is reached on server response
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          reportProgress(percent);
        }
      };

      xhr.onload = () => {
        const status = xhr.status;
        const rawText = xhr.responseText || "";
        let data: any = null;

        if (rawText && rawText.trim().length > 0) {
          try {
            data = JSON.parse(rawText);
          } catch {
            data = null;
          }
        }

        const isCookieCheck = checkIsCookieCheck(rawText);
        const ok =
          status >= 200 &&
          status < 300 &&
          !isCookieCheck &&
          data !== null &&
          data?.success !== false;

        if (ok) {
          reportProgress(100);
        }

        resolve({
          status,
          ok,
          data,
          rawText,
          isCookieCheck,
          applicationId,
          filesAttached: fileCount,
        });
      };

      xhr.onerror = () => {
        reject(
          new Error(
            "Network connection error: Unable to reach the server. Please verify your internet connection."
          )
        );
      };

      xhr.ontimeout = () => {
        reject(
          new Error(
            "The server timed out while transmitting attachments. Please check your connection and retry."
          )
        );
      };

      // 3-minute timeout for large multi-document uploads
      xhr.timeout = 180000;

      xhr.send(submitData);
    });
  };

  try {
    const xhrResult = await runXhr();

    // If XHR succeeded and returned valid JSON response, return it directly
    if (xhrResult.ok && xhrResult.data?.success) {
      return xhrResult;
    }

    // If XHR received a Cookie check or non-JSON HTML page, try fallback via fetch with credentials: "include"
    if (xhrResult.isCookieCheck || !xhrResult.data) {
      console.warn(
        `[UploadService] Application ${applicationId}: XHR received non-JSON or Cookie Check response, attempting fetch fallback with credentials: include...`
      );
      try {
        const fetchRes = await fetch("/api/submit-loan-application", {
          method: "POST",
          body: submitData,
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-Application-ID": applicationId,
          },
        });

        const fetchText = await fetchRes.text();
        let fetchData: any = null;
        try {
          fetchData = JSON.parse(fetchText);
        } catch {
          fetchData = null;
        }

        const isCookieCheckFetch = checkIsCookieCheck(fetchText);
        const okFetch =
          fetchRes.status >= 200 &&
          fetchRes.status < 300 &&
          !isCookieCheckFetch &&
          fetchData !== null &&
          fetchData?.success !== false;

        if (okFetch && fetchData?.success) {
          reportProgress(100);
          return {
            status: fetchRes.status,
            ok: true,
            data: fetchData,
            rawText: fetchText,
            isCookieCheck: false,
            applicationId,
            filesAttached: fileCount,
          };
        }

        return {
          status: fetchRes.status,
          ok: false,
          data: fetchData,
          rawText: fetchText,
          isCookieCheck: isCookieCheckFetch,
          applicationId,
          filesAttached: fileCount,
        };
      } catch (fetchErr) {
        console.warn("[UploadService] Fetch fallback also failed:", fetchErr);
      }
    }

    return xhrResult;
  } catch (err: any) {
    // If XHR threw a network error, try fetch fallback once
    try {
      const fetchRes = await fetch("/api/submit-loan-application", {
        method: "POST",
        body: submitData,
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-Application-ID": applicationId,
        },
      });

      const fetchText = await fetchRes.text();
      let fetchData: any = null;
      try {
        fetchData = JSON.parse(fetchText);
      } catch {
        fetchData = null;
      }

      const isCookieCheck = checkIsCookieCheck(fetchText);
      const okFetch =
        fetchRes.status >= 200 &&
        fetchRes.status < 300 &&
        !isCookieCheck &&
        fetchData !== null &&
        fetchData?.success !== false;

      if (okFetch && fetchData?.success) {
        reportProgress(100);
        return {
          status: fetchRes.status,
          ok: true,
          data: fetchData,
          rawText: fetchText,
          isCookieCheck: false,
          applicationId,
          filesAttached: fileCount,
        };
      }

      return {
        status: fetchRes.status,
        ok: false,
        data: fetchData,
        rawText: fetchText,
        isCookieCheck,
        applicationId,
        filesAttached: fileCount,
      };
    } catch {
      throw err;
    }
  }
}
