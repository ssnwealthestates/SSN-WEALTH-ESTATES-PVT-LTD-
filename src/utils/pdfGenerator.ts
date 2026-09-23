import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LoanApplicationFormData, UploadedDocument, DOCUMENT_DEFINITIONS } from "../types";
import { getLogoPngDataUrl } from "./logoAsset";

export interface GeneratedPdfResult {
  doc: jsPDF;
  blob: Blob;
  dataUri: string;
  filename: string;
}

export async function generateLoanApplicationPdf(
  applicationId: string,
  formData: LoanApplicationFormData,
  documents: UploadedDocument[],
  submissionDate: Date = new Date(),
  customLogoDataUri?: string
): Promise<GeneratedPdfResult> {
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

  // Corporate Colors
  type RGBColor = [number, number, number];
  const navyDark: RGBColor = [11, 25, 44]; // #0B192C
  const navyMedium: RGBColor = [30, 62, 98]; // #1E3E62
  const goldPrimary: RGBColor = [212, 175, 55]; // #D4AF37
  const grayBg: RGBColor = [248, 250, 252];
  const grayBorder: RGBColor = [226, 232, 240];
  const textDark: RGBColor = [15, 23, 42];
  const textGreen: RGBColor = [16, 120, 60];
  const textRed: RGBColor = [180, 40, 40];
  const textMuted: RGBColor = [100, 116, 139];
  const textAmber: RGBColor = [180, 83, 9];
  const textWhite: RGBColor = [255, 255, 255];

  const formattedDate = submissionDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formattedTime = submissionDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  let currentY = 12;

  // Header Banner Background
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Gold Accent Bar under Header
  doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.rect(0, 42, pageWidth, 2.5, "F");

  // Official Corporate Logo Card
  const logoCardX = margin;
  const logoCardY = 5;
  const logoCardW = 32;
  const logoCardH = 32;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(logoCardX, logoCardY, logoCardW, logoCardH, 2, 2, "F");
  doc.setDrawColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(logoCardX, logoCardY, logoCardW, logoCardH, 2, 2, "S");

  if (logo) {
    try {
      doc.addImage(
        logo,
        "PNG",
        logoCardX + 1.5,
        logoCardY + 1.5,
        logoCardW - 3,
        logoCardH - 3
      );
    } catch (err) {
      console.warn("Could not embed header logo:", err);
    }
  }

  // Company Name & Subtitles in Header (Positioned to the right of logo)
  const textX = margin + logoCardW + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(245, 208, 100); // Light Metallic Gold
  doc.text("SSN WEALTH & ESTATES (OPC) PVT LTD", textX, 11);

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("SSN WEALTH CAPITAL", textX, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text("Your Trusted Financial Partner", textX, 25);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "Mettupalayam Rd, Near Mettur Super Service, Annur – 641653",
    textX,
    31
  );
  doc.text(
    "Email: ssnwealthestates@gmail.com  |  Phone: 9600245924",
    textX,
    36
  );

  // Right Badge: Application ID Box
  doc.setFillColor(30, 62, 98);
  doc.roundedRect(pageWidth - margin - 58, 8, 58, 28, 2, 2, "F");
  doc.setDrawColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(pageWidth - margin - 58, 8, 58, 28, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text("APPLICATION ID", pageWidth - margin - 54, 15);

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(applicationId, pageWidth - margin - 54, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${formattedDate}`, pageWidth - margin - 54, 28);
  doc.text(`Time: ${formattedTime}`, pageWidth - margin - 54, 33);

  currentY = 48;

  // Title Box: "LOAN APPLICATION FORM"
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, "F");
  doc.setDrawColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("LOAN APPLICATION FORM", pageWidth / 2, currentY + 7.5, {
    align: "center",
  });

  currentY += 16;

  // Helper function to draw Section Header
  const drawSectionHeader = (title: string, yPos: number) => {
    doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.rect(margin, yPos, contentWidth, 6.5, "F");
    doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
    doc.rect(margin, yPos + 6.5, contentWidth, 0.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 3, yPos + 4.8);
    return yPos + 9;
  };

  // 1. APPLICANT DETAILS TABLE
  currentY = drawSectionHeader("1. Applicant Details", currentY);
  const applicantRows = [
    [
      { content: "Full Name", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.applicantFullName || "N/A" },
      { content: "Father / Husband Name", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.fatherHusbandName || "N/A" },
    ],
    [
      { content: "Date of Birth", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.dateOfBirth || "N/A" },
      { content: "Gender", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.gender || "N/A" },
    ],
    [
      { content: "Mobile Number", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.mobileNumber || "N/A" },
      { content: "Alternate Mobile", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.alternateMobileNumber || "N/A" },
    ],
    [
      { content: "Email Address", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.emailAddress || "N/A" },
      { content: "Aadhaar Number", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.aadhaarNumber || "N/A" },
    ],
    [
      { content: "PAN Number", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.panNumber || "N/A" },
      { content: "Village / Town", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.villageTown || "N/A" },
    ],
    [
      { content: "Residential Address", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.residentialAddress || "N/A", colSpan: 3 },
    ],
    [
      { content: "District", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.applicant.district || "N/A" },
      { content: "State & Pincode", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: `${formData.applicant.state || "N/A"} - ${formData.applicant.pincode || "N/A"}` },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: applicantRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textDark,
      lineColor: grayBorder,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 52 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 4;

  // 2. OCCUPATION & INCOME TABLE
  currentY = drawSectionHeader("2. Occupation & Income Details", currentY);
  const occRows = [
    [
      { content: "Occupation / Business", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.occupation.occupationBusiness || "N/A" },
      { content: "Company / Business Name", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.occupation.companyBusinessName || "N/A" },
    ],
    [
      { content: "Monthly Income (Rs.)", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.occupation.monthlyIncome ? `₹ ${formData.occupation.monthlyIncome}` : "N/A" },
      { content: "Other Income (Rs.)", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.occupation.otherIncome ? `₹ ${formData.occupation.otherIncome}` : "Nil / N/A" },
    ],
    [
      { content: "Existing Loan Details", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.occupation.existingLoanDetails || "None" },
      { content: "Current Monthly EMI", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.occupation.monthlyEmi ? `₹ ${formData.occupation.monthlyEmi}` : "Nil" },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: occRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textDark,
      lineColor: grayBorder,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 47 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 4;

  // 3. LOAN DETAILS TABLE
  currentY = drawSectionHeader("3. Loan Requirement Details", currentY);
  const loanTypeDisplay =
    formData.loan.loanType === "Other"
      ? `Other (${formData.loan.loanTypeOther || ""})`
      : formData.loan.loanType || "N/A";

  const loanRows = [
    [
      { content: "Requested Loan Type", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: loanTypeDisplay },
      { content: "Loan Amount Required", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      {
        content: formData.loan.loanAmountRequired
          ? `₹ ${formData.loan.loanAmountRequired}`
          : "N/A",
        styles: { fontStyle: "bold" as const, textColor: textAmber },
      },
    ],
    [
      { content: "Purpose of Loan", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.loan.purposeOfLoan || "N/A" },
      { content: "Preferred Loan Tenure", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.loan.preferredLoanTenure || "N/A" },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: loanRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textDark,
      lineColor: grayBorder,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 47 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 4;

  // Check if we need a page break for property details or keep going
  if (currentY > 215) {
    doc.addPage();
    currentY = 16;
  }

  // 4. PROPERTY DETAILS TABLE
  currentY = drawSectionHeader("4. Property Details (Collateral / Security)", currentY);
  const propTypeDisplay =
    formData.property.propertyType === "Other"
      ? `Other (${formData.property.propertyTypeOther || ""})`
      : formData.property.propertyType || "N/A";

  const propRows = [
    [
      { content: "Property Type", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: propTypeDisplay },
      { content: "Property Location", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.property.propertyLocation || "N/A" },
    ],
    [
      { content: "District", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.property.district || "N/A" },
      { content: "Taluk & Village", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: `${formData.property.taluk || "N/A"} / ${formData.property.village || "N/A"}` },
    ],
    [
      { content: "Survey Number", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.property.surveyNumber || "N/A" },
      { content: "Extent / Area", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.property.extentPropertyArea || "N/A" },
    ],
    [
      { content: "Estimated Value", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      {
        content: formData.property.estimatedPropertyValue
          ? `₹ ${formData.property.estimatedPropertyValue}`
          : "N/A",
        colSpan: 3,
        styles: { fontStyle: "bold" as const },
      },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: propRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textDark,
      lineColor: grayBorder,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 47 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 4;

  // New Page for Co-Applicant, Guarantor, Document Checklist, Declaration, Signature
  doc.addPage();
  currentY = 16;

  // Top bar on page 2
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(margin, currentY, contentWidth, 5.5, "F");
  doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.rect(margin, currentY + 5.5, contentWidth, 0.8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `SSN WEALTH CAPITAL - LOAN APPLICATION (${applicationId}) - CONTINUED`,
    margin + 3,
    currentY + 4
  );
  currentY += 9;

  // 5. CO-APPLICANT & GUARANTOR DETAILS
  currentY = drawSectionHeader("5. Co-Applicant & Guarantor Details", currentY);
  const coAppGuarRows = [
    [
      { content: "Co-Applicant Name", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.coApplicant.coApplicantName || "Not Applicable" },
      { content: "Guarantor Name", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.guarantor.guarantorName || "Not Applicable" },
    ],
    [
      { content: "Relationship", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.coApplicant.relationship || "N/A" },
      { content: "Relationship", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.guarantor.relationship || "N/A" },
    ],
    [
      { content: "Mobile Number", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.coApplicant.mobileNumber || "N/A" },
      { content: "Mobile Number", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      { content: formData.guarantor.mobileNumber || "N/A" },
    ],
    [
      { content: "Occupation & Income", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      {
        content: formData.coApplicant.occupationBusiness
          ? `${formData.coApplicant.occupationBusiness} ${
              formData.coApplicant.monthlyIncome
                ? `(₹ ${formData.coApplicant.monthlyIncome}/mo)`
                : ""
            }`
          : "N/A",
      },
      { content: "Occupation & Address", styles: { fontStyle: "bold" as const, fillColor: grayBg } },
      {
        content: formData.guarantor.occupationBusiness
          ? `${formData.guarantor.occupationBusiness} - ${
              formData.guarantor.address || ""
            }`
          : formData.guarantor.address || "N/A",
      },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    body: coAppGuarRows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: textDark,
      lineColor: grayBorder,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 47 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 4;

  // 6. DOCUMENT CHECKLIST TABLE
  currentY = drawSectionHeader("6. Submitted Document Checklist (Original Files Attached)", currentY);

  const docTableBody = DOCUMENT_DEFINITIONS.map((def, idx) => {
    const uploaded = documents.find((d) => d.key === def.key && d.file !== null);
    const statusText = uploaded
      ? `✓ Attached: ${uploaded.fileName} (${(
          (uploaded.fileSize || 0) /
          (1024 * 1024)
        ).toFixed(2)} MB)`
      : def.isRequired
      ? "Pending Verification"
      : "Not Applicable";

    return [
      { content: `${idx + 1}` },
      { content: def.label.replace(/^\d+\.\s*/, "") },
      {
        content: def.isRequired ? "Mandatory" : "Optional",
        styles: { fontStyle: def.isRequired ? ("bold" as const) : ("normal" as const) },
      },
      {
        content: statusText,
        styles: {
          textColor: uploaded ? textGreen : def.isRequired ? textRed : textMuted,
          fontStyle: uploaded ? ("bold" as const) : ("normal" as const),
        },
      },
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [
      [
        { content: "#", styles: { fillColor: navyMedium, textColor: textWhite, fontStyle: "bold" as const } },
        { content: "Document Name", styles: { fillColor: navyMedium, textColor: textWhite, fontStyle: "bold" as const } },
        { content: "Type", styles: { fillColor: navyMedium, textColor: textWhite, fontStyle: "bold" as const } },
        { content: "Attachment Status", styles: { fillColor: navyMedium, textColor: textWhite, fontStyle: "bold" as const } },
      ],
    ],
    body: docTableBody,
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: textDark,
      lineColor: grayBorder,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 24, halign: "center" },
      3: { cellWidth: 80 },
    },
  });

  // @ts-expect-error autoTable adds lastAutoTable to jsPDF instance
  currentY = doc.lastAutoTable.finalY + 4;

  // 7. DECLARATION & AUTHORIZATION
  currentY = drawSectionHeader("7. Declaration & Authorization", currentY);

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 16, "F");
  doc.setDrawColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
  doc.setLineWidth(0.4);
  doc.rect(margin, currentY, contentWidth, 16, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const declarationText =
    '"I hereby declare that the information provided by me is true and correct to the best of my knowledge. I authorize SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED to verify the information and documents submitted by me for the purpose of processing my loan application."';
  const splitDeclaration = doc.splitTextToSize(declarationText, contentWidth - 8);
  doc.text(splitDeclaration, margin + 4, currentY + 5);

  currentY += 20;

  // 8. SIGNATURE AND VERIFICATION BLOCK
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, 34, 1.5, 1.5, "F");
  doc.setDrawColor(navyMedium[0], navyMedium[1], navyMedium[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 34, 1.5, 1.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);

  doc.text(`Applicant Name: ${formData.declaration.applicantName || formData.applicant.applicantFullName || "______________________"}`, margin + 6, currentY + 8);
  doc.text(`Date: ${formData.declaration.date || formattedDate}`, margin + 6, currentY + 16);
  doc.text(`Place: ${formData.declaration.place || formData.applicant.villageTown || "______________________"}`, margin + 6, currentY + 24);

  // Digital Signature section on right side of signature box
  const sigBoxX = pageWidth - margin - 65;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("Applicant Signature:", sigBoxX, currentY + 8);

  if (formData.declaration.signatureDataUrl) {
    try {
      doc.addImage(
        formData.declaration.signatureDataUrl,
        "PNG",
        sigBoxX,
        currentY + 10,
        55,
        18
      );
    } catch {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(30, 62, 98);
      doc.text(
        `[Signed by: ${formData.declaration.applicantName || formData.applicant.applicantFullName}]`,
        sigBoxX,
        currentY + 20
      );
    }
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(sigBoxX, currentY + 24, sigBoxX + 58, currentY + 24);
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      formData.declaration.applicantName || formData.applicant.applicantFullName || "Authorized Signatory",
      sigBoxX,
      currentY + 28
    );
  }

  // Draw Header & Footers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Top Header with Logo for pages > 1
    if (i > 1) {
      doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
      doc.rect(0, 0, pageWidth, 12, "F");

      doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
      doc.rect(0, 12, pageWidth, 0.8, "F");

      // Mini corporate logo badge in running header
      if (logo) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin, 1.5, 9, 9, 1, 1, "F");
          doc.addImage(logo, "PNG", margin + 0.5, 2, 8, 8);
        } catch {}
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(245, 208, 100);
      doc.text("SSN WEALTH CAPITAL", margin + 12, 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text("Loan Application & Document Record", margin + 12, 10);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(212, 175, 55);
      doc.text(`Ref: ${applicationId}`, pageWidth - margin - 42, 8);
    }

    // Bottom Footer on all pages
    doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.rect(0, pageHeight - 9, pageWidth, 9, "F");

    doc.setFillColor(goldPrimary[0], goldPrimary[1], goldPrimary[2]);
    doc.rect(0, pageHeight - 9.6, pageWidth, 0.6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(245, 208, 100);
    doc.text("SSN WEALTH & ESTATES (OPC) PRIVATE LIMITED", margin, pageHeight - 3.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("|  Your Trusted Financial Partner", margin + 74, pageHeight - 3.5);

    doc.text(
      `Page ${i} of ${totalPages}  |  Ref: ${applicationId}`,
      pageWidth - margin - 35,
      pageHeight - 3.5
    );
  }

  const pdfFilename = `SSN_Loan_Application_${applicationId}.pdf`;
  const blob = doc.output("blob");
  const dataUri = doc.output("datauristring");

  return {
    doc,
    blob,
    dataUri,
    filename: pdfFilename,
  };
}
