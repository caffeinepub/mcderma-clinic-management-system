import type { Lead } from '../hooks/useQueries';
import type { Appointment } from '../hooks/useQueries';
import { normalizeTreatment, treatmentsMatch } from './treatment';

export type TreatmentCategory = 'Hair Transplant' | 'Skin Related Problem' | 'Other';

export function categorizeTreatment(treatment: string): TreatmentCategory {
  const t = treatment.toLowerCase();
  if (t.includes('hair') || t.includes('transplant') || t.includes('ht')) {
    return 'Hair Transplant';
  }
  if (
    t.includes('skin') ||
    t.includes('acne') ||
    t.includes('laser') ||
    t.includes('peel') ||
    t.includes('facial') ||
    t.includes('pigment') ||
    t.includes('scar') ||
    t.includes('botox') ||
    t.includes('filler') ||
    t.includes('prp') ||
    t.includes('derma')
  ) {
    return 'Skin Related Problem';
  }
  return 'Other';
}

export function isLeadConverted(lead: Lead, appointments: Appointment[]): boolean {
  return appointments.some((appt) => {
    const mobileMatch =
      appt.mobile.replace(/\D/g, '') === lead.mobile.replace(/\D/g, '');
    const treatmentMatch = treatmentsMatch(appt.notes, lead.treatmentWanted);
    return mobileMatch || treatmentMatch;
  });
}

export interface CategoryStats {
  category: TreatmentCategory;
  generated: number;
  converted: number;
}

export function computeCategoryStats(
  leads: Lead[],
  appointments: Appointment[]
): CategoryStats[] {
  const categories: TreatmentCategory[] = ['Hair Transplant', 'Skin Related Problem', 'Other'];
  return categories.map((category) => {
    const categoryLeads = leads.filter(
      (l) => categorizeTreatment(l.treatmentWanted) === category
    );
    const converted = categoryLeads.filter((l) =>
      isLeadConverted(l, appointments)
    ).length;
    return {
      category,
      generated: categoryLeads.length,
      converted,
    };
  });
}
