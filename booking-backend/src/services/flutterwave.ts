import axios from "axios";
import crypto from "crypto";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { withPaymentRetry } from "@/utils/retry";

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";

// Flutterwave API client
const flutterwaveClient = axios.create({
  baseURL: FLUTTERWAVE_BASE_URL,
  headers: {
    Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`,
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
    const response = await flutterwaveClient.post("/subaccounts", {
      account_bank: realtor.bankCode,
      account_number: realtor.accountNumber,
      business_name: realtor.businessName,
      business_email: realtor.businessEmail,
      business_contact: realtor.businessName,
      business_mobile: "0000000000", // You can update this with actual phone
      country: "NG",
      split_type: "percentage",
      split_value: realtor.percentageCharge || 0.93, // 93% to realtor
      meta: {
        realtor_id: realtor.id,
      },
    });

    return response.data.data;
  } catch (error: any) {
    logger.error("Error creating Flutterwave subaccount", {
      error: error.response?.data || error.message,
      stack: error.stack,
    });
    throw new Error("Failed to create payment account");
  }
};

/**
 * Initialize Flutterwave payment
 */
export const initializeFlutterwavePayment = async (data: {
  email: string;
  amount: number;
  reference: string;
  currency?: string;
  callback_url?: string;
  metadata?: any;
  subaccount?: string | null;
  split_info?: any;
}) => {
  try {
    logger.info("Initializing Flutterwave payment", {
      reference: data.reference,
      amount: data.amount,
      currency: data.currency || "NGN",
      email: data.email,
    });

    const payload: any = {
      tx_ref: data.reference,
      amount: data.amount,
      currency: data.currency || "NGN",
      redirect_url:
        data.callback_url || `${config.FRONTEND_URL}/booking/payment/success`,
      payment_options: "card,banktransfer,ussd,mobilemoney",
      customer: {
        email: data.email,
      },
      customizations: {
        title: "Stayza Booking Payment",
        description: "Property booking payment",
        // logo: `${config.FRONTEND_URL}/logo.png`, // Removed to avoid CORS issues in dev
      },
      meta: data.metadata,
    };

    // Add subaccount/split if provided
    if (data.subaccount) {
      payload.subaccounts = [
        {
          id: data.subaccount,
        },
      ];
    }

    const response = await flutterwaveClient.post("/payments", payload);

    logger.info("Flutterwave payment initialized successfully", {
      status: response.data.status,
      hasLink: !!response.data.data?.link,
      reference: data.reference,
    });

    return response.data;
  } catch (error: any) {
    logger.error("Flutterwave initialization error", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
    throw new Error(
      error.response?.data?.message || "Payment initialization failed"
    );
  }
};

/**
 * Verify Flutterwave transaction
 */
export const verifyFlutterwaveTransaction = async (transactionId: string) => {
  try {
    const response = await flutterwaveClient.get(
      `/transactions/${transactionId}/verify`
    );
    return response.data;
  } catch (error: any) {
    logger.error(
      "Flutterwave verification error:",
      error.response?.data || error
    );
    throw new Error(
      error.response?.data?.message || "Payment verification failed"
    );
  }
};

/**
 * Get transaction details
 */
export const getTransaction = async (transactionId: string) => {
  try {
    const response = await flutterwaveClient.get(
      `/transactions/${transactionId}`
    );
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Error getting Flutterwave transaction:",
      error.response?.data || error.message
    );
    throw new Error("Failed to get transaction details");
  }
};

/**
 * Process refund
 */
export const processRefund = async (transactionId: string, amount?: number) => {
  try {
    const payload: any = {
      id: transactionId,
    };

    // If partial refund, specify amount
    if (amount) {
      payload.amount = amount;
    }

    const response = await withPaymentRetry(
      () => flutterwaveClient.post("/refunds", payload),
      "processRefund",
      "flutterwave"
    );
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Error processing Flutterwave refund:",
      error.response?.data || error.message
    );
    throw new Error("Failed to process refund");
  }
};

/**
 * Get subaccount details
 */
export const getSubAccount = async (subAccountId: string) => {
  try {
    const response = await flutterwaveClient.get(
      `/subaccounts/${subAccountId}`
    );
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Error getting Flutterwave subaccount:",
      error.response?.data || error.message
    );
    throw new Error("Failed to get subaccount details");
  }
};

/**
 * List Nigerian banks
 */
export const listBanks = async () => {
  try {
    const response = await flutterwaveClient.get("/banks/NG");
    return response.data.data;
  } catch (error: any) {
    logger.error("Error listing banks:", error.response?.data || error.message);
    throw new Error("Failed to get bank list");
  }
};

/**
 * Resolve account number to get account details
 */
export const resolveAccount = async (
  accountNumber: string,
  accountBank: string
) => {
  try {
    const response = await flutterwaveClient.post("/accounts/resolve", {
      account_number: accountNumber,
      account_bank: accountBank,
    });
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Error resolving account:",
      error.response?.data || error.message
    );
    throw new Error("Failed to resolve account details");
  }
};

/**
 * Initialize split payment with subaccount (similar to Paystack splits)
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
    // Calculate split configuration
    const realtorPercentage =
      (booking.realtorPayout / booking.totalPrice) * 100;

    // Initialize transaction with subaccount split
    const payload: any = {
      tx_ref: `booking_${booking.id}_${Date.now()}`,
      amount: booking.totalPrice,
      currency: booking.currency,
      redirect_url: `${config.FRONTEND_URL}/booking/payment/success`,
      payment_options: "card,banktransfer,ussd,mobilemoney",
      customer: {
        email: booking.guestEmail,
      },
      customizations: {
        title: "Stayza Booking Payment",
        description: `Booking payment for ${booking.id}`,
      },
      meta: {
        booking_id: booking.id,
        realtor_payout: booking.realtorPayout,
        platform_commission: booking.platformCommission,
      },
      subaccounts: [
        {
          id: booking.realtorSubAccountCode,
          transaction_split_ratio: Math.round(realtorPercentage),
        },
      ],
    };

    const response = await flutterwaveClient.post("/payments", payload);

    return {
      authorization_url: response.data.data.link,
      access_code: response.data.data.link,
      reference: payload.tx_ref,
    };
  } catch (error: any) {
    logger.error(
      "Error initializing Flutterwave split payment:",
      error.response?.data || error.message
    );
    throw new Error("Failed to initialize payment");
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
    .createHmac("sha256", config.FLUTTERWAVE_SECRET_KEY || "")
    .update(payload, "utf8")
    .digest("hex");

  return hash === signature;
};

/**
 * Initiate transfer to bank account (for escrow payouts)
 */
export const initiateTransfer = async (data: {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency?: string;
  reference?: string;
  beneficiary_name?: string;
}) => {
  try {
    const payload = {
      account_bank: data.account_bank,
      account_number: data.account_number,
      amount: data.amount,
      narration: data.narration,
      currency: data.currency || "NGN",
      reference: data.reference || `transfer_${Date.now()}`,
      debit_currency: data.currency || "NGN",
      ...(data.beneficiary_name && { beneficiary_name: data.beneficiary_name }),
    };

    const response = await withPaymentRetry(
      () => flutterwaveClient.post("/transfers", payload),
      "initiateTransfer",
      "flutterwave"
    );
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Flutterwave transfer error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to initiate transfer"
    );
  }
};

/**
 * Verify transfer status
 */
export const verifyTransfer = async (transferId: string) => {
  try {
    const response = await flutterwaveClient.get(`/transfers/${transferId}`);
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Flutterwave verify transfer error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to verify transfer"
    );
  }
};

/**
 * Initiate bulk transfer
 */
export const initiateBulkTransfer = async (
  transfers: Array<{
    account_bank: string;
    account_number: string;
    amount: number;
    narration: string;
    currency?: string;
    reference?: string;
  }>
) => {
  try {
    const payload = {
      title: `Bulk Transfer ${Date.now()}`,
      bulk_data: transfers.map((t) => ({
        bank_code: t.account_bank,
        account_number: t.account_number,
        amount: t.amount,
        narration: t.narration,
        currency: t.currency || "NGN",
        reference: t.reference || `bulk_${Date.now()}_${Math.random()}`,
      })),
    };

    const response = await flutterwaveClient.post("/bulk-transfers", payload);
    return response.data.data;
  } catch (error: any) {
    logger.error(
      "Flutterwave bulk transfer error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to initiate bulk transfer"
    );
  }
};

export const flutterwaveService = {
  createSubAccount,
  initializeFlutterwavePayment,
  initializeSplitPayment,
  verifyFlutterwaveTransaction,
  getTransaction,
  processRefund,
  getSubAccount,
  listBanks,
  resolveAccount,
  verifyWebhookSignature,
  initiateTransfer,
  verifyTransfer,
  initiateBulkTransfer,
};
