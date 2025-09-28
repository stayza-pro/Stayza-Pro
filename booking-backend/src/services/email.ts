import nodemailer from "nodemailer";
import { config } from "@/config";

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  }
});

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to Property Booking Platform!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to Property Booking Platform!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for joining our platform. We're excited to have you on board!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and book amazing properties</li>
          <li>Manage your bookings and reviews</li>
          <li>Save your favorite properties</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  emailVerification: (name: string, verificationUrl: string) => ({
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Email Verification Required</h2>
        <p>Hello ${name},</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #3b82f6; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: "Reset Your Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #3b82f6; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  realtorApproved: (businessName: string, dashboardUrl: string) => ({
    subject: "Your Realtor Account Has Been Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Congratulations! Your Account is Approved</h2>
        <p>Hello ${businessName},</p>
        <p>Great news! Your realtor account has been approved and you can now start listing your properties.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" 
             style="background-color: #10b981; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Dashboard
          </a>
        </div>
        <p>You can now:</p>
        <ul>
          <li>Add and manage your properties</li>
          <li>Set your own refund policies</li>
          <li>Track bookings and earnings</li>
          <li>Customize your brand profile</li>
        </ul>
        <p>Welcome to our platform!</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  realtorRejected: (businessName: string, reason: string) => ({
    subject: "Realtor Application Update",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Application Status Update</h2>
        <p>Hello ${businessName},</p>
        <p>We have reviewed your realtor application. Unfortunately, we cannot approve your account at this time.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can reapply by updating your information and submitting a new application.</p>
        <p>If you have questions, please contact our support team.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  bookingConfirmation: (booking: any, property: any, realtor: any) => ({
    subject: `Booking Confirmed - ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Booking Confirmed!</h2>
        <p>Your booking has been confirmed. Here are the details:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${property.title}</h3>
          <p><strong>Check-in:</strong> ${new Date(
            booking.checkInDate
          ).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(
            booking.checkOutDate
          ).toLocaleDateString()}</p>
          <p><strong>Guests:</strong> ${booking.totalGuests}</p>
          <p><strong>Total Amount:</strong> ${booking.currency} ${
      booking.totalPrice
    }</p>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Property Details</h4>
          <p><strong>Address:</strong> ${property.address}, ${property.city}, ${
      property.country
    }</p>
          <p><strong>Host:</strong> ${realtor.businessName}</p>
          ${
            realtor.businessEmail
              ? `<p><strong>Contact:</strong> ${realtor.businessEmail}</p>`
              : ""
          }
        </div>

        <p><strong>Important Information:</strong></p>
        <ul>
          <li>Please arrive during check-in hours</li>
          <li>Contact the host if you have any questions</li>
          <li>Review the cancellation policy if plans change</li>
        </ul>

        <p>We hope you have a wonderful stay!</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  bookingCancellation: (
    booking: any,
    property: any,
    refundAmount?: number
  ) => ({
    subject: `Booking Cancelled - ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Booking Cancelled</h2>
        <p>Your booking has been cancelled as requested.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${property.title}</h3>
          <p><strong>Check-in:</strong> ${new Date(
            booking.checkInDate
          ).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(
            booking.checkOutDate
          ).toLocaleDateString()}</p>
          <p><strong>Original Amount:</strong> ${booking.currency} ${
      booking.totalPrice
    }</p>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
        </div>

        ${
          refundAmount
            ? `
          <div style="background-color: #d1fae5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #10b981;">Refund Information</h4>
            <p><strong>Refund Amount:</strong> ${booking.currency} ${refundAmount}</p>
            <p>Your refund will be processed within 5-10 business days to your original payment method.</p>
          </div>
        `
            : `
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>No refund applicable</strong> based on the cancellation policy and timing.</p>
          </div>
        `
        }

        <p>If you have any questions about this cancellation, please contact our support team.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  paymentReceipt: (booking: any, payment: any, property: any) => ({
    subject: `Payment Receipt - ${property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Payment Receipt</h2>
        <p>Thank you for your payment. Here's your receipt:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <p><strong>Receipt ID:</strong> ${payment.id}</p>
          <p><strong>Amount Paid:</strong> ${payment.currency} ${
      payment.amount
    }</p>
          <p><strong>Payment Method:</strong> ${payment.method}</p>
          <p><strong>Payment Date:</strong> ${payment.createdAt.toLocaleDateString()}</p>
          <p><strong>Status:</strong> Completed</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Booking Information</h4>
          <p><strong>Property:</strong> ${property.title}</p>
          <p><strong>Check-in:</strong> ${new Date(
            booking.checkInDate
          ).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(
            booking.checkOutDate
          ).toLocaleDateString()}</p>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
        </div>

        <p>This receipt serves as confirmation of your payment.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  realtorPayout: (
    realtor: any,
    amount: number,
    currency: string,
    bookingId: string
  ) => ({
    subject: "Payout Processed - Booking Payment Released",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Payout Processed</h2>
        <p>Hello ${realtor.businessName},</p>
        <p>Good news! A payout has been processed for one of your bookings.</p>
        
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payout Details</h3>
          <p><strong>Amount:</strong> ${currency} ${amount}</p>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Status:</strong> Completed</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <p>The funds have been transferred to your connected payment account.</p>
        <p>You can view all your payouts and earnings in your dashboard.</p>
        
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),

  refundProcessed: (
    booking: any,
    refundAmount: number,
    totalRefunded: number,
    remaining: number,
    reason: string
  ) => ({
    subject: `Refund ${remaining === 0 ? "Completed" : "Processed"} - Booking ${
      booking.id
    }`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Refund ${
          remaining === 0 ? "Completed" : "Processed"
        }</h2>
        <p>Your refund request has been processed.</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Booking ID:</strong> ${booking.id}</p>
          <p><strong>Refund Amount This Action:</strong> ${
            booking.currency
          } ${refundAmount}</p>
          <p><strong>Total Refunded So Far:</strong> ${
            booking.currency
          } ${totalRefunded}</p>
          <p><strong>Remaining Refundable Balance:</strong> ${
            booking.currency
          } ${remaining}</p>
          <p><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>${
          remaining === 0
            ? "This booking has now been fully refunded."
            : "You may still be eligible for additional partial refunds subject to policy."
        }</p>
        <p>Funds should appear on your original payment method within 5-10 business days depending on your bank.</p>
        <p>Best regards,<br>The Property Booking Team</p>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (
  to: string | string[],
  template: { subject: string; html: string },
  attachments?: any[]
) => {
  try {
    const mailOptions = {
      from: `"Property Booking Platform" <${config.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: template.subject,
      html: template.html,
      attachments: attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Send welcome email
export const sendWelcomeEmail = async (to: string, name: string) => {
  const template = emailTemplates.welcome(name);
  return sendEmail(to, template);
};

// Send email verification
export const sendEmailVerification = async (
  to: string,
  name: string,
  verificationUrl: string
) => {
  const template = emailTemplates.emailVerification(name, verificationUrl);
  return sendEmail(to, template);
};

// Send password reset
export const sendPasswordReset = async (
  to: string,
  name: string,
  resetUrl: string
) => {
  const template = emailTemplates.passwordReset(name, resetUrl);
  return sendEmail(to, template);
};

// Send realtor approval
export const sendRealtorApproval = async (
  to: string,
  businessName: string,
  dashboardUrl: string
) => {
  const template = emailTemplates.realtorApproved(businessName, dashboardUrl);
  return sendEmail(to, template);
};

// Send realtor rejection
export const sendRealtorRejection = async (
  to: string,
  businessName: string,
  reason: string
) => {
  const template = emailTemplates.realtorRejected(businessName, reason);
  return sendEmail(to, template);
};

// Send booking confirmation
export const sendBookingConfirmation = async (
  to: string,
  booking: any,
  property: any,
  realtor: any
) => {
  const template = emailTemplates.bookingConfirmation(
    booking,
    property,
    realtor
  );
  return sendEmail(to, template);
};

// Send booking cancellation
export const sendBookingCancellation = async (
  to: string,
  booking: any,
  property: any,
  refundAmount?: number
) => {
  const template = emailTemplates.bookingCancellation(
    booking,
    property,
    refundAmount
  );
  return sendEmail(to, template);
};

// Send payment receipt
export const sendPaymentReceipt = async (
  to: string,
  booking: any,
  payment: any,
  property: any,
  pdfAttachment?: any
) => {
  const template = emailTemplates.paymentReceipt(booking, payment, property);
  return sendEmail(to, template, pdfAttachment ? [pdfAttachment] : undefined);
};

// Send realtor payout notification
export const sendRealtorPayout = async (
  to: string,
  realtor: any,
  amount: number,
  currency: string,
  bookingId: string
) => {
  const template = emailTemplates.realtorPayout(
    realtor,
    amount,
    currency,
    bookingId
  );
  return sendEmail(to, template);
};

// Send refund processed email
export const sendRefundProcessed = async (
  to: string,
  booking: any,
  refundAmount: number,
  totalRefunded: number,
  remaining: number,
  reason: string
) => {
  const template = emailTemplates.refundProcessed(
    booking,
    refundAmount,
    totalRefunded,
    remaining,
    reason
  );
  return sendEmail(to, template);
};
