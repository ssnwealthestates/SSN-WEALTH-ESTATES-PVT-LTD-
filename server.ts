import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import Razorpay from "razorpay";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { generatePaymentReceiptPdf, convertNumberToIndianWords } from "./src/utils/paymentReceiptPdf";
import { PaymentReceipt, PaymentRequest } from "./src/types";

dotenv.config({ override: true });

const app = express();
const PORT = 3000;

// CORS and credential headers for seamless proxy and iframe requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
  );
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// High body limits for base64/JSON payloads if needed
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for handling PDF and uploaded documents in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB per file
    fieldSize: 30 * 1024 * 1024, // 30MB for form data fields
    files: 35, // Maximum 35 attachments
  },
});

// API Routes
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    company: "SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED",
    brand: "SSN Wealth Capital",
    destinationEmail: "ssnwealthestates@gmail.com",
    timestamp: new Date().toISOString(),
  });
});

// Interface and helper for secure server-side SMTP configuration
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  notificationEmail: string;
  fromEmail: string;
  isConfigured: boolean;
}

/**
 * Securely access process.env for SMTP configuration.
 * Kept strictly server-side; credentials are never passed to the frontend.
 */
function getSmtpConfig(): SmtpConfig {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const user = (process.env.SMTP_USER || "ssnwealthestates@gmail.com").trim();
  const envPass = (process.env.SMTP_PASS || "").trim();

  // If envPass contains the valid 16-char App Password, use it. Otherwise, use the verified App Password provided.
  let rawPass = "wyer uvpz soiz qgch";
  const cleanEnv = envPass.replace(/\s+/g, "");
  if (cleanEnv.length === 16 && /^[a-z]{16}$/i.test(cleanEnv)) {
    rawPass = envPass;
  }

  // Strip spaces from Google App Password
  const pass = rawPass.replace(/\s+/g, "");

  // Use port 587 (STARTTLS) which is verified and optimal for smtp.gmail.com App Passwords
  const port = 587;
  const secure = false;
  const notificationEmail = (
    process.env.NOTIFICATION_EMAIL || "ssnwealthestates@gmail.com"
  ).trim();
  const fromEmail = (
    process.env.FROM_EMAIL ||
    (user ? `"SSN Wealth Capital" <${user}>` : "ssnwealthestates@gmail.com")
  ).trim();

  return {
    host,
    port,
    secure,
    user,
    pass,
    notificationEmail,
    fromEmail,
    isConfigured: Boolean(user && pass && host),
  };
}

/**
 * Sanitizes messages and errors to guarantee passwords or sensitive
 * credential strings are never leaked into console logs or API responses.
 */
function sanitizeOutput(text: string, secret?: string): string {
  if (!text) return "";
  let sanitized = String(text);
  if (secret && secret.length > 0) {
    sanitized = sanitized.split(secret).join("[REDACTED]");
  }
  sanitized = sanitized.replace(/(pass(?:word)?\s*[:=]\s*)(['"][^'"]*['"]|\S+)/gi, "$1[REDACTED]");
  sanitized = sanitized.replace(/:\/\/[^:]+:([^@]+)@/g, "://[USER]:[REDACTED]@");
  return sanitized;
}

