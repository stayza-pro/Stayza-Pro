import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";

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

export class ReceiptGenerator {
  /**
   * Generate PDF receipt for a payment
   */
  static generateReceipt(payment: PaymentWithDetails): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    // Header
    doc
      .fontSize(28)
      .fillColor("#1e40af")
      .text("PAYMENT RECEIPT", { align: "center" })
      .moveDown();

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("Stayza Property Booking Platform", { align: "center" })
      .text("www.stayza.pro", { align: "center" })
      .moveDown(2);

    // Receipt Details Box
    doc
      .fontSize(12)
      .fillColor("#000000")
      .text(`Receipt #: ${payment.reference}`, 50, doc.y)
      .text(
        `Date: ${new Date(payment.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        50,
        doc.y
      )
      .text(
        `Status: ${payment.status.replace(/_/g, " ").toUpperCase()}`,
        50,
        doc.y
      )
      .moveDown(2);

    // Guest Information
    doc
      .fontSize(14)
      .fillColor("#1e40af")
      .text("Guest Information", 50, doc.y)
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(
        `Name: ${payment.booking.guest.firstName} ${payment.booking.guest.lastName}`,
        50,
        doc.y
      )
      .text(`Email: ${payment.booking.guest.email}`, 50, doc.y)
      .moveDown(2);

    // Property Information
    doc
      .fontSize(14)
      .fillColor("#1e40af")
      .text("Property Information", 50, doc.y)
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(`Property: ${payment.booking.property.title}`, 50, doc.y)
      .text(`Address: ${payment.booking.property.address}`, 50, doc.y)
      .text(
        `Location: ${payment.booking.property.city}, ${payment.booking.property.state}, ${payment.booking.property.country}`,
        50,
        doc.y
      )
      .moveDown(2);

    // Booking Information
    doc
      .fontSize(14)
      .fillColor("#1e40af")
      .text("Booking Information", 50, doc.y)
      .moveDown(0.5);

    const checkIn = new Date(payment.booking.checkInDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    const checkOut = new Date(payment.booking.checkOutDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const nights = Math.ceil(
      (new Date(payment.booking.checkOutDate).getTime() -
        new Date(payment.booking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(`Check-in: ${checkIn}`, 50, doc.y)
      .text(`Check-out: ${checkOut}`, 50, doc.y)
      .text(`Number of Nights: ${nights}`, 50, doc.y)
      .moveDown(2);

    // Payment Details
    doc
      .fontSize(14)
      .fillColor("#1e40af")
      .text("Payment Details", 50, doc.y)
      .moveDown(0.5);

    const currency = payment.currency.toUpperCase();
    const formatAmount = (amount: number | Prisma.Decimal) => {
      const numAmount = typeof amount === "number" ? amount : amount.toNumber();
      return `${currency} ${numAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(`Subtotal: ${formatAmount(payment.booking.totalPrice)}`, 50, doc.y);

    // Draw line before total
    doc
      .moveTo(50, doc.y + 5)
      .lineTo(300, doc.y + 5)
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(14)
      .fillColor("#000000")
      .text(`Total Amount: ${formatAmount(payment.amount)}`, 50, doc.y)
      .moveDown(0.5);

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(`Payment Method: ${payment.method.toUpperCase()}`, 50, doc.y);

    if (payment.providerTransactionId) {
      doc.text(`Transaction ID: ${payment.providerTransactionId}`, 50, doc.y);
    }

    doc.moveDown(3);

    // Footer
    doc
      .fontSize(9)
      .fillColor("#6b7280")
      .text(
        "This is a computer-generated receipt and does not require a signature.",
        50,
        doc.y,
        { align: "center" }
      )
      .moveDown(0.5)
      .text("For any queries, please contact support@stayza.pro", 50, doc.y, {
        align: "center",
      });

    // Add page border
    doc
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .stroke("#e5e7eb");

    return doc;
  }
}
