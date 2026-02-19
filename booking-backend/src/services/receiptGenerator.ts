import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";
import type PDFKit from "pdfkit";

type PaymentWithDetails = Prisma.PaymentGetPayload<{
  include: {
    booking: {
      include: {
        guest: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            email: true;
          };
        };
        property: {
          select: {
            id: true;
            title: true;
            address: true;
            city: true;
            state: true;
            country: true;
          };
        };
      };
    };
  };
}>;

const BRAND_PRIMARY = "#1e3a8a";
const BRAND_ACCENT = "#2563eb";
const TEXT_DARK = "#111827";
const TEXT_MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const SURFACE = "#f8fafc";
const SUCCESS_BG = "#dcfce7";
const SUCCESS_TEXT = "#166534";
const WARNING_BG = "#fef3c7";
const WARNING_TEXT = "#92400e";
const ERROR_BG = "#fee2e2";
const ERROR_TEXT = "#991b1b";

const toNumber = (value: number | Prisma.Decimal | null | undefined): number => {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
};

const formatDate = (value: Date | string | null | undefined): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value: Date | string | null | undefined): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatAmount = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const getStatusBadgeStyle = (status: string) => {
  const normalized = status.toUpperCase();
  if (["HELD", "PARTIALLY_RELEASED", "SETTLED"].includes(normalized)) {
    return { bg: SUCCESS_BG, color: SUCCESS_TEXT, label: normalized.replace(/_/g, " ") };
  }
  if (normalized === "INITIATED") {
    return { bg: WARNING_BG, color: WARNING_TEXT, label: "PENDING" };
  }
  if (normalized === "FAILED") {
    return { bg: ERROR_BG, color: ERROR_TEXT, label: "FAILED" };
  }
  return { bg: SURFACE, color: TEXT_DARK, label: normalized.replace(/_/g, " ") };
};

const drawSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  doc
    .fontSize(11)
    .fillColor(BRAND_PRIMARY)
    .text(title, 50, doc.y)
    .moveDown(0.5);
};

export class ReceiptGenerator {
  /**
   * Generate a branded PDF receipt for a booking payment.
   */
  static generateReceipt(payment: PaymentWithDetails): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 100;
    const currency = (payment.currency || "NGN").toUpperCase();

    const roomFee = toNumber(payment.roomFeeAmount);
    const cleaningFee = toNumber(payment.cleaningFeeAmount);
    const securityDeposit = toNumber(payment.securityDepositAmount);
    const serviceFee = toNumber(payment.serviceFeeAmount);
    const total = toNumber(payment.amount);

