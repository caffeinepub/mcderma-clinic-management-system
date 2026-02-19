/**
 * Utility module for managing WhatsApp templates for leads
 */

export interface LeadTemplateData {
  leadName: string;
  mobile: string;
  treatmentWanted: string;
  clinicName?: string;
}

/**
 * Default WhatsApp templates for lead communication
 */
export const DEFAULT_LEAD_TEMPLATES = {
  initialContact: 'Hello {leadName}! Thank you for your interest in {treatmentWanted}. We would love to discuss your requirements. When would be a good time to connect?',
  followUp: 'Hi {leadName}, following up on your inquiry about {treatmentWanted}. Are you still interested? We have some great options available for you.',
  appointmentScheduling: 'Hello {leadName}! We are ready to schedule your appointment for {treatmentWanted}. Please let us know your preferred date and time.',
};

/**
 * Generate a personalized WhatsApp message for a lead using a template
 * @param template - The message template with placeholders
 * @param data - Lead data to fill placeholders
 * @returns Personalized message
 */
export function generateLeadMessage(template: string, data: LeadTemplateData): string {
  return template
    .replace(/{leadName}/g, data.leadName)
    .replace(/{treatmentWanted}/g, data.treatmentWanted)
    .replace(/{clinicName}/g, data.clinicName || 'our clinic');
}

/**
 * Get the initial contact message for a lead
 * @param data - Lead data
 * @param customTemplate - Optional custom template
 * @returns Formatted message
 */
export function getLeadInitialContactMessage(data: LeadTemplateData, customTemplate?: string): string {
  const template = customTemplate || DEFAULT_LEAD_TEMPLATES.initialContact;
  return generateLeadMessage(template, data);
}

/**
 * Get the follow-up message for a lead
 * @param data - Lead data
 * @param customTemplate - Optional custom template
 * @returns Formatted message
 */
export function getLeadFollowUpMessage(data: LeadTemplateData, customTemplate?: string): string {
  const template = customTemplate || DEFAULT_LEAD_TEMPLATES.followUp;
  return generateLeadMessage(template, data);
}

/**
 * Get the appointment scheduling message for a lead
 * @param data - Lead data
 * @param customTemplate - Optional custom template
 * @returns Formatted message
 */
export function getLeadAppointmentMessage(data: LeadTemplateData, customTemplate?: string): string {
  const template = customTemplate || DEFAULT_LEAD_TEMPLATES.appointmentScheduling;
  return generateLeadMessage(template, data);
}

/**
 * Open WhatsApp with a lead message
 * @param mobile - Lead's mobile number
 * @param message - Message to send
 * @returns true if successful
 */
export function openWhatsAppWithLeadMessage(mobile: string, message: string): boolean {
  if (!mobile || !message) {
    return false;
  }

  // Remove all non-digit characters
  const sanitizedMobile = mobile.replace(/\D/g, '');

  if (sanitizedMobile.length < 10) {
    return false;
  }

  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${sanitizedMobile}?text=${encodedMessage}`;
  
  window.open(url, '_blank');
  return true;
}