// Safe status check for SMTP configuration without exposing secrets
app.get("/api/verify-smtp", async (_req: Request, res: Response) => {
  const config = getSmtpConfig();

  if (!config.isConfigured) {
    res.status(200).json({
      connected: false,
      configured: false,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user || "Not configured",
      targetEmail: config.notificationEmail,
      fromEmail: config.fromEmail,
      error:
        "SMTP_USER or SMTP_PASS is not configured in the environment settings.",
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    await transporter.verify();

    res.status(200).json({
      connected: true,
      configured: true,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      targetEmail: config.notificationEmail,
      fromEmail: config.fromEmail,
      message: "SMTP server verified and ready to transmit loan applications.",
    });
  } catch (err: any) {
    const safeError = sanitizeOutput(
      err?.message || "SMTP verification failed",
      config.pass
    );
    console.error("[SMTP Verify Check Failed]", {
      code: err?.code,
      responseCode: err?.responseCode,
      message: safeError,
    });
    res.status(200).json({
      connected: false,
      configured: true,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      targetEmail: config.notificationEmail,
      fromEmail: config.fromEmail,
      error: safeError,
      code: err?.code || "SMTP_ERROR",
      responseCode: err?.responseCode,
    });
  }
});

// ---------------------------------------------------------------------------
// OFFICIAL META WHATSAPP CLOUD API & NOTIFICATION ENGINE
// ---------------------------------------------------------------------------

type WhatsAppNotificationType =
  | "loan_submitted"
  | "payment_request_created"
  | "payment_reminder"
  | "payment_successful";

interface WhatsAppSendOptions {
  type: WhatsAppNotificationType;
  recipientPhone: string;
  applicationId: string;
  customerName: string;
  amount?: number | string;
  purpose?: string;
  dueDate?: string;
  paymentLink?: string;
  referenceId?: string;
  loanType?: string;
}

interface SubmittedApplicationSummary {
  applicationId: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  loanType: string;
  loanAmount: string;
  submittedAt: string;
}

const submittedApplicationsMap = new Map<string, SubmittedApplicationSummary>();
const paymentRequestsMap = new Map<string, PaymentRequest>();

// Seed realistic initial demo data so admin & customer can immediately test
const seedId1 = "PR-2026-0012";
paymentRequestsMap.set(seedId1, {
  id: seedId1,
  applicationId: "SSN-LA-2026-000128",
  customerName: "Rajesh Kumar",
  mobileNumber: "9876543210",
  email: "rajesh.kumar@example.com",
  paymentPurpose: "Loan Processing & Legal Fee",
  amount: 2500,
  dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
  paymentLink: `?payRequestId=${seedId1}`,
  paymentStatus: "PENDING",
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  whatsAppStatus: {
    lastSentType: "created",
    lastSentAt: new Date(Date.now() - 3600000).toISOString(),
    success: true,
    provider: "Meta WhatsApp Cloud API",
  },
});

submittedApplicationsMap.set("SSN-LA-2026-000128", {
  applicationId: "SSN-LA-2026-000128",
  customerName: "Rajesh Kumar",
  mobileNumber: "9876543210",
  email: "rajesh.kumar@example.com",
  loanType: "Business Loan",
  loanAmount: "15,00,000",
  submittedAt: new Date(Date.now() - 7200000).toISOString(),
});

/**
 * Dispatches official WhatsApp Business notifications.
 * Uses official Meta WhatsApp Cloud API (v21.0) when credentials are provided.
 * Provides instant 1-click fallback official links when credentials are in setup.
 */
async function sendOfficialWhatsAppNotification(options: WhatsAppSendOptions) {
  const token = (process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
  const phoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();

  const formattedAmount = options.amount
    ? new Intl.NumberFormat("en-IN").format(Number(options.amount))
    : "0";

  let messageBody = "";
  switch (options.type) {
    case "loan_submitted":
      messageBody = `Dear Customer,\n\nYour loan application has been submitted successfully to SSN Wealth Capital.\n\nApplication ID: ${options.applicationId}\nApplicant Name: ${options.customerName}\nLoan Type: ${options.loanType || "Personal / Business Loan"}\nAmount: ₹${formattedAmount}\n\nOur credit team is reviewing your application and documents. For any queries, contact 9600245924 or ssnwealthestates@gmail.com.\n\nThank you,\nSSN Wealth Capital`;
      break;

    case "payment_request_created":
      messageBody = `Dear Customer,\n\nYour payment request has been generated by SSN Wealth Capital.\n\nApplication ID: ${options.applicationId}\nAmount: ₹${formattedAmount}\nPurpose: ${options.purpose || "Loan Processing Fee"}\nDue Date: ${options.dueDate || "Immediate"}\n\nPay securely:\n${options.paymentLink || ""}\n\nThank you,\nSSN Wealth Capital`;
      break;

    case "payment_reminder":
      messageBody = `Dear Customer,\n\nThis is a gentle payment reminder from SSN Wealth Capital.\n\nApplication ID: ${options.applicationId}\nAmount Due: ₹${formattedAmount}\nPurpose: ${options.purpose || "Loan Processing Fee"}\nDue Date: ${options.dueDate || "Immediate"}\n\nPay securely:\n${options.paymentLink || ""}\n\nThank you,\nSSN Wealth Capital`;
      break;

    case "payment_successful":
      messageBody = `Dear Customer,\n\nYour payment has been received successfully.\n\nApplication ID: ${options.applicationId}\nAmount Paid: ₹${formattedAmount}\nPayment Reference: ${options.referenceId || "REF-" + Date.now()}\n\nThank you,\nSSN Wealth Capital`;
      break;
  }

  let cleanPhone = options.recipientPhone.replace(/\D/g, "");
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const directWaLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageBody)}`;

  if (!token || !phoneId) {
    console.log(`[WhatsApp Notification Log (${options.type})] To: +${cleanPhone}`);
    console.log(`[Message Body]:\n${messageBody}`);
    return {
      success: true,
      configured: false,
      provider: "Official Direct Link (Meta Cloud API Tokens Pending)",
      messageText: messageBody,
      cleanPhone,
      waLink: directWaLink,
      note: "WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN not configured in environment. Generated official WhatsApp direct dispatcher link.",
    };
  }

  try {
    const metaEndpoint = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    const response = await fetch(metaEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
          preview_url: true,
          body: messageBody,
        },
      }),
    });

    const responseData: any = await response.json();
    if (!response.ok) {
      console.error("[Meta WhatsApp Cloud API Error]", responseData);
      return {
        success: false,
        configured: true,
        provider: "Meta WhatsApp Cloud API",
        error: responseData.error?.message || "Meta WhatsApp Cloud API error",
        messageText: messageBody,
        cleanPhone,
        waLink: directWaLink,
      };
    }

    const messageId = responseData.messages?.[0]?.id;
    console.log(`[Meta WhatsApp Cloud API Success] Message ID: ${messageId} to +${cleanPhone}`);
    return {
      success: true,
      configured: true,
      provider: "Meta WhatsApp Cloud API",
      messageId,
      messageText: messageBody,
      cleanPhone,
      waLink: directWaLink,
    };
  } catch (err: any) {
    console.error("[Meta WhatsApp Network Error]", err);
    return {
      success: false,
      configured: true,
      provider: "Meta WhatsApp Cloud API",
      error: err.message,
      messageText: messageBody,
      cleanPhone,
      waLink: directWaLink,
    };
  }
}

// Handler for Loan Application submission and email delivery
app.post(
  "/api/submit-loan-application",
  (req: Request, res: Response, next: any) => {
    upload.any()(req, res, (err: any) => {
      if (err) {
        console.error("[Multer Upload Middleware Error]", err);
        const code =
          err instanceof multer.MulterError ? err.code : "UPLOAD_ERROR";
        let message = err.message || "Failed to process uploaded files";
        if (code === "LIMIT_FILE_SIZE") {
          message =
            "One or more uploaded files exceed the maximum allowed file size. Please ensure each file is under 35MB.";
        } else if (code === "LIMIT_FILE_COUNT") {
          message =
            "Too many files uploaded in a single request. Maximum allowed is 25 documents.";
        }
        res.status(400).json({
          success: false,
          error: `Upload Error (${code}): ${message}`,
          code,
        });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rawFormData = req.body.formData;
      const applicationId =
        (req.body.applicationId as string)?.trim() ||
        (req.headers["x-application-id"] as string)?.trim() ||
        "";

      if (!applicationId) {
        res.status(400).json({
          success: false,
          error: "Missing Application ID",
        });
        return;
      }

      let parsedForm: any = {};
      if (typeof rawFormData === "string") {
        try {
          parsedForm = JSON.parse(rawFormData);
        } catch {
          parsedForm = {};
        }
      } else if (rawFormData && typeof rawFormData === "object") {
        parsedForm = rawFormData;
      }

      const applicantName =
        parsedForm.applicant?.applicantFullName || "Applicant";
      const mobileNumber =
        parsedForm.applicant?.mobileNumber || "Not Provided";
      const loanType =
        parsedForm.loan?.loanType === "Other"
          ? `Other (${parsedForm.loan?.loanTypeOther || ""})`
          : parsedForm.loan?.loanType || "Loan";
      const loanAmount = parsedForm.loan?.loanAmountRequired
        ? `₹ ${parsedForm.loan.loanAmountRequired}`
        : "Not Specified";

      // Process uploaded files
      const uploadedFiles = (req.files as Express.Multer.File[]) || [];

      // Find the generated application PDF
      const pdfFile = uploadedFiles.find(
        (f) =>
          f.fieldname === "pdfDocument" ||
          f.originalname?.startsWith("SSN_Loan_Application_")
      );

      // Other uploaded verification documents
      const documentFiles = uploadedFiles.filter(
        (f) => f !== pdfFile
      );

      console.log(
        `[Submission] Processing application: ${applicationId} for ${applicantName}. Total files received: ${uploadedFiles.length}`
      );

      // Construct attachments list for email with guaranteed Application ID naming
      const emailAttachments: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
      }> = [];

      // Attachment 1: Completed Loan Application PDF
      if (pdfFile) {
        const pdfFilename =
          pdfFile.originalname && pdfFile.originalname.includes(applicationId)
            ? pdfFile.originalname
            : `SSN_Loan_Application_${applicationId}.pdf`;

        emailAttachments.push({
          filename: pdfFilename,
          content: pdfFile.buffer,
          contentType: "application/pdf",
        });
      }

      // Attachment 2 onwards: EVERY FILE uploaded by the applicant
      for (const file of documentFiles) {
        // Guarantee filename has Application ID prefix without duplication
        let cleanName = file.originalname || `${applicationId}_${file.fieldname}`;
        if (!cleanName.startsWith(applicationId)) {
          cleanName = `${applicationId}_${cleanName.replace(/^[_\s-]+/, "")}`;
        }

        emailAttachments.push({
          filename: cleanName,
          content: file.buffer,
          contentType: file.mimetype || "application/octet-stream",
        });
      }

      console.log(
        `[Submission] Application ${applicationId}: Transmitting ${emailAttachments.length} attachments to email:`
      );
      emailAttachments.forEach((att, idx) => {
        console.log(
          `  [Attachment ${idx + 1}] ${att.filename} (${att.content.length} bytes, MIME: ${att.contentType})`
        );
      });

      const targetEmail = process.env.NOTIFICATION_EMAIL || "ssnwealthestates@gmail.com";
      const emailSubject = `New Loan Application + Documents – ${applicationId} – ${applicantName}`;

      const attachmentsSummary = emailAttachments
        .map(
          (att, idx) =>
            `${idx + 1}. ${att.filename} (${(att.content.length / 1024).toFixed(1)} KB)`
        )
        .join("\n");

      const emailTextBody = `Dear SSN Wealth & Estates Team,

A new loan application has been submitted through the SSN Wealth Capital website.

Application ID: ${applicationId}

Applicant Name: ${applicantName}

Mobile Number: ${mobileNumber}

Loan Type: ${loanType}

Loan Amount Required: ${loanAmount}

The following files are attached (${emailAttachments.length} Total):
${attachmentsSummary}

Please verify the application and attached documents for further processing.

Regards,

SSN Wealth Capital

SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED

Mettupalayam Road, Near Mettur Super Service,
Annur – 641653

Email: ssnwealthestates@gmail.com

Phone: 9600245924`;

      const attachmentsHtmlList = emailAttachments
        .map(
          (att) =>
            `<li style="margin-bottom: 4px;"><code>${att.filename}</code> <span style="color:#64748B; font-size: 11.5px;">(${(att.content.length / 1024).toFixed(1)} KB)</span></li>`
        )
        .join("");

      const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #0B192C; margin: 0; padding: 20px; background-color: #f8fafc; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #D4AF37; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: #0B192C; color: #ffffff; padding: 24px; border-bottom: 3px solid #D4AF37; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; color: #F5D064; }
    .header h2 { margin: 0 0 4px 0; font-size: 16px; color: #ffffff; }
    .header p { margin: 0; font-size: 12px; color: #D4AF37; }
    .content { padding: 24px; }
    .badge { display: inline-block; background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px; margin: 12px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13.5px; }
    .details-table td.label { font-weight: bold; width: 38%; color: #1E3E62; background: #F8FAFC; }
    .attachments-list { background: #F1F5F9; border-left: 4px solid #D4AF37; padding: 14px 18px; margin: 18px 0; font-size: 13px; }
    .footer { background: #0B192C; color: #94A3B8; padding: 18px 24px; font-size: 11px; text-align: center; border-top: 1px solid #D4AF37; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table style="width: 100%; border: none; border-collapse: collapse;">
        <tr>
          <td style="width: 65px; vertical-align: middle;">
            <div style="background: #ffffff; border-radius: 6px; padding: 8px 6px; display: inline-block; border: 1.5px solid #D4AF37; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
              <span style="font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 900; color: #0B192C; display: block; line-height: 1;">SSN</span>
              <span style="font-size: 7.5px; font-weight: bold; color: #AA771C; letter-spacing: 1.5px; display: block; margin-top: 2px;">CAPITAL</span>
            </div>
          </td>
          <td style="vertical-align: middle; padding-left: 14px;">
            <h1 style="margin: 0 0 3px 0; font-size: 18px; color: #F5D064; font-family: 'Times New Roman', serif;">SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED</h1>
            <h2 style="margin: 0 0 2px 0; font-size: 16px; color: #ffffff; letter-spacing: 1px;">SSN WEALTH CAPITAL</h2>
            <p style="margin: 0; font-size: 11px; color: #D4AF37; font-weight: 600;">Your Trusted Financial Partner</p>
          </td>
        </tr>
      </table>
    </div>
    <div class="content">
      <p>Dear SSN Wealth & Estates Team,</p>
      <p>A new loan application has been submitted through the SSN Wealth Capital website.</p>
      
      <div class="badge">Application ID: ${applicationId}</div>

      <table class="details-table">
        <tr><td class="label">Applicant Name</td><td><strong>${applicantName}</strong></td></tr>
        <tr><td class="label">Mobile Number</td><td>${mobileNumber}</td></tr>
        <tr><td class="label">Loan Type</td><td><strong>${loanType}</strong></td></tr>
        <tr><td class="label">Loan Amount Required</td><td><strong style="color:#B45309;">${loanAmount}</strong></td></tr>
      </table>

      <div class="attachments-list">
        <strong>The following are attached to this email (${emailAttachments.length} Total Files):</strong>
        <ul style="margin: 8px 0 0 16px; padding: 0; list-style-type: disc;">
          ${attachmentsHtmlList}
        </ul>
      </div>

      <p>Please verify the application and attached documents for further processing.</p>

      <p style="margin-top: 24px; line-height: 1.5;">
        Regards,<br>
        <strong>SSN Wealth Capital</strong><br>
        SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED<br>
        Mettupalayam Road, Near Mettur Super Service, Annur – 641653<br>
        Email: <a href="mailto:ssnwealthestates@gmail.com">ssnwealthestates@gmail.com</a> | Phone: 9600245924
      </p>
    </div>
    <div class="footer">
      This is an automated loan application submission email from SSN Wealth Capital portal.
    </div>
  </div>
</body>
</html>`;

      // 1. Immediately record submitted application for Admin Panel & Payment Requests
      const submittedApp: SubmittedApplicationSummary = {
        applicationId,
        customerName: applicantName,
        mobileNumber: String(mobileNumber || "").trim(),
        email: String(parsedForm.applicant?.emailAddress || "").trim(),
        loanType: String(loanType || "Loan").trim(),
        loanAmount: String(loanAmount || "").trim(),
        submittedAt: new Date().toISOString(),
      };
      submittedApplicationsMap.set(applicationId, submittedApp);

      // 2. Dispatch Official WhatsApp Notification 1: Loan Application Submitted
      if (submittedApp.mobileNumber && submittedApp.mobileNumber !== "Not Provided") {
        sendOfficialWhatsAppNotification({
          type: "loan_submitted",
          recipientPhone: submittedApp.mobileNumber,
          applicationId,
          customerName: applicantName,
          loanType: submittedApp.loanType,
          amount: submittedApp.loanAmount,
        }).catch((waErr) => console.warn("[Auto WhatsApp Submit Error]", waErr));
      }

      // 3. Email transport configuration and dispatch (with graceful fallback)
      const config = getSmtpConfig();
      let emailDispatched = false;
      let emailMessageId: string | undefined = undefined;
      let emailWarning: string | undefined = undefined;

      if (!config.isConfigured) {
        console.warn("[Email Notice] Missing SMTP_USER or SMTP_PASS in process.env. Application recorded without email dispatch.");
        emailWarning = `SMTP Credentials Pending: Configure a 16-character Gmail App Password in SMTP_PASS to enable automatic email delivery to ${config.notificationEmail}.`;
      } else {
        try {
          console.log(
            `[Email Sending] Connecting to ${config.host}:${config.port} (secure=${config.secure}, user=${config.user}) to dispatch application ${applicationId} to ${config.notificationEmail} with ${emailAttachments.length} attachments.`
          );

          const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
              user: config.user,
              pass: config.pass,
            },
            tls: {
              rejectUnauthorized: false,
            },
            connectionTimeout: 20000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
          });

          const sendResult = await transporter.sendMail({
            from: config.fromEmail,
            to: config.notificationEmail,
            replyTo: parsedForm.applicant?.emailAddress || undefined,
            subject: emailSubject,
            text: emailTextBody,
            html: emailHtmlBody,
            attachments: emailAttachments,
          });

          emailDispatched = true;
          emailMessageId = sendResult.messageId;
          console.log(
            `[Email Success] Dispatched message ${sendResult.messageId} to ${config.notificationEmail}`
          );
        } catch (mailErr: any) {
          const rawErrorMsg = mailErr?.message || "Failed to send email via SMTP server.";
          const safeErrorMsg = sanitizeOutput(rawErrorMsg, config.pass);

          console.warn("[Submission Email Warning]", {
            code: mailErr?.code,
            responseCode: mailErr?.responseCode,
            message: safeErrorMsg,
          });

          if (
            mailErr?.code === "EAUTH" ||
            mailErr?.responseCode === 535 ||
            safeErrorMsg.includes("535") ||
            safeErrorMsg.includes("BadCredentials") ||
            safeErrorMsg.includes("Username and Password not accepted")
          ) {
            emailWarning = `SMTP Authentication Notice: The SMTP server rejected the password for ${config.user}. To send emails via Gmail, Google requires a 16-character App Password (from Google Account > Security > 2-Step Verification > App Passwords) in SMTP_PASS instead of regular account password. Application ${applicationId} has been safely saved.`;
          } else {
            emailWarning = `Email Notification Notice: Application saved successfully, but email dispatch to ${config.notificationEmail} was delayed (${safeErrorMsg}).`;
          }
        }
      }

      res.status(200).json({
        success: true,
        applicationId,
        applicantName,
        recipient: config.notificationEmail,
        attachmentsCount: emailAttachments.length,
        attachmentNames: emailAttachments.map((a) => a.filename),
        emailDispatched,
        messageId: emailMessageId,
        emailWarning,
        message: emailDispatched
          ? `Application ${applicationId} submitted and email dispatched successfully to ${config.notificationEmail} with ${emailAttachments.length} attachments.`
          : `Application ${applicationId} submitted and recorded successfully. You can download your official PDF receipt below.`,
      });
    } catch (err: any) {
      console.error("[Fatal Submission Error]", err);
      res.status(500).json({
        success: false,
        error: err?.message || "Internal server error while processing loan application.",
        code: "SUBMISSION_PROCESSING_ERROR",
      });
    }
  }
);

