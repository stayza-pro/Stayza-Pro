import { prisma } from "@/config/database";
import {
  createSubAccount,
  createTransferRecipient,
  getSubAccount,
  listBanks,
} from "@/services/paystack";
import { logger } from "@/utils/logger";

export interface UpsertRealtorPayoutAccountInput {
  realtorId: string;
  businessName: string;
  businessEmail: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface UpsertRealtorPayoutAccountResult {
  transferRecipientCode: string;
  subAccountCode: string | null;
}

const normalizeText = (value?: string | null): string =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const resolveBankByName = async (
  bankName: string
): Promise<{ code: string; name: string } | null> => {
  if (!bankName) return null;

  const normalizedTarget = normalizeText(bankName);
  if (!normalizedTarget) return null;

  try {
    const banks = await listBanks();
    const exact = banks.find(
      (bank: any) => normalizeText(bank?.name) === normalizedTarget
    );

    if (exact?.code) {
      return { code: String(exact.code), name: String(exact.name || bankName) };
    }

    const contains = banks.find((bank: any) => {
      const candidate = normalizeText(bank?.name);
      return (
        candidate.includes(normalizedTarget) ||
        normalizedTarget.includes(candidate)
      );
    });

    if (contains?.code) {
      return {
        code: String(contains.code),
        name: String(contains.name || bankName),
      };
    }
  } catch (error: any) {
    logger.warn("Failed to resolve bank code from name", {
      bankName,
      error: error.message,
    });
  }

  return null;
};

const createRecipient = async (params: {
  realtorId: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName?: string;
}) => {
  const recipient = await createTransferRecipient({
    type: "nuban",
    name: params.accountName,
    account_number: params.accountNumber,
    bank_code: params.bankCode,
    currency: "NGN",
    metadata: {
      realtor_id: params.realtorId,
      bank_name: params.bankName,
    },
  });

  const recipientCode = recipient?.recipient_code;
  if (!recipientCode) {
    throw new Error("Paystack did not return a transfer recipient code");
  }

  return recipientCode as string;
};

export const maskAccountNumber = (
  accountNumber?: string | null
): string | null => {
  if (!accountNumber) return null;
  const normalized = accountNumber.trim();
  if (normalized.length <= 4) return normalized;
  return `${"*".repeat(Math.max(normalized.length - 4, 0))}${normalized.slice(
    -4
  )}`;
};

export const hasConfiguredPayoutAccount = (realtor: {
  paystackTransferRecipientCode?: string | null;
  paystackSubAccountCode?: string | null;
  payoutAccountNumber?: string | null;
}) =>
  Boolean(
    realtor.paystackTransferRecipientCode ||
      realtor.paystackSubAccountCode ||
      realtor.payoutAccountNumber
  );

/**
 * Create and store a valid transfer recipient for realtor withdrawals.
 * A subaccount is also created when possible for backwards compatibility.
 */
export const upsertRealtorPayoutAccount = async (
  input: UpsertRealtorPayoutAccountInput
): Promise<UpsertRealtorPayoutAccountResult> => {
  const transferRecipientCode = await createRecipient({
    realtorId: input.realtorId,
    accountName: input.accountName,
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
    bankName: input.bankName,
  });

  let subAccountCode: string | null = null;
  try {
    const subAccountData = await createSubAccount({
      id: input.realtorId,
      businessName: input.businessName,
      businessEmail: input.businessEmail,
      bankCode: input.bankCode,
      accountNumber: input.accountNumber,
    });
    subAccountCode = subAccountData?.subaccount_code || null;
  } catch (error: any) {
    logger.warn("Paystack subaccount creation failed; continuing with recipient", {
      realtorId: input.realtorId,
      error: error.message,
    });
  }

  const updateData: Record<string, any> = {
    paystackTransferRecipientCode: transferRecipientCode,
    payoutBankCode: input.bankCode,
    payoutBankName: input.bankName,
    payoutAccountNumber: input.accountNumber,
    payoutAccountName: input.accountName,
  };

  if (subAccountCode) {
    updateData.paystackSubAccountCode = subAccountCode;
  }

  await prisma.realtor.update({
    where: { id: input.realtorId },
    data: updateData,
  });

  return {
    transferRecipientCode,
    subAccountCode,
  };
};

/**
 * Ensure realtor has a transfer recipient code usable for /transfer payouts.
 * Supports older data by creating recipient from stored bank fields or subaccount.
 */
export const ensureRealtorTransferRecipientCode = async (
  realtorId: string
): Promise<string> => {
  const realtor = await prisma.realtor.findUnique({
    where: { id: realtorId },
    select: {
      id: true,
      businessName: true,
      paystackTransferRecipientCode: true,
      paystackSubAccountCode: true,
      payoutBankCode: true,
      payoutBankName: true,
      payoutAccountNumber: true,
      payoutAccountName: true,
    },
  });

  if (!realtor) {
    throw new Error("Realtor profile not found");
  }

  if (realtor.paystackTransferRecipientCode) {
    return realtor.paystackTransferRecipientCode;
  }

  // Preferred fallback: local bank details already stored in DB.
  if (realtor.payoutBankCode && realtor.payoutAccountNumber) {
    const recipientCode = await createRecipient({
      realtorId: realtor.id,
      accountName: realtor.payoutAccountName || realtor.businessName,
      accountNumber: realtor.payoutAccountNumber,
      bankCode: realtor.payoutBankCode,
      bankName: realtor.payoutBankName || undefined,
    });

    await prisma.realtor.update({
      where: { id: realtor.id },
      data: {
        paystackTransferRecipientCode: recipientCode,
      },
    });

    return recipientCode;
  }

  // Legacy fallback: derive bank details from existing Paystack subaccount.
  if (realtor.paystackSubAccountCode) {
    const subAccount = await getSubAccount(realtor.paystackSubAccountCode);

    const accountNumber = String(subAccount?.account_number || "").trim();
    const settlementBankName = String(subAccount?.settlement_bank || "").trim();

    let bankCode = String(
      subAccount?.bank_code ||
        subAccount?.settlement_bank_code ||
        (typeof subAccount?.bank === "string" ? subAccount?.bank : "")
    ).trim();

    let bankName = settlementBankName;

    if (!bankCode && settlementBankName) {
      const resolved = await resolveBankByName(settlementBankName);
      if (resolved) {
        bankCode = resolved.code;
        bankName = resolved.name;
      }
    }

    if (!accountNumber || !bankCode) {
      throw new Error(
        "Unable to derive payout bank details from existing Paystack subaccount. Please update payout settings."
      );
    }

    const accountName =
      realtor.payoutAccountName ||
      String(subAccount?.business_name || "").trim() ||
      realtor.businessName;

    const recipientCode = await createRecipient({
      realtorId: realtor.id,
      accountName,
      accountNumber,
      bankCode,
      bankName: bankName || undefined,
    });

    await prisma.realtor.update({
      where: { id: realtor.id },
      data: {
        paystackTransferRecipientCode: recipientCode,
        payoutBankCode: realtor.payoutBankCode || bankCode,
        payoutBankName: realtor.payoutBankName || bankName || null,
        payoutAccountNumber: realtor.payoutAccountNumber || accountNumber,
        payoutAccountName: realtor.payoutAccountName || accountName,
      },
    });

    return recipientCode;
  }

  throw new Error(
    "Payout account is not configured. Please add or update your payout settings."
  );
};
