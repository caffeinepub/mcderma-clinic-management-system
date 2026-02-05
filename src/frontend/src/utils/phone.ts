/**
 * Normalizes a phone number by removing all whitespace characters.
 * This ensures consistent formatting for phone numbers imported from contacts.
 * 
 * @param phone - The phone number string to normalize
 * @returns The normalized phone number with all spaces removed
 * 
 * @example
 * normalizePhoneNumber("+91 88988 00777") // returns "+918898800777"
 * normalizePhoneNumber("+1 234 567 8900") // returns "+12345678900"
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, '');
}