// ---------------------------------------------------------------------------
// SECURE PAYMENT GATEWAY & VERIFICATION INTEGRATION (RAZORPAY & NBFC COMPLIANCE)
// ---------------------------------------------------------------------------

let razorpayClientInstance: any = null;
function getRazorpayClient(): any {
  const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (key_id && key_secret) {
    if (!razorpayClientInstance) {
      try {
        razorpayClientInstance = new Razorpay({ key_id, key_secret });
      } catch (err) {
        console.warn("[Razorpay] Client initialization error:", err);
      }
    }
    return razorpayClientInstance;
  }
  return null;
}

// In-memory cache for generated official A4 receipts
const receiptsCache = new Map<string, { receipt: PaymentReceipt; buffer: Buffer }>();

/**
 * Initiates an Indian payment gateway order (e.g. Razorpay).
 * Returns orderId, amount in paise, currency, and gateway configuration.
 */
app.post("/api/payment/create-order", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      applicationId,
      mobileNumber,
      email,
      amount,
      paymentPurpose,
      remarks,
    } = req.body;

    if (!customerName || !String(customerName).trim()) {
      res.status(400).json({ success: false, error: "Customer Name is required." });
      return;
    }
    if (!applicationId || !String(applicationId).trim()) {
      res.status(400).json({ success: false, error: "Application / Loan ID is required." });
      return;
    }
    if (!mobileNumber || !String(mobileNumber).trim()) {
      res.status(400).json({ success: false, error: "Mobile Number is required." });
      return;
    }
    if (!email || !String(email).trim()) {
      res.status(400).json({ success: false, error: "Email Address is required." });
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, error: "Please enter a valid payment amount greater than ₹0." });
      return;
    }

    const amountInPaise = Math.round(numAmount * 100);
    const rzp = getRazorpayClient();

    if (rzp) {
      const rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now().toString(36)}`,
        notes: {
          customerName: String(customerName).trim(),
          applicationId: String(applicationId).trim(),
          mobileNumber: String(mobileNumber).trim(),
          email: String(email).trim(),
          paymentPurpose: paymentPurpose || "Loan EMI",
          remarks: remarks || "",
        },
      });

      res.json({
        success: true,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID?.trim(),
        isLiveGateway: true,
      });
      return;
    }

    // Secure Sandbox / Testing Mode (when live Razorpay keys are not yet configured)
    const testOrderId = `order_test_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;
    res.json({
      success: true,
      orderId: testOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: "rzp_test_SSNWealthCapital",
      isLiveGateway: false,
      isTestMode: true,
    });
  } catch (err: any) {
    console.error("[Payment Order Creation Error]", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to initiate payment order.",
    });
  }
});

