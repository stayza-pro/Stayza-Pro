import axios from "axios";
import crypto from "crypto";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { withPaymentRetry } from "@/utils/retry";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Paystack API client
const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Create subaccount for realtor
 */
export const createSubAccount = async (realtor: {
  id: string;
  businessName: string;
  businessEmail: string;
  bankCode: string;
  accountNumber: string;
  percentageCharge?: number;
}) => {
  try {
    const response = await paystackClient.post("/subaccount", {
      business_name: realtor.businessName,
      settlement_bank: realtor.bankCode,
      account_number: realtor.accountNumber,
      percentage_charge: realtor.percentageCharge || 10, // Platform keeps 10% commission, rest held in escrow
      description: `Subaccount for ${realtor.businessName}`,
      primary_contact_email: realtor.businessEmail,
      metadata: {
        realtor_id: realtor.id,
      },
    });

    return response.data.data;
  } catch (error: any) {
    logger.error("Error creating Paystack subaccount", {
      error: error.response?.data || error.message,
      stack: error.stack,
    });
    throw new Error("Failed to create payment account");
  }
};

/**
 * Initialize split payment
 */
export const initializeSplitPayment = async (booking: {
  id: string;
  totalPrice: number;
  currency: string;
  guestEmail: string;
  realtorSubAccountCode: string;
  realtorPayout: number;
  platformCommission: number;
}) => {
  try {
    // Create split configuration
    const splitConfig = {
      type: "percentage",
      currency: booking.currency,
      name: `Split for booking ${booking.id}`,
      subaccounts: [
        {
          subaccount: booking.realtorSubAccountCode,
          share: Math.round((booking.realtorPayout / booking.totalPrice) * 100), // Percentage
        },
      ],
      bearer_type: "all-proportional", // Split transaction charges proportionally
    };

    // Create the split
    const splitResponse = await paystackClient.post("/split", splitConfig);
    const splitCode = splitResponse.data.data.split_code;

    // Initialize transaction with split
    const transactionResponse = await paystackClient.post(
      "/transaction/initialize",
      {
        email: booking.guestEmail,
        amount: Math.round(booking.totalPrice * 100), // Convert to kobo (Nigerian cents)
        currency: booking.currency,
        split_code: splitCode,
        metadata: {
          booking_id: booking.id,
          split_code: splitCode,
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: booking.id,
            },
          ],
        },
        callback_url: `${config.FRONTEND_URL}/booking/payment/success`,
        channels: [
          "card",
          "bank",
          "ussd",
          "qr",
          "mobile_money",
          "bank_transfer",
        ],
      }
    );

    return {
      authorization_url: transactionResponse.data.data.authorization_url,
      access_code: transactionResponse.data.data.access_code,
      reference: transactionResponse.data.data.reference,
      split_code: splitCode,
    };
  } catch (error: any) {
    logger.error("Error initializing Paystack split payment", {
      error: error.response?.data || error.message,
      bookingId: booking.id,
      stack: error.stack,
    });
    throw new Error("Failed to initialize payment");
  }
};

/**
 * Verify transaction
 */
export const verifyTransaction = async (reference: string) => {
  try {
    const response = await paystackClient.get(
      `/transaction/verify/${reference}`
    );
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Error verifying Paystack transaction:",
      error.response?.data || error.message
    );
    throw new Error("Failed to verify transaction");
  }
};

/**
 * Get transaction details
 */
export const getTransaction = async (transactionId: string) => {
  try {
    const response = await paystackClient.get(`/transaction/${transactionId}`);
    return response.data.data;
  } catch (error: any) {
    logger.error("Error getting Paystack transaction", {
      error: error.response?.data || error.message,
      transactionId,
      stack: error.stack,
    });
    throw new Error("Failed to get transaction details");
  }
};

/**
 * Process refund
 */
export const processRefund = async (
  transactionReference: string,
  refundAmount?: number
) => {
  try {
    const payload: any = {
      transaction: transactionReference,
    };

    // If partial refund, specify amount
    if (refundAmount) {
      payload.amount = Math.round(refundAmount * 100); // Convert to kobo
    }

    const response = await withPaymentRetry(
      () => paystackClient.post("/refund", payload),
      "processRefund",
      "paystack"
    );
    return response.data.data;
  } catch (error: any) {
    logger.error("Error processing Paystack refund", {
      error: error.response?.data || error.message,
      transactionReference,
      refundAmount,
      stack: error.stack,
    });
    throw new Error("Failed to process refund");
  }
};

/**
 * Get subaccount details
 */
export const getSubAccount = async (subAccountCode: string) => {
  try {
    const response = await paystackClient.get(`/subaccount/${subAccountCode}`);
    return response.data.data;
  } catch (error: any) {
    logger.error("Error getting Paystack subaccount", {
      error: error.response?.data || error.message,
      subAccountCode,
      stack: error.stack,
    });
    throw new Error("Failed to get subaccount details");
  }
};

