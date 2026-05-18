import "server-only";

import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { prisma } from "@/lib/db/prisma";

const purple = {
  border: rgb(0.78, 0.68, 0.92),
  brand: rgb(0.42, 0.18, 0.62),
  brandLight: rgb(0.55, 0.35, 0.75),
  accent: rgb(0.5, 0.32, 0.72),
  ink: rgb(0.12, 0.12, 0.14),
  muted: rgb(0.45, 0.45, 0.5),
  white: rgb(1, 1, 1)
};

export function formatCertificateDate(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatCertificateDateShort(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }
  const d = new Date(value);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function buildCertificateNumber(enrollmentId: string) {
  return `TAS-${new Date().getFullYear()}-${enrollmentId.slice(-10).toUpperCase()}`;
}

export async function ensureEnrollmentCertificateNumber(enrollmentId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId }
  });

  if (!enrollment) {
    return null;
  }

  const fallback = buildCertificateNumber(enrollmentId);
  const existing = (enrollment as { certificateNumber?: string | null }).certificateNumber;
  if (existing) {
    return existing;
  }

  try {
    const updated = await prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: { certificateNumber: fallback } as { certificateNumber: string }
    });
    return (updated as { certificateNumber?: string | null }).certificateNumber ?? fallback;
  } catch {
    return fallback;
  }
}

export type CertificatePdfInput = {
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  instructorName: string;
  certificateNumber: string;
  enrolledAt: Date;
  completedAt: Date;
  verifyUrl: string;
};

function tw(text: string, size: number, font: PDFFont) {
  return font.widthOfTextAtSize(text, size);
}

function cx(text: string, size: number, font: PDFFont, pageWidth: number) {
  return (pageWidth - tw(text, size, font)) / 2;
}

function wrapLines(text: string, maxWidth: number, size: number, font: PDFFont) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (tw(candidate, size, font) <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [text];
}

function truncateEmail(email: string, maxLen = 48) {
  if (email.length <= maxLen) {
    return email;
  }
  const [local, domain] = email.split("@");
  if (!domain) {
    return `${email.slice(0, maxLen - 3)}...`;
  }
  const keep = Math.max(8, maxLen - domain.length - 4);
  return `${local.slice(0, keep)}...@${domain}`;
}

function drawFrame(page: PDFPage, width: number, height: number) {
  const border = 14;
  page.drawRectangle({ x: 0, y: 0, width, height, color: purple.border });

  page.drawRectangle({
    x: border,
    y: border,
    width: width - border * 2,
    height: height - border * 2,
    color: purple.white
  });
}

function drawBrandHeader(page: PDFPage, x: number, y: number, fontBold: PDFFont, font: PDFFont) {
  page.drawRectangle({
    x,
    y: y - 6,
    width: 44,
    height: 44,
    color: purple.brand
  });

  page.drawText("AI", {
    x: x + 11,
    y: y + 8,
    size: 16,
    font: fontBold,
    color: purple.white
  });

  page.drawText("TheAiStack", {
    x: x + 54,
    y: y + 22,
    size: 18,
    font: fontBold,
    color: purple.ink
  });

  page.drawText("AI Learning Platform", {
    x: x + 54,
    y: y + 6,
    size: 10,
    font,
    color: purple.accent
  });
}

function pillWidth(text: string, font: PDFFont) {
  return tw(text, 9, font) + 28;
}

function drawPill(page: PDFPage, text: string, x: number, y: number, font: PDFFont) {
  const padX = 14;
  const w = pillWidth(text, font);
  const h = 22;
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: purple.ink,
    borderWidth: 1,
    color: purple.white
  });
  page.drawText(text, { x: x + padX, y: y + 7, size: 9, font, color: purple.ink });
}

function drawCenteredPillRow(
  page: PDFPage,
  labels: string[],
  centerY: number,
  pageWidth: number,
  font: PDFFont,
  gap = 14
) {
  const widths = labels.map((label) => pillWidth(label, font));
  const totalWidth = widths.reduce((sum, w) => sum + w, 0) + gap * (labels.length - 1);
  let x = (pageWidth - totalWidth) / 2;

  for (const [index, label] of labels.entries()) {
    drawPill(page, label, x, centerY, font);
    x += widths[index]! + gap;
  }
}