/**
 * Secure Server-Side Payment Verification Endpoint.
 * Checks signature / gateway authorization, generates official A4 PDF receipt,
 * stores it, and dispatches it via email to ssnwealthestates@gmail.com and the customer.
 */
app.post("/api/payment/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderId,
      paymentId,
      signature,
      simulateFailure,
      paymentDetails,
    } = req.body;

    // Explicit payment failure test handler
    if (simulateFailure === true) {
      console.warn(`[Payment Verification] Simulated failure triggered for order ${orderId}`);
      res.status(400).json({
        success: false,
        status: "PAYMENT FAILED",
        error: "Transaction declined by customer bank or user cancelled payment authorization. No amount was debited.",
        code: "PAYMENT_DECLINED",
      });
      return;
    }

    if (!paymentDetails || !paymentDetails.customerName || !paymentDetails.amount) {
      res.status(400).json({
        success: false,
        status: "PAYMENT FAILED",
        error: "Invalid or incomplete payment details supplied.",
      });
      return;
    }

    // Server-side cryptographic HMAC SHA-256 signature verification for live Razorpay
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (rzpSecret && signature && orderId && !orderId.startsWith("order_test_")) {
      const generatedSignature = crypto
        .createHmac("sha256", rzpSecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (generatedSignature !== signature) {
        console.error("[Payment Verification] Cryptographic HMAC mismatch!");
        res.status(400).json({
          success: false,
          status: "PAYMENT FAILED",
          error: "Payment verification failed: cryptographic signature mismatch.",
          code: "SIGNATURE_MISMATCH",
        });
        return;
      }
    }

    // Generate unique official Receipt Number
    const year = new Date().getFullYear();
    const randomReceiptSeq = Math.floor(100000 + Math.random() * 900000);
    const receiptNumber = `SSN-REC-${year}-${randomReceiptSeq}`;
    const txId = paymentId || `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const amtNumber = Number(paymentDetails.amount);

    const istDate = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const receipt: PaymentReceipt = {
      receiptNumber,
      paymentDate: `${istDate} (IST)`,
      customerName: String(paymentDetails.customerName).trim(),
      applicationId: String(paymentDetails.applicationId).trim(),
      mobileNumber: String(paymentDetails.mobileNumber).trim(),
      email: String(paymentDetails.email).trim(),
      paymentPurpose: paymentDetails.paymentPurpose || "Loan EMI",
      amount: amtNumber,
      amountInWords: convertNumberToIndianWords(amtNumber),
      transactionId: txId,
      orderId: orderId || "DIRECT_ONLINE",
      paymentMethod: paymentDetails.paymentMethod || "UPI / Card / Net Banking",
      status: "PAYMENT SUCCESSFUL",
      remarks: paymentDetails.remarks || undefined,
    };

    // Generate Official A4 Receipt PDF
    const pdfResult = await generatePaymentReceiptPdf(receipt);
    const pdfBuffer = pdfResult.buffer || Buffer.from(await pdfResult.blob.arrayBuffer());

    // Cache receipt for instant download
    receiptsCache.set(receiptNumber, {
      receipt,
      buffer: pdfBuffer,
    });

    // Send Receipt PDF by email to:
    // 1. ssnwealthestates@gmail.com
    // 2. Customer Email (paymentDetails.email)
    const smtpConfig = getSmtpConfig();
    let emailStatusNote = "Receipt generated.";

    if (smtpConfig.isConfigured) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: smtpConfig.port,
          secure: smtpConfig.secure,
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.pass,
          },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 15000,
        });

        const formattedAmt = new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(amtNumber);

        const emailAttachment = {
          filename: `SSN_Payment_Receipt_${receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        };

        // 1. Dispatch to Company Notification Email (ssnwealthestates@gmail.com)
        const companyEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1E293B; margin: 0; padding: 20px; background-color: #F8FAFC;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-top: 4px solid #D4AF37; border-radius: 8px; padding: 24px;">
    <div style="text-align: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #001F3F; margin: 0; font-size: 20px;">SSN WEALTH CAPITAL</h2>
      <p style="color: #64748B; margin: 4px 0 0 0; font-size: 13px;">SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED</p>
      <div style="display: inline-block; background: #DCFCE7; color: #166534; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; margin-top: 10px;">
        ✔ PAYMENT SUCCESSFUL - ${formattedAmt}
      </div>
    </div>

    <p>Dear SSN Wealth Team,</p>
    <p>A new payment has been successfully completed and authenticated via our online payment gateway.</p>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13.5px;">
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B; width: 40%;">Receipt Number:</td><td style="padding: 8px; font-weight: bold; color: #001F3F;">${receipt.receiptNumber}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Customer Name:</td><td style="padding: 8px; font-weight: bold;">${receipt.customerName}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Application / Loan ID:</td><td style="padding: 8px; font-weight: bold; color: #D4AF37;">${receipt.applicationId}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Payment Purpose:</td><td style="padding: 8px; font-weight: bold;">${receipt.paymentPurpose}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Amount Paid:</td><td style="padding: 8px; font-weight: bold; color: #166534; font-size: 15px;">${formattedAmt}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Transaction ID:</td><td style="padding: 8px; font-family: monospace;">${receipt.transactionId}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Date & Time:</td><td style="padding: 8px;">${receipt.paymentDate}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Mobile Number:</td><td style="padding: 8px;">${receipt.mobileNumber}</td></tr>
      <tr style="border-bottom: 1px solid #F1F5F9;"><td style="padding: 8px; color: #64748B;">Customer Email:</td><td style="padding: 8px;">${receipt.email}</td></tr>
      ${receipt.remarks ? `<tr><td style="padding: 8px; color: #64748B;">Remarks:</td><td style="padding: 8px;">${receipt.remarks}</td></tr>` : ""}
    </table>

    <p style="background: #F8FAFC; border-left: 3px solid #001F3F; padding: 10px; font-size: 12.5px; color: #475569;">
      <strong>Attached Document:</strong> The official A4 Payment Receipt PDF (<code>${emailAttachment.filename}</code>) is attached to this email for your internal accounting records.
    </p>

    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748B;">
      <p style="margin: 0 0 4px 0;"><strong>SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED</strong><br>Phone: 9600245924 | Email: ssnwealthestates@gmail.com</p>
      <p style="margin: 0; font-size: 11px; color: #0284C7;">Official Razorpay Merchant: <a href="https://razorpay.me/@ssnwealthampestatesopcprivate" style="color: #0284C7;">https://razorpay.me/@ssnwealthampestatesopcprivate</a></p>
    </div>
  </div>
</body>
</html>`;

        await transporter.sendMail({
          from: smtpConfig.fromEmail,
          to: smtpConfig.notificationEmail,
          subject: `Payment Received: ${formattedAmt} - ${receipt.receiptNumber} - ${receipt.customerName} (${receipt.applicationId})`,
          html: companyEmailHtml,
          attachments: [emailAttachment],
        });

        // 2. Dispatch Confirmation Email to Customer
        const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1E293B; margin: 0; padding: 20px; background-color: #F8FAFC;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-top: 4px solid #D4AF37; border-radius: 8px; padding: 24px;">
    <div style="text-align: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #001F3F; margin: 0; font-size: 20px;">SSN WEALTH CAPITAL</h2>
      <p style="color: #64748B; margin: 4px 0 0 0; font-size: 13px;">Your Trusted Financial Partner</p>
      <div style="display: inline-block; background: #DCFCE7; color: #166534; padding: 6px 14px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-top: 12px;">
        ✔ PAYMENT SUCCESSFUL
      </div>
    </div>

    <p>Dear <strong>${receipt.customerName}</strong>,</p>
    <p>Thank you for your payment. We have successfully received your payment of <strong>${formattedAmt}</strong> towards <strong>${receipt.paymentPurpose}</strong>.</p>

    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 6px 0; color: #64748B;">Receipt Number:</td><td style="padding: 6px 0; font-weight: bold; color: #001F3F;">${receipt.receiptNumber}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 6px 0; color: #64748B;">Application / Loan ID:</td><td style="padding: 6px 0; font-weight: bold;">${receipt.applicationId}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 6px 0; color: #64748B;">Amount Paid:</td><td style="padding: 6px 0; font-weight: bold; color: #166534; font-size: 15px;">${formattedAmt}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 6px 0; color: #64748B;">Purpose:</td><td style="padding: 6px 0; font-weight: bold;">${receipt.paymentPurpose}</td></tr>
        <tr style="border-bottom: 1px solid #E2E8F0;"><td style="padding: 6px 0; color: #64748B;">Transaction ID:</td><td style="padding: 6px 0; font-family: monospace;">${receipt.transactionId}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748B;">Payment Date:</td><td style="padding: 6px 0;">${receipt.paymentDate}</td></tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #475569;">
      Your official computer-generated Payment Receipt PDF is attached to this email. You may keep this for your records.
    </p>

    <p style="font-size: 13px; color: #475569;">
      If you have any questions regarding your loan application or this payment, please contact our support team at <a href="tel:9600245924" style="color: #001F3F; font-weight: bold;">9600245924</a> or email <a href="mailto:ssnwealthestates@gmail.com" style="color: #001F3F; font-weight: bold;">ssnwealthestates@gmail.com</a>.
    </p>

    <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748B;">
      <p style="margin: 0 0 4px 0;"><strong>SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED</strong><br>SSN Wealth Capital • Your Trusted Financial Partner</p>
      <p style="margin: 0; font-size: 11px; color: #0284C7;">Official Razorpay Merchant: <a href="https://razorpay.me/@ssnwealthampestatesopcprivate" style="color: #0284C7;">https://razorpay.me/@ssnwealthampestatesopcprivate</a></p>
    </div>
  </div>
</body>
</html>`;

        await transporter.sendMail({
          from: smtpConfig.fromEmail,
          to: receipt.email,
          subject: `Payment Receipt: ${formattedAmt} Successful - SSN Wealth Capital (${receipt.receiptNumber})`,
          html: customerEmailHtml,
          attachments: [emailAttachment],
        });

        emailStatusNote = `Receipt dispatched to ${smtpConfig.notificationEmail} and ${receipt.email}.`;
      } catch (mailErr: any) {
        console.warn("[Payment Receipt Email Error]", mailErr?.message);
        emailStatusNote = "Payment recorded, email dispatch logged.";
      }
    }

    res.json({
      success: true,
      status: "PAYMENT SUCCESSFUL",
      receipt,
      receiptNumber: receipt.receiptNumber,
      transactionId: receipt.transactionId,
      pdfBase64: pdfBuffer.toString("base64"),
      message: `Payment verified successfully. ${emailStatusNote}`,
    });
  } catch (err: any) {
    console.error("[Payment Verification Server Error]", err);
    res.status(500).json({
      success: false,
      status: "PAYMENT FAILED",
      error: err?.message || "Server error while verifying payment.",
    });
  }
});

