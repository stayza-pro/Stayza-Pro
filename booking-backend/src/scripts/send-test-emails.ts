import {
  emailTemplates,
  sendEmail,
  sendEmailVerification,
  sendPasswordReset,
  sendRealtorWelcomeEmail,
  sendCacApprovalEmail,
  sendCacRejectionEmail,
  sendWithdrawalRequestedEmail,
  sendWithdrawalCompletedEmail,
  sendWithdrawalFailedEmail,
  sendBookingSuspensionNotification,
  sendRefundRequestToRealtor,
  sendRefundDecisionToGuest,
  sendRefundProcessedToGuest,
} from "../services/email";

const TEST_EMAIL = "soputa42@gmail.com";

async function sendAllTestEmails() {
  console.log("Starting to send all email templates to:", TEST_EMAIL);
  console.log("=".repeat(60));

  try {
    // 1. Welcome Email
    console.log("\n1. Sending Welcome Email...");
    await sendEmail(TEST_EMAIL, emailTemplates.welcome("John Doe"));
    console.log("✓ Welcome email sent");

    // Wait a bit between emails to avoid rate limiting
    await delay(1000);

    // 2. Realtor Welcome Email (with verification)
    console.log("\n2. Sending Realtor Welcome Email...");
    await sendRealtorWelcomeEmail(
      TEST_EMAIL,
      "Jane Smith",
      "Premium Properties Ltd",
      "https://premium-properties.stayza.pro/dashboard",
      "https://stayza.pro/verify-email?token=sample-verification-token"
    );
    console.log("✓ Realtor welcome email sent");

    await delay(1000);

    // 3. Email Verification (with link)
    console.log("\n3. Sending Email Verification...");
    await sendEmailVerification(
      TEST_EMAIL,
      "John Doe",
      "https://stayza.pro/verify-email?token=sample-token"
    );
    console.log("✓ Email verification sent");

    await delay(1000);

    // 4. Email Verification (with OTP)
    console.log("\n4. Sending OTP Verification Email...");
    await sendEmailVerification(TEST_EMAIL, "John Doe", "123456");
    console.log("✓ OTP verification email sent");

    await delay(1000);

    // 5. Password Reset
    console.log("\n5. Sending Password Reset Email...");
    await sendPasswordReset(
      TEST_EMAIL,
      "John Doe",
      "https://stayza.pro/reset-password?token=sample-reset-token"
    );
    console.log("✓ Password reset email sent");

    await delay(1000);

    // 6. Realtor Approved
    console.log("\n6. Sending Realtor Approved Email...");
    await sendEmail(
      TEST_EMAIL,
      emailTemplates.realtorApproved(
        "Premium Properties Ltd",
        "https://premium-properties.stayza.pro/dashboard"
      )
    );
    console.log("✓ Realtor approved email sent");

    await delay(1000);

    // 7. Realtor Rejected
    console.log("\n7. Sending Realtor Rejected Email...");
    await sendEmail(
      TEST_EMAIL,
      emailTemplates.realtorRejected(
        "Premium Properties Ltd",
        "Incomplete business documentation. Please provide valid CAC certificate and business registration."
      )
    );
    console.log("✓ Realtor rejected email sent");

    await delay(1000);

    // 8. Realtor Suspended
    console.log("\n8. Sending Realtor Suspended Email...");
    await sendEmail(
      TEST_EMAIL,
      emailTemplates.realtorSuspended(
        "Premium Properties Ltd",
        "Multiple policy violations and customer complaints regarding property conditions."
      )
    );
    console.log("✓ Realtor suspended email sent");

    await delay(1000);

    // 9. CAC Approved
    console.log("\n9. Sending CAC Approved Email...");
    await sendCacApprovalEmail(
      TEST_EMAIL,
      "Jane Smith",
      "Premium Properties Ltd"
    );
    console.log("✓ CAC approved email sent");

    await delay(1000);

    // 10. CAC Rejected with Appeal
    console.log("\n10. Sending CAC Rejection Email...");
    await sendCacRejectionEmail(
      TEST_EMAIL,
      "Jane Smith",
      "Premium Properties Ltd",
      "The CAC number provided does not match our records. Please verify and resubmit.",
      "https://stayza.pro/settings?tab=business&appeal=true"
    );
    console.log("✓ CAC rejection email sent");

    await delay(1000);

    // 11. Withdrawal Requested
    console.log("\n11. Sending Withdrawal Requested Email...");
    await sendWithdrawalRequestedEmail(
      TEST_EMAIL,
      "Jane Smith",
      150000,
      "WD-2026-001-ABC123"
    );
    console.log("✓ Withdrawal requested email sent");

    await delay(1000);

    // 12. Withdrawal Completed
    console.log("\n12. Sending Withdrawal Completed Email...");
    await sendWithdrawalCompletedEmail(
      TEST_EMAIL,
      "Jane Smith",
      150000,
      "WD-2026-001-ABC123"
    );
    console.log("✓ Withdrawal completed email sent");

    await delay(1000);

    // 13. Withdrawal Failed
    console.log("\n13. Sending Withdrawal Failed Email...");
    await sendWithdrawalFailedEmail(
      TEST_EMAIL,
      "Jane Smith",
      150000,
      "Your bank account details could not be verified. Please update your payout settings with correct account information."
    );
    console.log("✓ Withdrawal failed email sent");

    await delay(1000);

    // 14. Booking Suspension
    console.log("\n14. Sending Booking Suspension Email...");
    await sendBookingSuspensionNotification(
      TEST_EMAIL,
      { firstName: "John", lastName: "Doe" },
      {
        bookingId: "BK-2026-12345",
        propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
        realtorBusinessName: "Premium Properties Ltd",
        reason: "property owner account suspension",
      }
    );
    console.log("✓ Booking suspension email sent");

    await delay(1000);

    // 15. Refund Request to Realtor
    console.log("\n15. Sending Refund Request to Realtor...");
    await sendRefundRequestToRealtor(
      TEST_EMAIL,
      "Jane Smith",
      { firstName: "John", lastName: "Doe", email: "john.doe@example.com" },
      {
        amount: 50000,
        currency: "NGN",
        propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
        reason: "Early checkout due to family emergency",
        customerNotes:
          "I had to leave early due to a family emergency. The property was great, just need to leave sooner than planned.",
      },
      "https://premium-properties.stayza.pro/dashboard/refunds"
    );
    console.log("✓ Refund request to realtor email sent");

    await delay(1000);

    // 16. Refund Approved to Guest
    console.log("\n16. Sending Refund Approved Email to Guest...");
    await sendRefundDecisionToGuest(TEST_EMAIL, "John Doe", {
      amount: 50000,
      currency: "NGN",
      propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
      approved: true,
      realtorReason: "Valid emergency situation",
      realtorNotes:
        "We understand the emergency. Hope everything is okay with your family.",
    });
    console.log("✓ Refund approved email sent");

    await delay(1000);

    // 17. Refund Not Approved to Guest
    console.log("\n17. Sending Refund Update Email to Guest...");
    await sendRefundDecisionToGuest(TEST_EMAIL, "John Doe", {
      amount: 50000,
      currency: "NGN",
      propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
      approved: false,
      realtorReason: "Cancellation is outside policy window",
      realtorNotes:
        "The cancellation request is beyond our 48-hour policy. Please contact support for alternatives.",
    });
    console.log("✓ Refund update email sent");

    await delay(1000);

    // 18. Refund Processed to Guest
    console.log("\n18. Sending Refund Processed Email to Guest...");
    await sendRefundProcessedToGuest(TEST_EMAIL, "John Doe", {
      amount: 50000,
      currency: "NGN",
      propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
      processedAt: new Date(),
      paymentMethod: "Paystack",
    });
    console.log("✓ Refund processed to guest email sent");

    console.log("\n" + "=".repeat(60));
    console.log("✅ All test emails sent successfully!");
    console.log("Check your inbox at:", TEST_EMAIL);
  } catch (error) {
    console.error("\n❌ Error sending emails:", error);
    throw error;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
sendAllTestEmails()
  .then(() => {
    console.log("\n✓ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Script failed:", error);
    process.exit(1);
  });
