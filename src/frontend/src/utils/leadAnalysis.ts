import type { Lead, Appointment } from '../backend';
import { normalizePhone } from './phone';
import { extractTreatmentFromNotes, normalizeTreatment } from './treatment';

export type LeadCategory = 'Hair Transplant' | 'Skin Related Problem' | 'Other';

export interface CategoryAnalytics {
  category: LeadCategory;
  generated: number;
  converted: number;
}

/**
 * Categorize a lead based on its treatmentWanted field.
 * 
 * Rules:
 * - Hair Transplant: contains "hair" and/or "transplant" (case-insensitive)
 * - Skin Related Problem: contains "skin" (case-insensitive)
 * - Other: everything else
 */
export function categorizeLeadByTreatment(treatmentWanted: string): LeadCategory {
  const normalized = treatmentWanted.toLowerCase();
  
  if (normalized.includes('hair') || normalized.includes('transplant')) {
    return 'Hair Transplant';
  }
  
  if (normalized.includes('skin')) {
    return 'Skin Related Problem';
  }
  
  return 'Other';
}

/**
 * Check if a lead has been converted to an appointment.
 * 
 * Conversion logic:
 * - There exists at least one appointment with the same normalized mobile number
 * - The appointment notes contain a parsable "Treatment:" value that matches
 *   the lead's treatmentWanted after normalization
 */
export function isLeadConverted(lead: Lead, appointments: Appointment[]): boolean {
  const leadMobile = normalizePhone(lead.mobile);
  
  // Find appointments with matching mobile number
  const matchingAppointments = appointments.filter(apt => 
    normalizePhone(apt.mobile) === leadMobile
  );
  
  if (matchingAppointments.length === 0) {
    return false;
  }
  
  // Check if any appointment has a treatment that matches the lead's treatmentWanted
  const leadTreatmentNormalized = normalizeTreatment(lead.treatmentWanted);
  
  return matchingAppointments.some(apt => {
    const appointmentTreatment = extractTreatmentFromNotes(apt.notes);
    if (!appointmentTreatment) {
      return false;
    }
    
    const appointmentTreatmentNormalized = normalizeTreatment(appointmentTreatment);
    
    // Check if the appointment treatment contains or matches the lead treatment
    return appointmentTreatmentNormalized.includes(leadTreatmentNormalized) ||
           leadTreatmentNormalized.includes(appointmentTreatmentNormalized);
  });
}

/**
 * Compute lead analytics by category.
 * 
 * @param leads - Array of all leads
 * @param appointments - Array of all appointments
 * @returns Array of analytics per category
 */
export function computeLeadAnalytics(
  leads: Lead[],
  appointments: Appointment[]
): CategoryAnalytics[] {
  const categories: LeadCategory[] = ['Hair Transplant', 'Skin Related Problem', 'Other'];
  
  return categories.map(category => {
    // Filter leads by category
    const categoryLeads = leads.filter(lead => 
      categorizeLeadByTreatment(lead.treatmentWanted) === category
    );
    
    // Count converted leads
    const convertedCount = categoryLeads.filter(lead => 
      isLeadConverted(lead, appointments)
    ).length;
    
    return {
      category,
      generated: categoryLeads.length,
      converted: convertedCount,
    };
  });
}