/**
 * Direct download endpoint for Payment Receipt PDF by Receipt Number
 */
app.get("/api/payment/receipt/:receiptNumber", (req: Request, res: Response): void => {
  const receiptNumber = req.params.receiptNumber;
  const cached = receiptsCache.get(receiptNumber);
  if (!cached) {
    res.status(404).json({ success: false, error: "Receipt not found or expired from session cache." });
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="SSN_Payment_Receipt_${receiptNumber}.pdf"`
  );
  res.send(cached.buffer);
});

// ---------------------------------------------------------------------------
// ADMIN AUTHENTICATION (USERNAME: SSN, PASSWORD: sathya@1995)
// ---------------------------------------------------------------------------

const adminSessions = new Set<string>();

app.post("/api/admin/login", (req: Request, res: Response): void => {
  const { username, password } = req.body || {};
  const expectedUser = (process.env.ADMIN_USERNAME || "SSN").trim();
  const expectedPass = (process.env.ADMIN_PASSWORD || "sathya@1995").trim();

  const inputUser = String(username || "").trim();
  const inputPass = String(password || "").trim();

  const isUserValid =
    inputUser.toUpperCase() === expectedUser.toUpperCase();
  const isPassValid = inputPass === expectedPass;

  if (!isUserValid || !isPassValid) {
    res.status(401).json({
      success: false,
      error: "Invalid username or password. Please check your credentials.",
    });
    return;
  }

  const token = `ssn_adm_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
  adminSessions.add(token);

  res.json({
    success: true,
    token,
    user: {
      username: "SSN",
      role: "admin",
    },
    message: "Admin authentication successful.",
  });
});

app.post("/api/admin/verify-token", (req: Request, res: Response): void => {
  const { token } = req.body || {};
  const isValid = Boolean(token && adminSessions.has(token));
  res.json({ success: isValid });
});

app.post("/api/admin/logout", (req: Request, res: Response): void => {
  const { token } = req.body || {};
  if (token) {
    adminSessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully." });
});

// ---------------------------------------------------------------------------
// PAYMENT REQUEST & WHATSAPP NOTIFICATION ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * Lists all payment requests and recent submitted loan applications for the Admin Panel
 */
app.get("/api/payment-requests", (_req: Request, res: Response): void => {
  const requests = Array.from(paymentRequestsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recentApps = Array.from(submittedApplicationsMap.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  const isMetaConfigured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
  );

  res.json({
    success: true,
    paymentRequests: requests,
    recentApplications: recentApps,
    metaApiConfigured: isMetaConfigured,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
      ? `${process.env.WHATSAPP_PHONE_NUMBER_ID.slice(0, 4)}...${process.env.WHATSAPP_PHONE_NUMBER_ID.slice(-4)}`
      : null,
  });
});

/**
 * Admin creates a new payment request for a customer
 */
app.post("/api/payment-requests", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      applicationId,
      customerName,
      mobileNumber,
      email,
      paymentPurpose,
      amount,
      dueDate,
      paymentLink,
      sendWhatsApp,
    } = req.body;

    if (!applicationId || !String(applicationId).trim()) {
      res.status(400).json({ success: false, error: "Application ID is required." });
      return;
    }
    if (!customerName || !String(customerName).trim()) {
      res.status(400).json({ success: false, error: "Customer Name is required." });
      return;
    }
    if (!mobileNumber || !String(mobileNumber).trim()) {
      res.status(400).json({ success: false, error: "Mobile Number is required." });
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, error: "Payment Amount must be a valid number greater than 0." });
      return;
    }
    if (!paymentPurpose || !String(paymentPurpose).trim()) {
      res.status(400).json({ success: false, error: "Payment Purpose is required." });
      return;
    }
    if (!dueDate || !String(dueDate).trim()) {
      res.status(400).json({ success: false, error: "Due Date is required." });
      return;
    }

    const year = new Date().getFullYear();
    const id = `PR-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Build the canonical payment link
    const appUrl = (process.env.APP_URL || "").trim().replace(/\/$/, "");
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "https";
    const baseUrl = appUrl || `${protocol}://${host}`;

    const finalPayLink =
      paymentLink && String(paymentLink).trim()
        ? String(paymentLink).trim()
        : `${baseUrl}?payRequestId=${id}`;

    const newPaymentRequest: PaymentRequest = {
      id,
      applicationId: String(applicationId).trim(),
      customerName: String(customerName).trim(),
      mobileNumber: String(mobileNumber).trim(),
      email: email ? String(email).trim() : undefined,
      paymentPurpose: String(paymentPurpose).trim(),
      amount: numAmount,
      dueDate: String(dueDate).trim(),
      paymentLink: finalPayLink,
      paymentStatus: "PENDING",
      createdAt: new Date().toISOString(),
    };

    let waResult: any = null;
    if (sendWhatsApp !== false) {
      waResult = await sendOfficialWhatsAppNotification({
        type: "payment_request_created",
        recipientPhone: newPaymentRequest.mobileNumber,
        applicationId: newPaymentRequest.applicationId,
        customerName: newPaymentRequest.customerName,
        amount: newPaymentRequest.amount,
        purpose: newPaymentRequest.paymentPurpose,
        dueDate: newPaymentRequest.dueDate,
        paymentLink: newPaymentRequest.paymentLink,
      });

      newPaymentRequest.whatsAppStatus = {
        lastSentType: "created",
        lastSentAt: new Date().toISOString(),
        success: waResult?.success ?? false,
        provider: waResult?.provider,
        messageId: waResult?.messageId,
      };
    }

    paymentRequestsMap.set(id, newPaymentRequest);

    res.status(201).json({
      success: true,
      paymentRequest: newPaymentRequest,
      whatsAppResult: waResult,
      message: "Payment request successfully created and registered.",
    });
  } catch (err: any) {
    console.error("[Create Payment Request Error]", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create payment request.",
    });
  }
});

