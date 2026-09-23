import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PaymentReceipt } from "../types";
import { getLogoPngDataUrl } from "./logoAsset";

export interface GeneratedReceiptPdfResult {
  doc: jsPDF;
  blob: Blob;
  dataUri: string;
  filename: string;
  buffer?: Buffer;
}

/**
 * Converts a positive number into Indian currency words.
 * Example: 5000 -> "Five Thousand Rupees Only"
 */
export function convertNumberToIndianWords(num: number): string {
  if (isNaN(num) || num <= 0) return "Zero Rupees Only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = inWords(integerPart) + " Rupees";
  if (decimalPart > 0) {
    result += " and " + inWords(decimalPart) + " Paise";
  }
  return result + " Only";
}

/**
 * Generates an official, high-resolution A4 Payment Receipt PDF for SSN Wealth Capital.
 */
export async function generatePaymentReceiptPdf(
  receipt: PaymentReceipt,
  customLogoDataUri?: string
): Promise<GeneratedReceiptPdfResult> {
  const logo = customLogoDataUri || (await getLogoPngDataUrl());

  // A4 dimensions in mm: 210 x 297
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  type RGBColor = [number, number, number];
  const navyDark: RGBColor = [11, 25, 44]; // #0B192C
  const navyMedium: RGBColor = [30, 62, 98]; // #1E3E62
  const goldPrimary: RGBColor = [212, 175, 55]; // #D4AF37
  const emeraldSuccess: RGBColor = [16, 130, 64];
  const crimsonFail: RGBColor = [220, 38, 38];
  const textDark: RGBColor = [15, 23, 42];
  const textMuted: RGBColor = [100, 116, 139];
  const bgSoft: RGBColor = [248, 250, 252];
  const borderSoft: RGBColor = [226, 232, 240];

  const isSuccess = receipt.status === "PAYMENT SUCCESSFUL";

  // 1. Top Decorative Header Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Gold Accent Stripe
  doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.rect(0, 42, pageWidth, 2.5, "F");

  // Official Logo Container
  const logoBoxX = margin;
  const logoBoxY = 6;
  const logoBoxW = 30;
  const logoBoxH = 30;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 2, 2, "F");
  doc.setDrawColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, 2, 2, "S");

  if (logo) {
    try {
      doc.addImage(
        logo,
        "PNG",
        logoBoxX + 1.5,
        logoBoxY + 1.5,
        logoBoxW - 3,
        logoBoxH - 3
      );
    } catch {
      // ignore logo embed error
    }
  }

  // Header Typography
  const headerTextX = margin + logoBoxW + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED", headerTextX, 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.text("SSN WEALTH CAPITAL", headerTextX, 20.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 242);
  doc.text("Your Trusted Financial Partner", headerTextX, 26);

  doc.setFontSize(8);
  doc.setTextColor(190, 205, 225);
  doc.text(
    "Phone: +91 9600245924  |  Email: ssnwealthestates@gmail.com",
    headerTextX,
    31.5
  );
  doc.text(
    "Authorized Electronic Payment Collection Receipt  |  Secure NBFC Portal",
    headerTextX,
    36.5
  );

  let currentY = 51;

  // 2. Receipt Title & Status Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("PAYMENT RECEIPT", margin, currentY);

  // Status Badge (Right aligned)
  const badgeW = 68;
  const badgeH = 9.5;
  const badgeX = pageWidth - margin - badgeW;
  const badgeY = currentY - 7;

  if (isSuccess) {
    doc.setFillColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("✔  PAYMENT SUCCESSFUL", badgeX + badgeW / 2, badgeY + 6.3, {
      align: "center",
    });
  } else {
    doc.setFillColor(crimsonFail[0], crimsonFail[1], crimsonFail[2]);
    doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("✖  PAYMENT FAILED", badgeX + badgeW / 2, badgeY + 6.3, {
      align: "center",
    });
  }

  currentY += 8;

  // 3. Highlighted Metric Card (Receipt No, Date, Amount)
  const metricCardY = currentY;
  const metricCardH = 24;

  doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
  doc.roundedRect(margin, metricCardY, contentWidth, metricCardH, 2, 2, "F");
  doc.setDrawColor(borderSoft[0], borderSoft[1], borderSoft[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, metricCardY, contentWidth, metricCardH, 2, 2, "S");

  // Left Section: Receipt No
  const col1X = margin + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("RECEIPT NUMBER", col1X, metricCardY + 6.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(receipt.receiptNumber || "SSN-REC-2026-000000", col1X, metricCardY + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Official Computer-Generated Receipt", col1X, metricCardY + 18.5);

  // Center Section: Payment Date & Time
  const col2X = margin + 65;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("PAYMENT DATE & TIME", col2X, metricCardY + 6.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(receipt.paymentDate || new Date().toLocaleString("en-IN"), col2X, metricCardY + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Indian Standard Time (IST)", col2X, metricCardY + 18.5);

  // Right Section: Amount Paid
  const col3X = pageWidth - margin - 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("AMOUNT PAID", col3X, metricCardY + 6.5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(isSuccess ? emeraldSuccess[0] : crimsonFail[0], isSuccess ? emeraldSuccess[1] : crimsonFail[1], isSuccess ? emeraldSuccess[2] : crimsonFail[2]);
  const formattedAmt = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(receipt.amount) || 0);
  doc.text(formattedAmt, col3X, metricCardY + 13.5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(isSuccess ? emeraldSuccess[0] : crimsonFail[0], isSuccess ? emeraldSuccess[1] : crimsonFail[1], isSuccess ? emeraldSuccess[2] : crimsonFail[2]);
  doc.text(isSuccess ? "VERIFIED & SETTLED" : "FAILED / UNPAID", col3X, metricCardY + 18.5, {
    align: "right",
  });

  currentY += metricCardH + 7;

  // 4. Two Details Blocks: Customer Info & Payment Details
  const blockW = (contentWidth - 6) / 2;
  const blockH = 46;

  // Left Block: Customer Details
  const leftBlockX = margin;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(leftBlockX, currentY, blockW, blockH, 2, 2, "F");
  doc.setDrawColor(borderSoft[0], borderSoft[1], borderSoft[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftBlockX, currentY, blockW, blockH, 2, 2, "S");

  // Left Block Header
  doc.setFillColor(navyMedium[0], navyMedium[1], navyMedium[2]);
  doc.roundedRect(leftBlockX, currentY, blockW, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("CUSTOMER & LOAN DETAILS", leftBlockX + 4, currentY + 4.8);

  // Left Block Fields
  const drawField = (
    label: string,
    value: string,
    x: number,
    y: number,
    highlight: boolean = false
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(label, x, y);

    doc.setFont("helvetica", highlight ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(highlight ? navyDark[0] : textDark[0], highlight ? navyDark[1] : textDark[1], highlight ? navyDark[2] : textDark[2]);
    doc.text(value || "—", x, y + 4.2);
  };

  drawField("Customer Full Name", receipt.customerName, leftBlockX + 4, currentY + 13, true);
  drawField("Application / Loan ID", receipt.applicationId, leftBlockX + 4, currentY + 22, true);
  drawField("Mobile Number", receipt.mobileNumber, leftBlockX + 4, currentY + 31);
  drawField("Email Address", receipt.email, leftBlockX + 4, currentY + 40);

  // Right Block: Gateway & Transaction Details
  const rightBlockX = margin + blockW + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightBlockX, currentY, blockW, blockH, 2, 2, "F");
  doc.setDrawColor(borderSoft[0], borderSoft[1], borderSoft[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(rightBlockX, currentY, blockW, blockH, 2, 2, "S");

  // Right Block Header
  doc.setFillColor(navyMedium[0], navyMedium[1], navyMedium[2]);
  doc.roundedRect(rightBlockX, currentY, blockW, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TRANSACTION & GATEWAY DETAILS", rightBlockX + 4, currentY + 4.8);

  drawField("Payment Purpose", receipt.paymentPurpose, rightBlockX + 4, currentY + 13, true);
  drawField(
    "Gateway Transaction ID",
    receipt.transactionId || "N/A",
    rightBlockX + 4,
    currentY + 22,
    true
  );
  drawField("Gateway Order ID", receipt.orderId || "N/A", rightBlockX + 4, currentY + 31);
  drawField(
    "Payment Mode",
    receipt.paymentMethod || "UPI / Net Banking / Card",
    rightBlockX + 4,
    currentY + 40
  );

  currentY += blockH + 7;

  // 5. Itemized Breakdown Table using autoTable
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("PAYMENT BREAKDOWN & PARTICULARS", margin, currentY);

  currentY += 3;

  const tableBody = [
    [
      "1",
      `${receipt.paymentPurpose} - Application Ref: ${receipt.applicationId}`,
      receipt.remarks ? `Remarks: ${receipt.remarks}` : "Verified via Secure Online Gateway",
      formattedAmt,
    ],
  ];

  const runAutoTable =
    typeof autoTable === "function"
      ? autoTable
      : (autoTable as any)?.default || autoTable;

  runAutoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: "grid",
    head: [["S.No", "Description / Purpose", "Payment Reference / Remarks", "Amount (INR)"]],
    body: tableBody,
    headStyles: {
      fillColor: [navyDark[0], navyDark[1], navyDark[2]],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 64 },
      3: { cellWidth: 34, halign: "right", fontStyle: "bold" },
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [textDark[0], textDark[1], textDark[2]],
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: [bgSoft[0], bgSoft[1], bgSoft[2]],
    },
  });

  const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 25;
  currentY = finalTableY + 4;

  // Total Summary Row
  const summaryBoxW = 75;
  const summaryBoxX = pageWidth - margin - summaryBoxW;
  const summaryBoxH = 14;

  doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
  doc.rect(summaryBoxX, currentY, summaryBoxW, summaryBoxH, "F");
  doc.setDrawColor(borderSoft[0], borderSoft[1], borderSoft[2]);
  doc.rect(summaryBoxX, currentY, summaryBoxW, summaryBoxH, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("Total Paid Amount:", summaryBoxX + 4, currentY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(isSuccess ? emeraldSuccess[0] : crimsonFail[0], isSuccess ? emeraldSuccess[1] : crimsonFail[1], isSuccess ? emeraldSuccess[2] : crimsonFail[2]);
  doc.text(formattedAmt, summaryBoxX + summaryBoxW - 4, currentY + 5.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("(Inclusive of all applicable taxes & charges)", summaryBoxX + 4, currentY + 10.5);

  currentY += summaryBoxH + 4;

  // Amount in Words Box
  const wordsBoxH = 11;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, wordsBoxH, 1.5, 1.5, "F");
  doc.setDrawColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, wordsBoxH, 1.5, 1.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("Amount in Words:", margin + 4, currentY + 4.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const words = receipt.amountInWords || convertNumberToIndianWords(Number(receipt.amount) || 0);
  doc.text(words, margin + 35, currentY + 4.5);

  currentY += wordsBoxH + 8;

  // 6. Security, Terms & Authorized Stamp Block
  const footerBoxH = 36;
  doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
  doc.roundedRect(margin, currentY, contentWidth, footerBoxH, 2, 2, "F");
  doc.setDrawColor(borderSoft[0], borderSoft[1], borderSoft[2]);
  doc.roundedRect(margin, currentY, contentWidth, footerBoxH, 2, 2, "S");

  // Left Sub-block: Terms & Electronic verification note
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("IMPORTANT TERMS & CONDITIONS:", margin + 4, currentY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const terms = [
    "1. This is a computer-generated official receipt issued by SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED.",
    "2. Official Verified Razorpay Merchant Page: https://razorpay.me/@ssnwealthampestatesopcprivate",
    "3. All payments are subject to electronic clearing and real-time merchant gateway reconciliation.",
    "4. Fees paid towards processing or documentation are as per agreed terms and NBFC guidelines.",
    "5. For any queries, please quote the Receipt Number and Application ID to ssnwealthestates@gmail.com.",
  ];
  terms.forEach((line, idx) => {
    doc.text(line, margin + 4, currentY + 10 + idx * 3.8);
  });

  // Right Sub-block: Authorized Electronic Stamp & Signatory
  const stampBoxX = pageWidth - margin - 58;
  doc.setDrawColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.setLineWidth(0.5);
  doc.rect(stampBoxX, currentY + 3, 54, 30, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("SSN WEALTH & ESTATES (OPC) PVT LTD", stampBoxX + 27, currentY + 7.5, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(emeraldSuccess[0], emeraldSuccess[1], emeraldSuccess[2]);
  doc.text("★ ELECTRONICALLY VERIFIED ★", stampBoxX + 27, currentY + 14, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Payment Gateway Authenticated", stampBoxX + 27, currentY + 19, {
    align: "center",
  });
  doc.text("No Physical Signature Required", stampBoxX + 27, currentY + 23, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("Accounts & Disbursement Dept.", stampBoxX + 27, currentY + 28.5, {
    align: "center",
  });

  // 7. Page Bottom Watermark & Branding
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    "SSN WEALTH CAPITAL  •  SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED  •  Official Payment Gateway System",
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" }
  );

  const cleanReceiptNum = (receipt.receiptNumber || "SSN-REC").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${cleanReceiptNum}_${receipt.applicationId || "Receipt"}.pdf`;

  const blob = doc.output("blob");
  const dataUri = doc.output("datauristring");

  let buffer: Buffer | undefined;
  if (typeof Buffer !== "undefined") {
    try {
      buffer = Buffer.from(doc.output("arraybuffer"));
    } catch {
      // ignore
    }
  }

  return {
    doc,
    blob,
    dataUri,
    filename,
    buffer,
  };
}
