import api from "./api";

export interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string | null;
  pay_with_bank: boolean;
  active: boolean;
  is_deleted: boolean;
  country: string;
  currency: string;
  type: string;
}

export interface BankAccountVerification {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface PayoutSettings {
  hasPayoutAccount: boolean;
  subAccountCode?: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export const payoutService = {
  /**
   * Get list of Nigerian banks
   */
  getBanks: async (): Promise<Bank[]> => {
    const response = await api.get("/realtors/payout/banks");
    return response.data.data;
  },

  /**
   * Verify bank account
   */
  verifyBankAccount: async (
    accountNumber: string,
    bankCode: string
  ): Promise<BankAccountVerification> => {
    const response = await api.post("/realtors/payout/verify", {
      accountNumber,
      bankCode,
    });
    return response.data.data;
  },

  /**
   * Save bank account and create Paystack subaccount
   */
  saveBankAccount: async (data: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => {
    const response = await api.post("/realtors/payout/account", data);
    return response.data;
  },

  /**
   * Get payout settings
   */
  getPayoutSettings: async (): Promise<PayoutSettings> => {
    const response = await api.get("/realtors/payout/settings");
    return response.data.data;
  },
};
