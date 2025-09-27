import Stripe from "stripe";
import { config } from "@/config";

// Initialize Stripe with secret key
export const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  typescript: true,
});

/**
 * Create Stripe Connect account for realtor
 */
export const createConnectAccount = async (realtor: {
  id: string;
  businessName: string;
  businessEmail: string;
  country: string;
}) => {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: realtor.country || "US",
      email: realtor.businessEmail,
      business_profile: {
        name: realtor.businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        realtor_id: realtor.id,
      },
    });

    return account;
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    throw new Error("Failed to create payment account");
  }
};

/**
 * Create account link for onboarding
 */
export interface AccountLinkInfo {
  url: string;
  expiresAt: Date | null;
}

export const createAccountLink = async (
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<AccountLinkInfo> => {
  try {
    const accountLinkResponse = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    const accountLink = accountLinkResponse as Stripe.AccountLink & {
      expires_at?: number | null;
    };

    return {
      url: accountLink.url,
      expiresAt: accountLink.expires_at
        ? new Date(accountLink.expires_at * 1000)
        : null,
    };
  } catch (error) {
    console.error("Error creating account link:", error);
    throw new Error("Failed to create onboarding link");
  }
};

/**
 * Check Connect account status
 */
export interface AccountStatusSummary {
  id: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements: Stripe.Account.Requirements | null;
}

export const getAccountStatus = async (
  accountId: string
): Promise<AccountStatusSummary> => {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      id: account.id,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      requirements: account.requirements ?? null,
    };
  } catch (error) {
    console.error("Error getting account status:", error);
    throw new Error("Failed to get account status");
  }
};

/**
 * Create payment intent with split payment
 */
export const createPaymentIntentWithSplit = async (booking: {
  id: string;
  totalPrice: number;
  currency: string;
  propertyPrice: number;
  serviceFee: number;
  platformCommission: number;
  realtorPayout: number;
  realtorStripeAccountId: string;
  guestEmail: string;
}) => {
  try {
    // Create payment intent
    const manual = config.STRIPE_MANUAL_CAPTURE;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100),
      currency: booking.currency.toLowerCase(),
      payment_method_types: ["card"],
      receipt_email: booking.guestEmail,
      metadata: {
        booking_id: booking.id,
        realtor_account_id: booking.realtorStripeAccountId,
      },
      ...(manual ? { capture_method: "manual" as const } : {}),
    });

    return {
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error("Failed to create payment intent");
  }
};

/**
 * Capture payment and transfer to realtor
 */
export const captureAndTransfer = async (
  paymentIntentId: string,
  realtorAccountId: string,
  realtorPayout: number,
  currency: string,
  bookingId: string
) => {
  try {
    // Capture the payment
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

    // Create transfer to realtor (after escrow period)
    const transfer = await stripe.transfers.create({
      amount: Math.round(realtorPayout * 100), // Convert to cents
      currency: currency.toLowerCase(),
      destination: realtorAccountId,
      metadata: {
        booking_id: bookingId,
        type: "realtor_payout",
      },
    });

    return {
      payment_intent: paymentIntent,
      transfer: transfer,
    };
  } catch (error) {
    console.error("Error capturing and transferring:", error);
    throw new Error("Failed to process payment and transfer");
  }
};

/**
 * Process refund
 */
export const processRefund = async (
  paymentIntentId: string,
  refundAmount: number,
  reason: string = "requested_by_customer"
) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason as Stripe.RefundCreateParams.Reason,
    });

    return refund;
  } catch (error) {
    console.error("Error processing refund:", error);
    throw new Error("Failed to process refund");
  }
};

/**
 * Get Connect dashboard link for realtor
 */
export interface DashboardLinkInfo {
  url: string;
  expiresAt: Date | null;
}

export const createDashboardLink = async (
  accountId: string
): Promise<DashboardLinkInfo> => {
  try {
    const linkResponse = await stripe.accounts.createLoginLink(accountId);
    const link = linkResponse as Stripe.LoginLink & {
      expires_at?: number | null;
    };
    return {
      url: link.url,
      expiresAt: link.expires_at ? new Date(link.expires_at * 1000) : null,
    };
  } catch (error) {
    console.error("Error creating dashboard link:", error);
    throw new Error("Failed to create dashboard link");
  }
};

/**
 * Webhook signature verification
 */
export const verifyWebhookSignature = (
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event => {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    throw new Error("Invalid webhook signature");
  }
};

export const stripeService = {
  createConnectAccount,
  createPaymentIntentWithSplit,
  captureAndTransfer,
  processRefund,
  verifyWebhookSignature,
};
