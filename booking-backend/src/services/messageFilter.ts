/**
 * Message Content Filtering Service
 *
 * Auto-blocks or masks sensitive information to prevent platform bypass:
 * - Phone numbers
 * - Email addresses
 * - External payment hints
 * - Messaging app references (WhatsApp, Telegram, etc.)
 */

interface FilterResult {
  isBlocked: boolean;
  filteredContent: string;
  violations: string[];
}

export class MessageFilterService {
  // Regex patterns for detecting violations
  private static readonly patterns = {
    // Phone numbers (international formats)
    phone: /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,

    // Email addresses
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // External payment hints
    payment:
      /\b(pay\s*(outside|externally|directly|cash|venmo|zelle|paypal|cashapp)|\btransfer\s*to\b|bank\s*account|wire\s*transfer|send\s*money)\b/gi,

    // Messaging apps
    messagingApps:
      /\b(whatsapp|telegram|signal|wechat|line|viber|snapchat|instagram\s*dm|facebook\s*messenger)\b/gi,

    // URLs (to prevent external booking links)
    urls: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,

    // Social media handles
    socialHandles: /@[a-zA-Z0-9_]+/g,
  };

  /**
   * Filter message content and detect violations
   */
  static filterMessage(content: string): FilterResult {
    const violations: string[] = [];
    let filteredContent = content;

    // Check for phone numbers
    if (this.patterns.phone.test(content)) {
      violations.push("phone_number");
      filteredContent = filteredContent.replace(
        this.patterns.phone,
        "[PHONE NUMBER REMOVED]"
      );
    }

    // Check for emails
    if (this.patterns.email.test(content)) {
      violations.push("email_address");
      filteredContent = filteredContent.replace(
        this.patterns.email,
        "[EMAIL REMOVED]"
      );
    }

    // Check for external payment hints
    if (this.patterns.payment.test(content)) {
      violations.push("external_payment");
      // Block these entirely - too risky
      return {
        isBlocked: true,
        filteredContent: content,
        violations,
      };
    }

    // Check for messaging apps
    if (this.patterns.messagingApps.test(content)) {
      violations.push("messaging_app");
      filteredContent = filteredContent.replace(
        this.patterns.messagingApps,
        "[EXTERNAL APP REFERENCE REMOVED]"
      );
    }

    // Check for URLs
    if (this.patterns.urls.test(content)) {
      violations.push("url");
      filteredContent = filteredContent.replace(
        this.patterns.urls,
        "[LINK REMOVED]"
      );
    }

    // Check for social media handles
    if (this.patterns.socialHandles.test(content)) {
      violations.push("social_handle");
      filteredContent = filteredContent.replace(
        this.patterns.socialHandles,
        "[HANDLE REMOVED]"
      );
    }

    // Block if too many violations (likely spam or bypass attempt)
    const isBlocked = violations.length >= 3;

    return {
      isBlocked,
      filteredContent,
      violations,
    };
  }

  /**
   * Validate message before sending
   * Throws error if blocked
   */
  static validateMessage(content: string): string {
    const result = this.filterMessage(content);

    if (result.isBlocked) {
      throw new Error(
        `Message blocked: Contains prohibited content (${result.violations.join(
          ", "
        )})`
      );
    }

    // Log violations for monitoring
    if (result.violations.length > 0) {
      console.warn("Message filtered:", {
        violations: result.violations,
        original: content.substring(0, 50) + "...",
        filtered: result.filteredContent.substring(0, 50) + "...",
      });
    }

    return result.filteredContent;
  }

  /**
   * Check if user can send messages in this context
   */
  static canSendMessage(context: {
    hasBooking: boolean;
    bookingStatus?: string;
    checkoutDate?: Date;
  }): { allowed: boolean; reason?: string } {
    // No booking = limited Q&A only (enforced by route logic)
    if (!context.hasBooking) {
      return { allowed: true }; // Limited to property inquiries
    }

    // After checkout, check time limit (48 hours)
    if (context.bookingStatus === "COMPLETED" && context.checkoutDate) {
      const hoursSinceCheckout =
        (Date.now() - context.checkoutDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCheckout > 48) {
        return {
          allowed: false,
          reason: "Messaging period has ended (48 hours after checkout)",
        };
      }
    }

    return { allowed: true };
  }
}
