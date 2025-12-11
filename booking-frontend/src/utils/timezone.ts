/**
 * Timezone utilities for consistent UTC handling
 *
 * IMPORTANT: Backend stores all dates in UTC.
 * These utilities help convert UTC to local time for display.
 */

/**
 * Format UTC date to local date string
 */
export function formatToLocal(
  date: Date | string,
  format: "full" | "date" | "time" | "datetime" = "datetime"
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {};

  switch (format) {
    case "full":
      options.dateStyle = "full";
      options.timeStyle = "long";
      break;
    case "date":
      options.dateStyle = "medium";
      break;
    case "time":
      options.timeStyle = "short";
      break;
    case "datetime":
      options.dateStyle = "medium";
      options.timeStyle = "short";
      break;
  }

  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Format UTC date to relative time (e.g., "2 hours ago")
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;

  return formatToLocal(d, "date");
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() > Date.now();
}

/**
 * Get difference in hours between now and date
 */
export function hoursUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}

/**
 * Get difference in minutes between now and date
 */
export function minutesUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return (d.getTime() - Date.now()) / (1000 * 60);
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Check if dispute window is still open (client-side check)
 * Backend has authoritative check
 */
export function isUserDisputeWindowOpen(checkInTime: Date | string): boolean {
  const checkIn =
    typeof checkInTime === "string" ? new Date(checkInTime) : checkInTime;
  const oneHourAfter = new Date(checkIn.getTime() + 60 * 60 * 1000);
  return Date.now() < oneHourAfter.getTime();
}

/**
 * Check if realtor dispute window is still open (client-side check)
 * Backend has authoritative check
 */
export function isRealtorDisputeWindowOpen(
  checkOutTime: Date | string
): boolean {
  const checkOut =
    typeof checkOutTime === "string" ? new Date(checkOutTime) : checkOutTime;
  const twoHoursAfter = new Date(checkOut.getTime() + 2 * 60 * 60 * 1000);
  return Date.now() < twoHoursAfter.getTime();
}

/**
 * Get remaining time in dispute window
 */
export function getDisputeWindowRemaining(
  time: Date | string,
  windowHours: number
): string {
  const t = typeof time === "string" ? new Date(time) : time;
  const windowEnd = new Date(t.getTime() + windowHours * 60 * 60 * 1000);
  const remainingMs = windowEnd.getTime() - Date.now();

  if (remainingMs <= 0) return "Expired";

  return formatDuration(remainingMs) + " remaining";
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function formatForInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

/**
 * Format datetime for input fields (YYYY-MM-DDTHH:MM)
 */
export function formatForDatetimeInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 16);
}

/**
 * Parse input date to UTC Date object
 */
export function parseFromInput(input: string): Date {
  return new Date(input);
}