export async function generateCourseCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  drawFrame(page, width, height);

  const innerX = 72;
  const innerRight = width - innerX;
  const innerTop = height - 48;
  const footerY = 94;

  drawBrandHeader(page, innerX, innerTop - 20, fontBold, font);

  const verifiedLabel = "Verified completion";
  page.drawText(verifiedLabel, {
    x: innerRight - tw(verifiedLabel, 10, font),
    y: innerTop - 18,
    size: 10,
    font,
    color: purple.accent
  });

  let y = height - 148;

  const title = "CERTIFICATE OF COMPLETION";
  page.drawText(title, {
    x: cx(title, 32, fontSerifBold, width),
    y,
    size: 32,
    font: fontSerifBold,
    color: purple.ink
  });

  y -= 28;
  const subtitle = "– ONLINE LEARNING –";
  page.drawText(subtitle, {
    x: cx(subtitle, 14, fontBold, width),
    y,
    size: 14,
    font: fontBold,
    color: purple.ink
  });

  y -= 52;
  const intro = "Proudly presented to";
  page.drawText(intro, {
    x: cx(intro, 13, fontSerif, width),
    y,
    size: 13,
    font: fontSerif,
    color: purple.muted
  });

  y -= 30;
  page.drawText(input.recipientName, {
    x: cx(input.recipientName, 22, fontSerifBold, width),
    y,
    size: 22,
    font: fontSerifBold,
    color: purple.ink
  });

  y -= 22;
  const email = truncateEmail(input.recipientEmail, 50);
  page.drawText(email, {
    x: cx(email, 10, font, width),
    y,
    size: 10,
    font,
    color: purple.accent
  });

  y -= 32;
  const mid = "for successfully completing";
  page.drawText(mid, {
    x: cx(mid, 12, fontSerif, width),
    y,
    size: 12,
    font: fontSerif,
    color: purple.muted
  });

  y -= 28;
  const courseLines = wrapLines(input.courseTitle, width - 120, 17, fontSerifBold);
  for (const line of courseLines.slice(0, 2)) {
    page.drawText(line, {
      x: cx(line, 17, fontSerifBold, width),
      y,
      size: 17,
      font: fontSerifBold,
      color: purple.brand
    });
    y -= 24;
  }

  y -= 8;
  const collab = `Instructor: ${input.instructorName}`;
  page.drawText(collab, {
    x: cx(collab, 11, fontItalic, width),
    y,
    size: 11,
    font: fontItalic,
    color: purple.brandLight
  });

  y -= 40;
  const credLabel = "Course credentials";
  page.drawText(credLabel, {
    x: cx(credLabel, 10, fontBold, width),
    y,
    size: 10,
    font: fontBold,
    color: purple.muted
  });

  y -= 28;
  drawCenteredPillRow(page, ["Certified Course", "TheAiStack"], y, width, font);

  page.drawText(`Enrolled: ${formatCertificateDateShort(input.enrolledAt)}`, {
    x: innerX,
    y: footerY + 14,
    size: 9,
    font,
    color: purple.muted
  });
  page.drawText(`Completed: ${formatCertificateDateShort(input.completedAt)}`, {
    x: innerX,
    y: footerY,
    size: 9,
    font,
    color: purple.muted
  });
  page.drawText(`Certificate ID: ${input.certificateNumber}`, {
    x: innerX,
    y: footerY - 14,
    size: 9,
    font,
    color: purple.muted
  });

  const sigX = width / 2 - 90;
  page.drawLine({
    start: { x: sigX, y: footerY + 8 },
    end: { x: sigX + 180, y: footerY + 8 },
    thickness: 1,
    color: purple.ink
  });
  const sigName = input.instructorName;
  page.drawText(sigName, {
    x: sigX + 90 - tw(sigName, 10, fontSerif) / 2,
    y: footerY - 6,
    size: 10,
    font: fontSerif,
    color: purple.ink
  });
  const sigTitle = "Course Instructor · TheAiStack";
  page.drawText(sigTitle, {
    x: sigX + 90 - tw(sigTitle, 8, font) / 2,
    y: footerY - 18,
    size: 8,
    font,
    color: purple.muted
  });

  const qrPng = await QRCode.toBuffer(input.verifyUrl, {
    type: "png",
    margin: 1,
    width: 180,
    color: { dark: "#3b1d5c", light: "#ffffff" }
  });
  const qrImage = await pdfDoc.embedPng(qrPng);
  const qrSize = 58;
  const qrX = innerRight - qrSize;
  const qrY = footerY - 6;
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  page.drawText("Verify", {
    x: qrX + qrSize / 2 - tw("Verify", 7, font) / 2,
    y: qrY - 12,
    size: 7,
    font,
    color: purple.muted
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export function getCertificateVerifyUrl(certificateNumber: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/courses?certificate=${encodeURIComponent(certificateNumber)}`;
}
