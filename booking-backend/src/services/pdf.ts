import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import { config } from "@/config";

export class PDFService {
  static async generateBookingReceipt(
    booking: any,
    property: any,
    user: any,
    payment: any
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc
          .fillColor("#3b82f6")
          .fontSize(24)
          .font("Helvetica-Bold")
          .text("BOOKING RECEIPT", 50, 50);

        doc
          .fillColor("#6b7280")
          .fontSize(12)
          .font("Helvetica")
          .text(`Receipt #: ${payment.id}`, 50, 85)
          .text(`Date: ${new Date().toLocaleDateString()}`, 50, 100);

        // Draw line
        doc.moveTo(50, 130).lineTo(545, 130).stroke("#e5e7eb");

        // Guest Information
        doc
          .fillColor("#1f2937")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Guest Information", 50, 150);

        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(`Name: ${user.firstName} ${user.lastName}`, 50, 175)
          .text(`Email: ${user.email}`, 50, 190)
          .text(`Phone: ${user.phone || "N/A"}`, 50, 205);

        // Property Information
        doc
          .fillColor("#1f2937")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Property Information", 50, 240);

        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(`Property: ${property.title}`, 50, 265)
          .text(`Address: ${property.address}`, 50, 280)
          .text(`City: ${property.city}, ${property.country}`, 50, 295);

        // Booking Details
        doc
          .fillColor("#1f2937")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Booking Details", 50, 330);

        const checkIn = new Date(booking.checkInDate).toLocaleDateString();
        const checkOut = new Date(booking.checkOutDate).toLocaleDateString();
        const nights = Math.ceil(
          (new Date(booking.checkOutDate).getTime() -
            new Date(booking.checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(`Check-in: ${checkIn}`, 50, 355)
          .text(`Check-out: ${checkOut}`, 50, 370)
          .text(`Nights: ${nights}`, 50, 385)
          .text(`Guests: ${booking.totalGuests}`, 50, 400)
          .text(`Booking ID: ${booking.id}`, 50, 415);

        // Payment Summary
        doc
          .fillColor("#1f2937")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Payment Summary", 50, 450);

        // Create table-like structure for payment breakdown
        const tableTop = 475;
        const col1 = 50;
        const col2 = 300;
        const col3 = 450;

        // Table headers
        doc
          .fillColor("#6b7280")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("Description", col1, tableTop)
          .text("Amount", col2, tableTop)
          .text("Currency", col3, tableTop);

        // Draw header line
        doc
          .moveTo(col1, tableTop + 15)
          .lineTo(545, tableTop + 15)
          .stroke("#e5e7eb");

        let currentY = tableTop + 25;

        // Base price
        const basePrice =
          booking.totalPrice -
          (booking.serviceFee ?? 0) -
          (booking.taxAmount ?? 0);
        doc
          .fillColor("#374151")
          .fontSize(11)
          .font("Helvetica")
          .text(`${property.title} (${nights} nights)`, col1, currentY)
          .text(basePrice.toFixed(2), col2, currentY)
          .text(booking.currency, col3, currentY);

        currentY += 20;

        // Service fee
        if (booking.serviceFee && booking.serviceFee > 0) {
          doc
            .text("Service Fee", col1, currentY)
            .text(booking.serviceFee.toFixed(2), col2, currentY)
            .text(booking.currency, col3, currentY);
          currentY += 20;
        }

        // Tax
        if (booking.taxAmount && booking.taxAmount > 0) {
          doc
            .text("Taxes", col1, currentY)
            .text(booking.taxAmount.toFixed(2), col2, currentY)
            .text(booking.currency, col3, currentY);
          currentY += 20;
        }

        // Total line
        doc
          .moveTo(col1, currentY + 5)
          .lineTo(545, currentY + 5)
          .stroke("#e5e7eb");

        currentY += 15;

        // Total amount
        doc
          .fillColor("#1f2937")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Total Paid", col1, currentY)
          .text(booking.totalPrice.toFixed(2), col2, currentY)
          .text(booking.currency, col3, currentY);

        // Payment method
        currentY += 30;
        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(`Payment Method: ${payment.method}`, col1, currentY)
          .text(`Payment Status: ${payment.status}`, col1, currentY + 15);

        // Footer
        currentY += 60;
        doc
          .fillColor("#6b7280")
          .fontSize(10)
          .font("Helvetica")
          .text("Thank you for choosing our platform!", col1, currentY)
          .text(
            "For support, please contact us at support@propertybooking.com",
            col1,
            currentY + 15
          )
          .text(
            "This is an automatically generated receipt.",
            col1,
            currentY + 30
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateBookingInvoice(
    booking: any,
    property: any,
    realtor: any
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc
          .fillColor("#3b82f6")
          .fontSize(24)
          .font("Helvetica-Bold")
          .text("BOOKING INVOICE", 50, 50);

        doc
          .fillColor("#6b7280")
          .fontSize(12)
          .font("Helvetica")
          .text(`Invoice #: ${booking.id}`, 50, 85)
          .text(`Date: ${new Date().toLocaleDateString()}`, 50, 100);

        // Business Information
        doc
          .fillColor("#1f2937")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("From:", 300, 150);

        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(realtor.businessName, 300, 175)
          .text(realtor.businessEmail || "", 300, 190)
          .text(realtor.businessPhone || "", 300, 205);

        // Property & Booking Details
        doc
          .fillColor("#1f2937")
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Booking Details", 50, 150);

        const checkIn = new Date(booking.checkInDate).toLocaleDateString();
        const checkOut = new Date(booking.checkOutDate).toLocaleDateString();
        const nights = Math.ceil(
          (new Date(booking.checkOutDate).getTime() -
            new Date(booking.checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(`Property: ${property.title}`, 50, 175)
          .text(`Check-in: ${checkIn}`, 50, 190)
          .text(`Check-out: ${checkOut}`, 50, 205)
          .text(`Nights: ${nights}`, 50, 220)
          .text(`Guests: ${booking.totalGuests}`, 50, 235);

        // Line items table
        const tableTop = 280;
        const col1 = 50;
        const col2 = 250;
        const col3 = 350;
        const col4 = 450;

        // Table headers
        doc
          .fillColor("#6b7280")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("Description", col1, tableTop)
          .text("Qty", col2, tableTop)
          .text("Rate", col3, tableTop)
          .text("Amount", col4, tableTop);

        // Draw header line
        doc
          .moveTo(col1, tableTop + 15)
          .lineTo(545, tableTop + 15)
          .stroke("#e5e7eb");

        let currentY = tableTop + 25;

        // Accommodation line
        const basePrice =
          booking.totalPrice -
          (booking.serviceFee ?? 0) -
          (booking.taxAmount ?? 0);
        doc
          .fillColor("#374151")
          .fontSize(11)
          .font("Helvetica")
          .text("Accommodation", col1, currentY)
          .text(`${nights}`, col2, currentY)
          .text(`${(basePrice / nights).toFixed(2)}`, col3, currentY)
          .text(basePrice.toFixed(2), col4, currentY);

        currentY += 20;

        // Service fee
        if (booking.serviceFee && booking.serviceFee > 0) {
          doc
            .text("Service Fee", col1, currentY)
            .text("1", col2, currentY)
            .text(booking.serviceFee.toFixed(2), col3, currentY)
            .text(booking.serviceFee.toFixed(2), col4, currentY);
          currentY += 20;
        }

        // Taxes
        if (booking.taxAmount && booking.taxAmount > 0) {
          doc
            .text("Taxes", col1, currentY)
            .text("1", col2, currentY)
            .text(booking.taxAmount.toFixed(2), col3, currentY)
            .text(booking.taxAmount.toFixed(2), col4, currentY);
          currentY += 20;
        }

        // Total line
        doc
          .moveTo(col3, currentY + 5)
          .lineTo(545, currentY + 5)
          .stroke("#e5e7eb");

        currentY += 15;

        // Total
        doc
          .fillColor("#1f2937")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Total", col3, currentY)
          .text(
            `${booking.currency} ${booking.totalPrice.toFixed(2)}`,
            col4,
            currentY
          );

        // Terms
        currentY += 60;
        doc
          .fillColor("#1f2937")
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Terms & Conditions:", 50, currentY);

        currentY += 20;
        doc
          .fillColor("#374151")
          .fontSize(10)
          .font("Helvetica")
          .text(
            "• Check-in time: 3:00 PM, Check-out time: 11:00 AM",
            50,
            currentY
          )
          .text("• Please review the cancellation policy", 50, currentY + 15)
          .text("• Smoking is not permitted in the property", 50, currentY + 30)
          .text(
            "• Additional guests may incur extra charges",
            50,
            currentY + 45
          );

        // Footer
        currentY += 80;
        doc
          .fillColor("#6b7280")
          .fontSize(10)
          .font("Helvetica")
          .text("This invoice was generated automatically.", 50, currentY)
          .text(
            "For questions, please contact the property host directly.",
            50,
            currentY + 15
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateRealtorPayoutReport(
    realtor: any,
    payouts: any[],
    startDate: Date,
    endDate: Date
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        // Header
        doc
          .fillColor("#3b82f6")
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("PAYOUT REPORT", 50, 50);

        doc
          .fillColor("#6b7280")
          .fontSize(12)
          .font("Helvetica")
          .text(
            `Report Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
            50,
            80
          )
          .text(`Generated: ${new Date().toLocaleDateString()}`, 50, 95);

        // Business Information
        doc
          .fillColor("#1f2937")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Business Information", 50, 125);

        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(`Business Name: ${realtor.businessName}`, 50, 150)
          .text(`Email: ${realtor.businessEmail}`, 50, 165)
          .text(`Phone: ${realtor.businessPhone || "N/A"}`, 50, 180);

        // Summary
        const totalAmount = payouts.reduce(
          (sum, payout) => sum + payout.amount,
          0
        );
        const totalBookings = payouts.length;

        doc
          .fillColor("#1f2937")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Summary", 50, 210);

        doc
          .fillColor("#374151")
          .fontSize(12)
          .font("Helvetica")
          .text(`Total Payouts: ${totalBookings}`, 50, 235)
          .text(`Total Amount: $${totalAmount.toFixed(2)}`, 50, 250);

        // Payouts table
        if (payouts.length > 0) {
          const tableTop = 285;
          const col1 = 50;
          const col2 = 150;
          const col3 = 250;
          const col4 = 350;
          const col5 = 450;

          doc
            .fillColor("#1f2937")
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("Payout Details", col1, tableTop);

          // Table headers
          doc
            .fillColor("#6b7280")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("Date", col1, tableTop + 25)
            .text("Booking ID", col2, tableTop + 25)
            .text("Amount", col3, tableTop + 25)
            .text("Status", col4, tableTop + 25)
            .text("Method", col5, tableTop + 25);

          // Draw header line
          doc
            .moveTo(col1, tableTop + 40)
            .lineTo(545, tableTop + 40)
            .stroke("#e5e7eb");

          let currentY = tableTop + 50;

          payouts.forEach((payout, index) => {
            if (currentY > 700) {
              // Start new page if needed
              doc.addPage();
              currentY = 50;
            }

            doc
              .fillColor("#374151")
              .fontSize(10)
              .font("Helvetica")
              .text(
                new Date(payout.createdAt).toLocaleDateString(),
                col1,
                currentY
              )
              .text(payout.bookingId.substring(0, 8) + "...", col2, currentY)
              .text(`$${payout.amount.toFixed(2)}`, col3, currentY)
              .text(payout.status, col4, currentY)
              .text(payout.method || "Transfer", col5, currentY);

            currentY += 20;
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper to save PDF to file system (optional)
  static async savePDFToFile(
    pdfBuffer: Buffer,
    filename: string
  ): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "uploads", "pdfs");

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    return filePath;
  }
}
