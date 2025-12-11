/**
 * Timezone utilities for consistent UTC handling
 *
 * IMPORTANT: All dates in the system are stored and processed in UTC.
 * Database timestamps are in UTC. JavaScript Date objects work in UTC internally.
 * Only convert to local timezone for display purposes in the frontend.
 */

/**
 * Get current UTC timestamp
 */
export function getCurrentUTC(): Date {
  return new Date();
}

/**
 * Add hours to a UTC timestamp
 */
export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Add minutes to a UTC timestamp
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Subtract hours from a UTC timestamp
 */
export function subtractHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

/**
 * Subtract minutes from a UTC timestamp
 */
export function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

/**
 * Check if date1 is before date2 (UTC comparison)
 */
export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

/**
 * Check if date1 is after date2 (UTC comparison)
 */
export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

/**
 * Get difference in milliseconds between two dates
 */
export function diffInMs(date1: Date, date2: Date): number {
  return date1.getTime() - date2.getTime();
}

/**
 * Get difference in hours between two dates
 */
export function diffInHours(date1: Date, date2: Date): number {
  return diffInMs(date1, date2) / (60 * 60 * 1000);
}

/**
 * Get difference in minutes between two dates
 */
export function diffInMinutes(date1: Date, date2: Date): number {
  return diffInMs(date1, date2) / (60 * 1000);
}

/**
 * Format date for logging (ISO 8601 UTC)
 */
export function formatForLog(date: Date): string {
  return date.toISOString();
}

/**
 * Check if a timestamp has passed (is in the past)
 */
export function hasPassed(date: Date): boolean {
  return isBefore(date, getCurrentUTC());
}

/**
 * Check if a timestamp is in the future
 */
export function isFuture(date: Date): boolean {
  return isAfter(date, getCurrentUTC());
}
