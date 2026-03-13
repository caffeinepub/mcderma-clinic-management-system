import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a Date or timestamp (ms) to 12-hour time string, e.g. "9:30 AM" */
export function formatTime12Hour(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  if (!d || Number.isNaN(d.getTime())) return "--:-- --";
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${hours}:${mm} ${ampm}`;
}

/** Format an HH:MM string to 12-hour time, e.g. "14:30" -> "2:30 PM" */
export function formatTimeString12Hour(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let hours = Number.parseInt(hStr, 10);
  const minutes = Number.parseInt(mStr ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "";
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${hours}:${mm} ${ampm}`;
}

/** Format a timestamp (ms or nanoseconds bigint) to "h:mm AM/PM" */
export function formatTimestamp12Hour(
  timestamp: number | bigint | undefined | null,
): string {
  if (timestamp === undefined || timestamp === null) return "--:-- --";
  let ms = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  // If value looks like nanoseconds (> year 3000 in ms), convert
  if (ms > 32503680000000) ms = Math.round(ms / 1_000_000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--:-- --";
  return formatTime12Hour(d);
}

/** Format a Date or timestamp to DD/MM/YY */
export function formatDateDDMMYY(date: Date | number | string): string {
  const d =
    typeof date === "string"
      ? new Date(date)
      : typeof date === "number"
        ? new Date(date)
        : date;
  if (!d || Number.isNaN(d.getTime())) return "--/--/--";
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yy = d.getFullYear().toString().slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Format a timestamp (ms or nanoseconds bigint) to DD/MM/YY */
export function formatTimestampDDMMYY(
  timestamp: number | bigint | undefined | null,
): string {
  if (timestamp === undefined || timestamp === null) return "--/--/--";
  let ms = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  if (ms > 32503680000000) ms = Math.round(ms / 1_000_000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--/--/--";
  return formatDateDDMMYY(d);
}

/** Format a Date or timestamp to "DD/MM/YY h:mm AM/PM" */
export function formatDateTime12Hour(date: Date | number | bigint): string {
  let ms =
    typeof date === "bigint"
      ? Number(date)
      : typeof date === "number"
        ? date
        : (date as Date).getTime();
  if (ms > 32503680000000) ms = Math.round(ms / 1_000_000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--/--/-- --:-- --";
  return `${formatDateDDMMYY(d)} ${formatTime12Hour(d)}`;
}
