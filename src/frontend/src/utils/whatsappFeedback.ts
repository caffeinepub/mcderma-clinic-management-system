/**
 * Utility for WhatsApp feedback message generation and validation
 */

const FEEDBACK_MESSAGE = `Loved your visit? Please leave us a quick Google review ⭐
👉 http://bit.ly/4c8pOFJ

Or
Scan below barcode for Google Map review and Follow us on Instagram`;

/**
 * Get the feedback message content
 * @returns The feedback message text
 */
export function getFeedbackMessage(): string {
  return FEEDBACK_MESSAGE;
}

/**
 * Validates and sanitizes a mobile number for WhatsApp
 * @param mobile - The mobile number to validate
 * @returns Object with isValid flag and sanitized mobile number
 */
export function validateMobileForWhatsApp(mobile: string): { isValid: boolean; sanitized: string } {
  if (!mobile || mobile.trim() === '') {
    return { isValid: false, sanitized: '' };
  }

  // Remove all non-digit characters
  const sanitized = mobile.replace(/\D/g, '');

  // Check if we have a valid number (at least 10 digits)
  if (sanitized.length < 10) {
    return { isValid: false, sanitized };
  }

  return { isValid: true, sanitized };
}

/**
 * Generates a WhatsApp URL with the feedback message
 * @param mobile - The patient's mobile number
 * @returns WhatsApp URL or null if mobile is invalid
 */
export function generateWhatsAppFeedbackURL(mobile: string): string | null {
  const { isValid, sanitized } = validateMobileForWhatsApp(mobile);

  if (!isValid) {
    return null;
  }

  const encodedMessage = encodeURIComponent(FEEDBACK_MESSAGE);
  return `https://wa.me/${sanitized}?text=${encodedMessage}`;
}

/**
 * Opens WhatsApp with the feedback message
 * @param mobile - The patient's mobile number
 * @returns true if successful, false if mobile is invalid
 */
export function openWhatsAppFeedback(mobile: string): boolean {
  const url = generateWhatsAppFeedbackURL(mobile);

  if (!url) {
    return false;
  }

  window.open(url, '_blank');
  return true;
}