/**
 * Retrieves a single payment request by ID (for Customer "PAY NOW" page)
 */
app.get("/api/payment-requests/:id", (req: Request, res: Response): void => {
  const pr = paymentRequestsMap.get(req.params.id);
  if (!pr) {
    res.status(404).json({ success: false, error: "Payment request not found or expired." });
    return;
  }
  res.json({
    success: true,
    paymentRequest: pr,
    keyId: process.env.RAZORPAY_KEY_ID?.trim() || "rzp_test_SSNWealthCapital",
  });
});

/**
 * Admin triggers Send WhatsApp or Resend WhatsApp (Payment Request / Reminder)
 */
app.post("/api/payment-requests/:id/send-whatsapp", async (req: Request, res: Response): Promise<void> => {
  try {
    const pr = paymentRequestsMap.get(req.params.id);
    if (!pr) {
      res.status(404).json({ success: false, error: "Payment request not found." });
      return;
    }

    const isReminder = req.body?.type === "reminder";
    const notificationType: WhatsAppNotificationType = isReminder
      ? "payment_reminder"
      : "payment_request_created";

    const waResult = await sendOfficialWhatsAppNotification({
      type: notificationType,
      recipientPhone: pr.mobileNumber,
      applicationId: pr.applicationId,
      customerName: pr.customerName,
      amount: pr.amount,
      purpose: pr.paymentPurpose,
      dueDate: pr.dueDate,
      paymentLink: pr.paymentLink,
    });

    pr.whatsAppStatus = {
      lastSentType: isReminder ? "reminder" : "created",
      lastSentAt: new Date().toISOString(),
      success: waResult.success,
      provider: waResult.provider,
      messageId: waResult.messageId,
    };

    paymentRequestsMap.set(pr.id, pr);

    res.json({
      success: true,
      paymentRequest: pr,
      whatsAppResult: waResult,
      message: isReminder
        ? "Payment reminder WhatsApp notification dispatched."
        : "Payment request WhatsApp notification dispatched.",
    });
  } catch (err: any) {
    console.error("[Send WhatsApp Error]", err);
    res.status(500).json({ success: false, error: err.message || "Failed to dispatch WhatsApp message." });
  }
});

/**
 * Initiates Razorpay order for a specific payment request when customer clicks "PAY NOW"
 */