    const checkInDate = new Date(payment.booking.checkInDate);
    const checkOutDate = new Date(payment.booking.checkOutDate);
    const nights =
      Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())
        ? 0
        : Math.max(
            1,
            Math.ceil(
              (checkOutDate.getTime() - checkInDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          );

    // Brand header block
    doc.save();
    doc.rect(0, 0, pageWidth, 118).fill(BRAND_PRIMARY);
    doc.restore();

    doc
      .fontSize(20)
      .fillColor("#ffffff")
      .text("STAYZA RECEIPT", 50, 34, { width: contentWidth, align: "left" });
    doc
      .fontSize(10)
      .fillColor("#dbeafe")
      .text("Booking payment confirmation", 50, 62, {
        width: contentWidth,
        align: "left",
      });
    doc
      .fontSize(10)
      .fillColor("#dbeafe")
      .text(`Reference: ${payment.reference}`, 50, 78, {
        width: contentWidth,
        align: "left",
      });

    const badge = getStatusBadgeStyle(payment.status);
    const badgeX = pageWidth - 190;
    const badgeY = 38;
    doc.save();
    doc.roundedRect(badgeX, badgeY, 140, 30, 8).fill(badge.bg);
    doc.restore();
    doc
      .fontSize(10)
      .fillColor(badge.color)
      .text(`STATUS: ${badge.label}`, badgeX, badgeY + 10, {
        width: 140,
        align: "center",
      });

    doc.moveDown(5.2);

    // Booking summary block
    drawSectionTitle(doc, "BOOKING SUMMARY");
    doc.save();
    doc.roundedRect(50, doc.y, contentWidth, 78, 8).fill(SURFACE);
    doc.restore();

    const summaryY = doc.y + 10;
    doc
      .fontSize(10)
      .fillColor(TEXT_MUTED)
      .text("Booking ID", 64, summaryY)
      .text("Check-in", 250, summaryY)
      .text("Check-out", 390, summaryY);
    doc
      .fontSize(11)
      .fillColor(TEXT_DARK)
      .text(payment.booking.id, 64, summaryY + 16, { width: 170 })
      .text(formatDate(payment.booking.checkInDate), 250, summaryY + 16, {
        width: 130,
      })
      .text(formatDate(payment.booking.checkOutDate), 390, summaryY + 16, {
        width: 130,
      });
    doc
      .fontSize(10)
      .fillColor(TEXT_MUTED)
      .text(`Stay length: ${nights} night${nights === 1 ? "" : "s"}`, 64, summaryY + 44);

    doc.y += 92;

    // Guest and property blocks
    drawSectionTitle(doc, "GUEST DETAILS");
    doc
      .fontSize(10)
      .fillColor(TEXT_DARK)
      .text(
        `${payment.booking.guest.firstName} ${payment.booking.guest.lastName}`,
        50,
        doc.y,
      )
      .text(payment.booking.guest.email, 50, doc.y + 2)
      .moveDown(1.2);

    drawSectionTitle(doc, "PROPERTY DETAILS");
    doc
      .fontSize(10)
      .fillColor(TEXT_DARK)
      .text(payment.booking.property.title, 50, doc.y)
      .text(payment.booking.property.address, 50, doc.y + 2)
      .text(
        `${payment.booking.property.city}, ${payment.booking.property.state}, ${payment.booking.property.country}`,
        50,
        doc.y + 2,
      )
      .moveDown(1.4);

    // Payment breakdown
    drawSectionTitle(doc, "PAYMENT BREAKDOWN");
    const tableStartY = doc.y;
    doc.save();
    doc.roundedRect(50, tableStartY, contentWidth, 150, 8).stroke(BORDER);
    doc.restore();

    const rowXLeft = 64;
    const rowXRight = pageWidth - 64;
    let rowY = tableStartY + 14;

    const drawRow = (label: string, value: number, isMuted = false) => {
      doc
        .fontSize(10)
        .fillColor(isMuted ? TEXT_MUTED : TEXT_DARK)
        .text(label, rowXLeft, rowY, { width: 250, align: "left" })
        .text(formatAmount(value, currency), rowXLeft, rowY, {
          width: rowXRight - rowXLeft,
          align: "right",
        });
      rowY += 22;
    };

    drawRow("Room fee", roomFee);
    drawRow("Cleaning fee", cleaningFee);
    drawRow("Security deposit", securityDeposit);
    drawRow("Service fee", serviceFee);

    doc
      .moveTo(64, rowY + 2)
      .lineTo(pageWidth - 64, rowY + 2)
      .stroke(BORDER);
    rowY += 10;

    doc
      .fontSize(11)
      .fillColor(BRAND_PRIMARY)
      .text("Total paid", rowXLeft, rowY, { width: 250, align: "left" })
      .text(formatAmount(total, currency), rowXLeft, rowY, {
        width: rowXRight - rowXLeft,
        align: "right",
      });

    doc.y = tableStartY + 166;

    // Payment meta block
    drawSectionTitle(doc, "TRANSACTION DETAILS");
    doc
      .fontSize(10)
      .fillColor(TEXT_DARK)
      .text(`Method: ${payment.method.toUpperCase()}`, 50, doc.y)
      .text(
        `Transaction ID: ${payment.providerTransactionId || "N/A"}`,
        50,
        doc.y + 2,
      )
      .text(`Created At: ${formatDateTime(payment.createdAt)}`, 50, doc.y + 2)
      .text(`Paid At: ${formatDateTime(payment.paidAt)}`, 50, doc.y + 2)
      .moveDown(2);

    // Footer
    const footerY = doc.page.height - 90;
    doc
      .moveTo(50, footerY)
      .lineTo(pageWidth - 50, footerY)
      .stroke(BORDER);
    doc
      .fontSize(9)
      .fillColor(TEXT_MUTED)
      .text("Support: support@stayza.pro", 50, footerY + 12, {
        width: contentWidth,
        align: "left",
      })
      .text(`Generated: ${formatDateTime(new Date())}`, 50, footerY + 12, {
        width: contentWidth,
        align: "right",
      });

    return doc;
  }
}
