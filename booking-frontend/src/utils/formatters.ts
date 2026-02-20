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

/**
 * Format a property scheduled time string (e.g. "14:00" or "3:00 PM") into
 * a human-readable 12-hour format like "2:00 PM".
 * Also handles already-formatted strings like "3:00 PM" by passing them through.
 */
export const formatPropertyTime = (value?: string | null): string => {
  if (!value) return "";
  // Already in 12-hour format (contains AM/PM)
  if (/[AaPp][Mm]/.test(value)) return value;
  // "HH:MM" or "H:MM" 24-hour format
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }
  return value;
};