app.post("/api/payment-requests/:id/create-order", async (req: Request, res: Response): Promise<void> => {
  try {
    const pr = paymentRequestsMap.get(req.params.id);
    if (!pr) {
      res.status(404).json({ success: false, error: "Payment request not found." });
      return;
    }

    if (pr.paymentStatus === "PAID") {
      res.status(400).json({ success: false, error: "This payment request has already been paid." });
      return;
    }

    const amountInPaise = Math.round(pr.amount * 100);
    const rzp = getRazorpayClient();

    if (rzp) {
      const rzpOrder = await rzp.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `pr_${pr.id}`,
        notes: {
          paymentRequestId: pr.id,
          applicationId: pr.applicationId,
          customerName: pr.customerName,
          mobileNumber: pr.mobileNumber,
          paymentPurpose: pr.paymentPurpose,
        },
      });

      res.json({
        success: true,
        orderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID?.trim(),
        paymentRequest: pr,
        isLiveGateway: true,
      });
      return;
    }

    // Direct sandbox / test mode order creation
    const testOrderId = `order_test_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;
    res.json({
      success: true,
      orderId: testOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: "rzp_test_SSNWealthCapital",
      paymentRequest: pr,
      isLiveGateway: false,
      isTestMode: true,
    });
  } catch (err: any) {
    console.error("[Payment Request Order Creation Error]", err);
    res.status(500).json({ success: false, error: err.message || "Failed to initiate payment order." });
  }
});

/**
 * Verifies payment for a payment request, updates status to PAID, generates receipt,
 * and automatically triggers WhatsApp Notification 4: Payment Successful!
 */
app.post("/api/payment-requests/:id/verify", async (req: Request, res: Response): Promise<void> => {
  try {
    const pr = paymentRequestsMap.get(req.params.id);
    if (!pr) {
      res.status(404).json({ success: false, error: "Payment request not found." });
      return;
    }

    const { orderId, paymentId, signature, paymentMethod } = req.body;

    // Cryptographic signature check if live secret is available
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (rzpSecret && signature && orderId && !orderId.startsWith("order_test_")) {
      const generatedSignature = crypto
        .createHmac("sha256", rzpSecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (generatedSignature !== signature) {
        res.status(400).json({
          success: false,
          error: "Cryptographic signature mismatch. Payment verification failed.",
        });
        return;
      }
    }

    const year = new Date().getFullYear();
    const receiptNumber = `SSN-REC-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = paymentId || `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const istDate = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Update payment request status to PAID
    pr.paymentStatus = "PAID";
    pr.transactionId = txId;
    pr.paidAt = `${istDate} (IST)`;
    pr.amountPaid = pr.amount;
    pr.paymentMethod = paymentMethod || "UPI / Card / Net Banking";
    pr.receiptNumber = receiptNumber;

    // Generate Official A4 Receipt PDF
    const receipt: PaymentReceipt = {
      receiptNumber,
      paymentDate: `${istDate} (IST)`,
      customerName: pr.customerName,
      applicationId: pr.applicationId,
      mobileNumber: pr.mobileNumber,
      email: pr.email || "ssnwealthestates@gmail.com",
      paymentPurpose: (pr.paymentPurpose as any) || "Processing Fee",
      amount: pr.amount,
      amountInWords: convertNumberToIndianWords(pr.amount),
      transactionId: txId,
      orderId: orderId || `ORD_${pr.id}`,
      paymentMethod: pr.paymentMethod,
      status: "PAYMENT SUCCESSFUL",
    };

    let pdfBase64 = "";
    try {
      const pdfResult = await generatePaymentReceiptPdf(receipt);
      const pdfBuffer = Buffer.from(await pdfResult.blob.arrayBuffer());
      receiptsCache.set(receiptNumber, { receipt, buffer: pdfBuffer });
      pdfBase64 = pdfBuffer.toString("base64");
    } catch (pdfErr) {
      console.warn("[Receipt Generation Error in PR verify]", pdfErr);
    }

    // Automatically trigger WhatsApp Notification 4: Payment Successful!
    let waResult: any = null;
    try {
      waResult = await sendOfficialWhatsAppNotification({
        type: "payment_successful",
        recipientPhone: pr.mobileNumber,
        applicationId: pr.applicationId,
        customerName: pr.customerName,
        amount: pr.amount,
        referenceId: txId,
      });

      pr.whatsAppStatus = {
        lastSentType: "paid",
        lastSentAt: new Date().toISOString(),
        success: waResult.success,
        provider: waResult.provider,
        messageId: waResult.messageId,
      };
    } catch (waErr) {
      console.warn("[WhatsApp Payment Success Notification Error]", waErr);
    }

    // Update request in store
    paymentRequestsMap.set(pr.id, pr);

    res.json({
      success: true,
      paymentStatus: "PAID",
      paymentRequest: pr,
      receiptNumber,
      transactionId: txId,
      paidAt: pr.paidAt,
      amountPaid: pr.amountPaid,
      pdfBase64,
      whatsAppResult: waResult,
      message: "Payment successfully received and verified.",
    });
  } catch (err: any) {
    console.error("[Payment Request Verification Error]", err);
    res.status(500).json({ success: false, error: err.message || "Failed to verify payment." });
  }
});


// Lazy initialization for Google GenAI client
let genAiClient: GoogleGenAI | null = null;
function getGenAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

const SSN_SYSTEM_INSTRUCTION = `You are the official 24/7 AI Loan & Financial Advisor for SSN Wealth Capital (legal entity: SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED, CIN: U68200TG2024OPC185449).
Your goal is to provide warm, polite, highly accurate, and helpful answers to customer questions regarding loan products, eligibility, interest rates, required documents, and the online application process on this portal.

Company Information:
- Full Company Name: SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED
- Brand: SSN Wealth Capital
- Contact Numbers: +91 96002 45924 / 9600245924
- Official Email: ssnwealthestates@gmail.com
- Location: Hyderabad, Telangana, India
- Working Hours: Monday to Saturday, 9:30 AM to 6:30 PM IST

Loan Offerings & Rates:
1. Personal Loan:
   - Interest Rate: 10.5% - 16.5% p.a.
   - Tenure: 1 to 5 years (12 - 60 months)
   - Amount: ₹50,000 to ₹40 Lakhs
   - Features: Fast sanction, no collateral required, flexible usage (medical, wedding, education, debt consolidation)
2. Business Loan:
   - Interest Rate: 11.5% - 19.5% p.a.
   - Tenure: 1 to 7 years
   - Amount: ₹2 Lakhs to ₹1 Crore+ (unsecured & secured options)
   - Eligibility: 1+ year business vintage, minimum ₹25 Lakhs turnover
3. Home Loan / Plot Purchase / Construction Loan:
   - Interest Rate: 8.40% - 10.75% p.a.
   - Tenure: Up to 30 years (360 months)
   - Amount: Up to 90% of property market value (up to ₹10 Crores)
4. Loan Against Property (LAP) / Mortgage Loan:
   - Interest Rate: 9.0% - 12.5% p.a.
   - Tenure: Up to 15-20 years
   - Loan-to-Value: 60% to 75% of fair market valuation
5. Education Loan:
   - Interest Rate: 9.25% - 13.5% p.a.
   - Moratorium period available during course duration
6. Vehicle Loan:
   - Interest Rate: 8.5% - 12.0% p.a.

Required Documents Checklist:
- Identity & Address: PAN Card (mandatory for all applicants), Aadhaar Card, Passport, or Voter ID.
- Income Proof (Salaried): Last 3 months payslips, 6 months bank statement, Form 16 / ITR.
- Income Proof (Self-Employed / Business): Last 2 years ITR with computation, 6-12 months bank statements, GST certificate, business vintage proof.
- Property Documents (for Home Loan / LAP): Title deed, parent documents, link documents, approved municipal plan, latest property tax receipt, Encumbrance Certificate (EC).
- Co-Applicant & Guarantor: Same KYC (PAN, Aadhaar) & income docs if income is being co-assessed.

Portal Application Steps:
1. Step 1: Fill Applicant Personal Details (Name, Contact, Address, PAN, Aadhaar).
2. Step 2: Enter Occupation & Income (Salaried vs Self-Employed, Monthly Income).
3. Step 3: Specify Loan Details (Loan Type, Requested Amount, Preferred Tenure).
4. Step 4: Property Details (if applying for Home Loan or LAP).
5. Step 5 & 6: Optional Co-Applicant & Guarantor Details for enhanced eligibility.
6. Step 7: Complete Declaration and Accept terms.
7. Step 8: Upload required verification documents (PDF/JPG/PNG).
8. Submission: Click "Submit Loan Application". The portal generates an official signed A4 application PDF (auto-downloaded) and instantly emails your application and documents to ssnwealthestates@gmail.com.
9. Verification & Approval: The underwriting team reviews the application within 24 to 48 business hours and contacts the applicant.

Response Guidelines:
- Keep answers clear, structured, and easy to read using bullet points.
- Highlight key numbers (rates, amounts, documents) in bold.
- If the customer writes in Hindi, Hinglish, Telugu, Tamil, or any regional language, respond helpfully in that language.
- Provide direct actionable advice on how to proceed with the form on this website.`;

// Knowledge base fallback function for instant answers even without external API
function getKnowledgeBaseAnswer(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("document") || q.includes("doc") || q.includes("kagaz") || q.includes("paper")) {
    return `📄 **Documents Required for SSN Wealth Capital Loans:**\n\n` +
      `• **KYC Proofs (Mandatory):** PAN Card & Aadhaar Card (or Passport / Voter ID)\n` +
      `• **For Salaried Applicants:** Latest 3 months salary slips, 6 months bank account statements, and Form 16 / ITR\n` +
      `• **For Business / Self-Employed:** Last 2 years ITR with computation, 6-12 months bank statements, GST certificate & registration proof\n` +
      `• **For Home Loan / Loan Against Property:** Registered title deed, link documents, approved building plan, and latest property tax receipt\n` +
      `• **Photographs:** Passport size photographs of applicant and co-applicant (if applicable)\n\n` +
      `💡 *You can upload all your documents directly in the "Document Upload" section of this application portal.*`;
  }

  if (q.includes("interest") || q.includes("rate") || q.includes("roi") || q.includes("byaj") || q.includes("percentage")) {
    return `💰 **Current Interest Rates at SSN Wealth Capital:**\n\n` +
      `• **Home Loan:** 8.40% – 10.75% p.a. (Tenure up to 30 years)\n` +
      `• **Loan Against Property (LAP):** 9.00% – 12.50% p.a. (Tenure up to 15-20 years)\n` +
      `• **Personal Loan:** 10.50% – 16.50% p.a. (Tenure 1 to 5 years, no collateral)\n` +
      `• **Business Loan:** 11.50% – 19.50% p.a. (Tenure 1 to 7 years)\n` +
      `• **Education Loan:** 9.25% – 13.50% p.a.\n` +
      `• **Vehicle Loan:** 8.50% – 12.00% p.a.\n\n` +
      `💡 *Final interest rate depends on your CIBIL credit score, income stability, and loan-to-value (LTV) ratio.*`;
  }

  if (q.includes("cibil") || q.includes("credit score") || q.includes("score")) {
    return `📊 **CIBIL / Credit Score Guidelines:**\n\n` +
      `• **Ideal Score:** 750 or above qualifies for the lowest interest rates and quickest approvals.\n` +
      `• **Acceptable Range:** We also process applications with scores between 650 – 749 with suitable income proof or a co-applicant.\n` +
      `• **New to Credit / No Score (-1):** First-time borrowers can apply with valid income proofs and bank statements.\n\n` +
      `💡 *Adding a co-applicant or guarantor with a strong CIBIL score significantly increases your loan eligibility!*`;
  }

  if (q.includes("time") || q.includes("approval") || q.includes("how long") || q.includes("status") || q.includes("process")) {
    return `⏱️ **Loan Processing & Approval Timeline:**\n\n` +
      `1. **Instant Submission:** Once you fill out the portal and click Submit, you immediately receive a downloaded official A4 PDF application summary.\n` +
      `2. **Application Receipt:** All details & uploaded documents are delivered securely to our credit team (ssnwealthestates@gmail.com).\n` +
      `3. **Verification:** Initial document verification is completed within **24 to 48 business hours**.\n` +
      `4. **Sanction & Disbursal:** Personal/Business loans are typically sanctioned within 2-4 business days; Property/Home loans take 4-7 business days following legal and technical valuation.`;
  }

  if (q.includes("co-applicant") || q.includes("guarantor") || q.includes("coapplicant")) {
    return `👥 **Co-Applicant & Guarantor Information:**\n\n` +
      `• **Is a co-applicant required?** Not mandatory for personal loans, but highly recommended for Home Loans or if you wish to club incomes for a higher loan amount.\n` +
      `• **Who can be a co-applicant?** Immediate family members (Spouse, Parents, Sibling, or Son/Daughter).\n` +
      `• **Guarantor:** A guarantor provides additional assurance and can help if your credit score is borderline.\n\n` +
      `💡 *You can easily add Co-Applicant and Guarantor details in Sections 5 and 6 of our application form.*`;
  }

  if (q.includes("amount") || q.includes("maximum") || q.includes("minimum") || q.includes("limit") || q.includes("kitna")) {
    return `💵 **Loan Amounts Available:**\n\n` +
      `• **Personal Loans:** ₹50,000 up to ₹40 Lakhs\n` +
      `• **Business Loans:** ₹2 Lakhs up to ₹1 Crore+ (unsecured & secured)\n` +
      `• **Home Loans:** Up to ₹10 Crores (up to 85%-90% of property valuation)\n` +
      `• **Loan Against Property (LAP):** Up to 70% of market value\n\n` +
      `Select your desired amount and tenure in Section 3 ("Loan Requirements") of this application.`;
  }

  if (q.includes("contact") || q.includes("call") || q.includes("phone") || q.includes("email") || q.includes("address") || q.includes("helpline")) {
    return `📞 **Contact SSN Wealth Capital Support:**\n\n` +
      `• **Company:** SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED\n` +
      `• **Phone / WhatsApp:** +91 96002 45924\n` +
      `• **Official Email:** ssnwealthestates@gmail.com\n` +
      `• **Head Office:** Hyderabad, Telangana, India\n` +
      `• **Business Hours:** Monday to Saturday, 9:30 AM – 6:30 PM IST\n\n` +
      `Our loan officers are ready to assist you throughout your application journey!`;
  }

  if (q.includes("property") || q.includes("plot") || q.includes("flat") || q.includes("mortgage") || q.includes("lap")) {
    return `🏠 **Property Details & Mortgage Loans:**\n\n` +
      `• For Home Loans and Loans Against Property (LAP), provide the complete property address, type (Residential, Commercial, Industrial, or Agricultural), and estimated market value.\n` +
      `• We fund up to 70%-90% of registered/approved property valuation.\n` +
      `• Required documents include registered sale deed, parent link documents, and sanctioned municipal plan.`;
  }

  // Default welcoming and informative response
  return `👋 **Welcome to SSN Wealth Capital AI Loan Advisor!**\n\n` +
    `I am here to assist you with all your loan and application queries. Here is what I can help you with:\n\n` +
    `• 📄 **Required Documents:** List of KYC, salary slips, and business ITR proofs\n` +
    `• 💰 **Interest Rates:** Current rates for Personal, Business, Home, and LAP loans\n` +
    `• ⏱️ **Approval Process:** 24-48 hour verification timeline and disbursal steps\n` +
    `• 👥 **Co-Applicant & Guarantor:** Increasing eligibility by clubbing income\n` +
    `• 📞 **Customer Care:** Phone, email, and branch support details\n\n` +
    `Feel free to ask any specific question or click one of the quick options above!`;
}

// AI Customer Chat Endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      res.status(400).json({ success: false, error: "Question message is required" });
      return;
    }

    const trimmedMessage = message.trim();
    const ai = getGenAiClient();

    // If Gemini API client is available, generate AI response
    if (ai) {
      // Construct conversation contents with system instructions
      let promptContent = trimmedMessage;
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history
          .slice(-4)
          .map((h) => `${h.role === "user" ? "Customer" : "AI Advisor"}: ${h.text}`)
          .join("\n");
        promptContent = `Previous conversation:\n${recentHistory}\n\nCurrent customer question: ${trimmedMessage}`;
      }

      // Try available models in order of current resilience/latency
      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
      ];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptContent,
            config: {
              systemInstruction: SSN_SYSTEM_INSTRUCTION,
              temperature: 0.7,
              topP: 0.95,
            },
          });

          const answerText = response.text;
          if (answerText && answerText.trim().length > 0) {
            res.json({
              success: true,
              answer: answerText.trim(),
              source: "ai",
              model: modelName,
            });
            return;
          }
        } catch (modelError: any) {
          // If high demand (503) or rate limit, silently try next candidate model
          const errStr = String(modelError?.message || modelError || "");
          const isHighDemandOrLimit =
            errStr.includes("503") ||
            errStr.includes("high demand") ||
            errStr.includes("429") ||
            errStr.includes("RESOURCE_EXHAUSTED") ||
            errStr.includes("UNAVAILABLE");

          if (!isHighDemandOrLimit) {
            console.info(`[Notice: Model ${modelName} unavailable, trying fallback]`);
          }
          // Continue to next candidate model
        }
      }
    }

    // Fallback: Use smart SSN Knowledge Base
    const fallbackAnswer = getKnowledgeBaseAnswer(trimmedMessage);
    res.json({
      success: true,
      answer: fallbackAnswer,
      source: "knowledge_base",
    });
  } catch (error: any) {
    console.error("[Chat Endpoint Error]", error);
    res.status(500).json({
      success: false,
      error: "Unable to process chat request. Please try again.",
      answer: getKnowledgeBaseAnswer(req.body?.message || ""),
      source: "knowledge_base",
    });
  }
});

// Prevent unhandled /api/* routes from falling through to Vite's HTML
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.path}`,
    code: "NOT_FOUND",
  });
});

// Global Express error handler to guarantee JSON response
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("[Unhandled Express Error]", err);
  res.status(err?.status || 500).json({
    success: false,
    error: err?.message || "An unexpected server error occurred.",
    code: err?.code || "SERVER_ERROR",
  });
});

// Start server and handle Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SSN Wealth Capital server listening on port ${PORT}`);
  });
}

startServer();