/**
 * List Nigerian banks for subaccount creation
 */
export const listBanks = async () => {
  try {
    const response = await paystackClient.get("/bank?country=nigeria");
    return response.data.data;
  } catch (error: any) {
    logger.error("Error listing banks", {
      error: error.response?.data || error.message,
      stack: error.stack,
    });
    throw new Error("Failed to get bank list");
  }
};

/**
 * Resolve bank account details
 */
export const resolveAccount = async (
  accountNumber: string,
  bankCode: string
) => {
  try {
    const response = await paystackClient.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    return response.data.data;
  } catch (error: any) {
    logger.error("Error resolving account", {
      error: error.response?.data || error.message,
      accountNumber,
      bankCode,
      stack: error.stack,
    });
    throw new Error("Failed to resolve account details");
  }
};

/**
 * Verify webhook signature
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string
): boolean => {
  const hash = crypto
    .createHmac("sha512", config.PAYSTACK_WEBHOOK_SECRET)
    .update(payload, "utf8")
    .digest("hex");

  return hash === signature;
};

/**
 * Initialize a simple Paystack transaction (without splits)
 */
export const initializePaystackTransaction = async (data: {
  email: string;
  amount: number;
  reference: string;
  callback_url?: string;
  metadata?: any;
  subaccount?: string | null;
  transaction_charge?: number;
}) => {
  try {
    const payload: any = {
      email: data.email,
      amount: data.amount,
      reference: data.reference,
      callback_url: data.callback_url,
      metadata: data.metadata,
    };

    // Add subaccount if provided
    if (data.subaccount) {
      payload.subaccount = data.subaccount;
      payload.transaction_charge = data.transaction_charge ?? 0;
    }

    const response = await paystackClient.post(
      "/transaction/initialize",
      payload
    );
    return response.data;
  } catch (error: any) {
    logger.error(
      "Paystack initialization error:",
      error.response?.data || error
    );
    throw new Error(
      error.response?.data?.message || "Payment initialization failed"
    );
  }
};

/**
 * Verify Paystack transaction
 */
export const verifyPaystackTransaction = async (reference: string) => {
  try {
    const response = await paystackClient.get(
      `/transaction/verify/${reference}`
    );
    return response.data;
  } catch (error: any) {
    logger.error("Paystack verification error:", error.response?.data || error);
    throw new Error(
      error.response?.data?.message || "Payment verification failed"
    );
  }
};

/**
 * Transfer funds to recipient (for escrow payouts)
 */
export const initiateTransfer = async (data: {
  amount: number;
  recipient: string;
  reason: string;
  reference?: string;
}) => {
  try {
    const payload = {
      source: "balance",
      amount: Math.round(data.amount * 100), // Convert to kobo
      recipient: data.recipient,
      reason: data.reason,
      reference: data.reference || `transfer_${Date.now()}`,
    };

    const response = await withPaymentRetry(
      () => paystackClient.post("/transfer", payload),
      "initiateTransfer",
      "paystack"
    );
    return response.data.data;
  } catch (error: any) {
    logger.error("Paystack transfer error", {
      error: error.response?.data || error.message,
      amount: data.amount,
      recipient: data.recipient,
      reference: data.reference,
      stack: error.stack,
    });
    throw new Error(
      error.response?.data?.message || "Failed to initiate transfer"
    );
  }
};

/**
 * Create transfer recipient (for realtor payouts)
 */
export const createTransferRecipient = async (data: {
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
  metadata?: any;
}) => {
  try {
    const payload = {
      type: data.type || "nuban",
      name: data.name,
      account_number: data.account_number,
      bank_code: data.bank_code,
      currency: data.currency || "NGN",
      metadata: data.metadata,
    };

    const response = await paystackClient.post("/transferrecipient", payload);
    return response.data.data;
  } catch (error: any) {
    logger.error("Paystack create recipient error", {
      error: error.response?.data || error.message,
      accountNumber: data.account_number,
      bankCode: data.bank_code,
      stack: error.stack,
    });
    throw new Error(
      error.response?.data?.message || "Failed to create transfer recipient"
    );
  }
};

/**
 * Verify transfer status
 */
export const verifyTransfer = async (reference: string) => {
  try {
    const response = await paystackClient.get(`/transfer/verify/${reference}`);
    return response.data.data;
  } catch (error: any) {
    logger.error("Paystack verify transfer error", {
      error: error.response?.data || error.message,
      reference,
      stack: error.stack,
    });
    throw new Error(
      error.response?.data?.message || "Failed to verify transfer"
    );
  }
};

export const paystackService = {
  createSubAccount,
  initializeSplitPayment,
  initializePaystackTransaction,
  verifyTransaction,
  verifyPaystackTransaction,
  processRefund,
  listBanks,
  resolveAccount,
  verifyWebhookSignature,
  initiateTransfer,
  createTransferRecipient,
  verifyTransfer,
};
