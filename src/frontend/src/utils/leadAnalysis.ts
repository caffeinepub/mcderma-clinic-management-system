import type { Lead } from '../hooks/useQueries';
import type { Appointment } from '../backend';
import { normalizeTreatment, treatmentsMatch } from './treatment';

export interface LeadAnalytics {
  category: string;
  generated: number;
  converted: number;
}

/**
 * Categorize a lead based on treatment type
 */
function categorizeLead(lead: Lead): string {
  const treatment = lead.treatmentWanted.toLowerCase();
  
  if (treatment.includes('hair') || treatment.includes('transplant')) {
    return 'Hair Transplant';
  } else if (treatment.includes('skin') || treatment.includes('acne') || treatment.includes('pigmentation')) {
    return 'Skin Related Problem';
  } else {
    return 'Other';
  }
}

/**
 * Check if a lead has been converted (has a matching appointment)
 */
function isLeadConverted(lead: Lead, appointments: Appointment[]): boolean {
  return appointments.some(apt => {
    // Match by mobile number
    if (apt.mobile !== lead.mobile) return false;
    
    // Check if appointment notes contain the treatment
    return treatmentsMatch(apt.notes, lead.treatmentWanted);
  });
}

/**
 * Compute lead analytics by category
 */
export function computeLeadAnalytics(leads: Lead[], appointments: Appointment[]): LeadAnalytics[] {
  const categories = ['Hair Transplant', 'Skin Related Problem', 'Other'];
  
  const analytics: LeadAnalytics[] = categories.map(category => ({
    category,
    generated: 0,
    converted: 0,
  }));

  leads.forEach(lead => {
    const category = categorizeLead(lead);
    const categoryData = analytics.find(a => a.category === category);
    
    if (categoryData) {
      categoryData.generated++;
      if (isLeadConverted(lead, appointments)) {
        categoryData.converted++;
      }
    }
  });

  return analytics;
}
