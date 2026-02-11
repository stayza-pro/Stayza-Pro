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
  
  
  // 1. Welcome Email
  
  await sendEmail(TEST_EMAIL, emailTemplates.welcome("John Doe"));
  

  // Wait a bit between emails to avoid rate limiting
  await delay(1000);

  // 2. Realtor Welcome Email (with verification)
  
  await sendRealtorWelcomeEmail(
    TEST_EMAIL,
    "Jane Smith",
    "Premium Properties Ltd",
    "https://premium-properties.stayza.pro/dashboard",
    "https://stayza.pro/verify-email?token=sample-verification-token"
  );
  

  await delay(1000);

    // 3. Email Verification (with link)
    
    await sendEmailVerification(
      TEST_EMAIL,
      "John Doe",
      "https://stayza.pro/verify-email?token=sample-token"
    );
    

    await delay(1000);

    // 4. Email Verification (with OTP)
    
    await sendEmailVerification(TEST_EMAIL, "John Doe", "123456");
    

    await delay(1000);

    // 5. Password Reset
    
    await sendPasswordReset(
      TEST_EMAIL,
      "John Doe",
      "https://stayza.pro/realtor/reset-password?token=sample-reset-token"
    );
    

    await delay(1000);

    // 6. Realtor Approved
    
    await sendEmail(
      TEST_EMAIL,
      emailTemplates.realtorApproved(
        "Premium Properties Ltd",
        "https://premium-properties.stayza.pro/dashboard"
      )
    );
    

    await delay(1000);

    // 7. Realtor Rejected
    
    await sendEmail(
      TEST_EMAIL,
      emailTemplates.realtorRejected(
        "Premium Properties Ltd",
        "Incomplete business documentation. Please provide valid CAC certificate and business registration."
      )
    );
    

    await delay(1000);

    // 8. Realtor Suspended
    
    await sendEmail(
      TEST_EMAIL,
      emailTemplates.realtorSuspended(
        "Premium Properties Ltd",
        "Multiple policy violations and customer complaints regarding property conditions."
      )
    );
    

    await delay(1000);

    // 9. CAC Approved
    
    await sendCacApprovalEmail(
      TEST_EMAIL,
      "Jane Smith",
      "Premium Properties Ltd"
    );
    

    await delay(1000);

    // 10. CAC Rejected with Appeal
    
    await sendCacRejectionEmail(
      TEST_EMAIL,
      "Jane Smith",
      "Premium Properties Ltd",
      "The CAC number provided does not match our records. Please verify and resubmit.",
      "https://stayza.pro/settings?tab=business&appeal=true"
    );
    

    await delay(1000);

    // 11. Withdrawal Requested
    
    await sendWithdrawalRequestedEmail(
      TEST_EMAIL,
      "Jane Smith",
      150000,
      "WD-2026-001-ABC123"
    );
    

    await delay(1000);

    // 12. Withdrawal Completed
    
    await sendWithdrawalCompletedEmail(
      TEST_EMAIL,
      "Jane Smith",
      150000,
      "WD-2026-001-ABC123"
    );
    

    await delay(1000);

    // 13. Withdrawal Failed
    
    await sendWithdrawalFailedEmail(
      TEST_EMAIL,
      "Jane Smith",
      150000,
      "Your bank account details could not be verified. Please update your payout settings with correct account information."
    );
    

    await delay(1000);

    // 14. Booking Suspension
    
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
    

    await delay(1000);

    // 15. Refund Request to Realtor
    
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
    

    await delay(1000);

    // 16. Refund Approved to Guest
    
    await sendRefundDecisionToGuest(TEST_EMAIL, "John Doe", {
      amount: 50000,
      currency: "NGN",
      propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
      approved: true,
      realtorReason: "Valid emergency situation",
      realtorNotes:
        "We understand the emergency. Hope everything is okay with your family.",
    });
    

    await delay(1000);

    // 17. Refund Not Approved to Guest
    
    await sendRefundDecisionToGuest(TEST_EMAIL, "John Doe", {
      amount: 50000,
      currency: "NGN",
      propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
      approved: false,
      realtorReason: "Cancellation is outside policy window",
      realtorNotes:
        "The cancellation request is beyond our 48-hour policy. Please contact support for alternatives.",
    });
    

    await delay(1000);

  // 18. Refund Processed to Guest
  
  await sendRefundProcessedToGuest(TEST_EMAIL, "John Doe", {
    amount: 50000,
    currency: "NGN",
    propertyTitle: "Luxury 3-Bedroom Apartment in Lekki",
    processedAt: new Date(),
    paymentMethod: "Paystack",
  });
  

  
  
  
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
sendAllTestEmails()
  .then(() => {
    
    process.exit(0);
  })
  .catch((error) => {
    
    process.exit(1);
  });
