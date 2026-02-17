/**
 * Format number as currency (Naira)
 */
export const formatCurrency = (
  amount: number,
  _currency: string = "NGN"
): string => {
  void _currency;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₦${safeAmount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format date and time to readable string
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};
