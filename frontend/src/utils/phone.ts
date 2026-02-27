/**
 * Normalize phone numbers by removing all whitespace and common separators
 * for consistent matching across the application.
 * 
 * @param phone - The phone number string to normalize
 * @returns The normalized phone number with only digits and + sign
 */
export function normalizePhone(phone: string): string {
  // Remove spaces, hyphens, parentheses, and dots
  return phone.replace(/[\s\-().]/g, '');
}
