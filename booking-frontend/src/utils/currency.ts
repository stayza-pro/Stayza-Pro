/**
 * Format price with proper decimal precision
 * Handles floating-point precision issues by rounding to 2 decimal places
 */
export function formatPrice(
  price: number | string,
  _currency: string = "NGN"
): string {
  void _currency;
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(numPrice)) {
    return "₦0";
  }

  const rounded = Math.round(numPrice * 100) / 100;

  return `₦${rounded.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format price as a plain number string without currency symbol
 * Useful for input fields
 */
export function formatPriceNumber(price: number | string): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(numPrice)) {
    return "0";
  }
  const rounded = Math.round(numPrice * 100) / 100;
  return rounded.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Fix floating-point precision for a price value
 * Returns a properly rounded number
 */
export function fixPricePrecision(price: number | string): number {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (!Number.isFinite(numPrice)) {
    return 0;
  }
  return Math.round(numPrice * 100) / 100;
}
