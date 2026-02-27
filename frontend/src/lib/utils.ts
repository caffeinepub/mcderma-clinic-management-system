import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime12Hour(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTimestamp12Hour(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return formatTime12Hour(date);
}

export function formatDateDDMMYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

export function formatTimestampDDMMYY(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return formatDateDDMMYY(date);
}

export function formatDateTime12Hour(date: Date): string {
  return `${formatDateDDMMYY(date)} ${formatTime12Hour(date)}`;
}

export function formatDateTimestamp12Hour(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1000000);
  return formatDateTime12Hour(date);
}
