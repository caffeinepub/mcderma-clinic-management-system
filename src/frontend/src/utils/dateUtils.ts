/**
 * Date and time formatting utilities for the McDerma app.
 * All times displayed in 12-hour AM/PM format, dates in DD/MM/YY.
 */

/**
 * Format a nanosecond BigInt timestamp to 12-hour AM/PM time string.
 */
export function formatTimestamp12Hour(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  if (!ms || Number.isNaN(ms)) return "--:-- --";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "--:-- --";
  return formatTime12Hour(date);
}

/**
 * Format a Date object to 12-hour AM/PM time string.
 */
export function formatTime12Hour(date: Date): string {
  if (!date || Number.isNaN(date.getTime())) return "--:-- --";
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Format a nanosecond BigInt timestamp to DD/MM/YY date string.
 */
export function formatTimestampDDMMYY(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  if (!ms || Number.isNaN(ms)) return "--/--/--";
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "--/--/--";
  return formatDateDDMMYY(date);
}

/**
 * Format a Date object to DD/MM/YY date string.
 */
export function formatDateDDMMYY(date: Date): string {
  if (!date || Number.isNaN(date.getTime())) return "--/--/--";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date object to DD/MM/YY HH:MM AM/PM string.
 */
export function formatDateTime12Hour(date: Date): string {
  if (!date || Number.isNaN(date.getTime())) return "--/--/-- --:-- --";
  return `${formatDateDDMMYY(date)} ${formatTime12Hour(date)}`;
}
