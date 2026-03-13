/**
 * Default treatment options for the clinic management system.
 * These are stored in localStorage so users can add custom treatments.
 */

export const DEFAULT_TREATMENTS = [
  "Hair Transplant",
  "Hair Fall",
  "Laser Treatment",
  "Tattoo Removal",
  "Face Treatment",
];

const STORAGE_KEY = "mcderma_custom_treatments";

export function getTreatmentsList(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const custom: string[] = JSON.parse(stored);
      // Merge defaults with custom, deduplicate
      const all = [...DEFAULT_TREATMENTS];
      for (const c of custom) {
        if (!all.includes(c)) all.push(c);
      }
      return all;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_TREATMENTS];
}

export function addCustomTreatment(treatment: string): string[] {
  const trimmed = treatment.trim();
  if (!trimmed) return getTreatmentsList();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const custom: string[] = stored ? JSON.parse(stored) : [];
    const allCurrent = getTreatmentsList();
    if (
      !allCurrent.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())
    ) {
      custom.push(trimmed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    }
  } catch {
    // ignore
  }
  return getTreatmentsList();
}
