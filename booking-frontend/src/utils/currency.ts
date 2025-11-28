/**
 * Format price with proper decimal precision
 * Handles floating-point precision issues by rounding to 2 decimal places
 */
export function formatPrice(
  price: number | string,
  currency: string = "NGN"
): string {
  // Convert to number and handle any precision issues
  const numPrice = typeof price === "string" ? parseFloat(price) : price;

  // Round to 2 decimal places to fix floating-point issues
  const rounded = Math.round(numPrice * 100) / 100;

  // Format with currency symbol
  const currencySymbols: Record<string, string> = {
    NGN: "₦",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const symbol = currencySymbols[currency] || currency;

  // Use toLocaleString for proper number formatting
  return `${symbol}${rounded.toLocaleString("en-US", {
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
  const rounded = Math.round(numPrice * 100) / 100;
  return rounded.toLocaleString("en-US", {
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
  return Math.round(numPrice * 100) / 100;
}
