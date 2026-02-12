/**
 * Extract treatment information from appointment notes.
 * Prefers "Treatment:" prefix (case-insensitive), otherwise returns the full notes text.
 * 
 * @param notes - The appointment notes string
 * @returns The extracted treatment string, or empty string if notes are empty
 */
export function extractTreatmentFromNotes(notes: string): string {
  if (!notes || notes.trim() === '') {
    return '';
  }

  // Look for "Treatment:" prefix (case-insensitive)
  const treatmentMatch = notes.match(/treatment:\s*(.+)/i);
  
  if (treatmentMatch && treatmentMatch[1]) {
    return treatmentMatch[1].trim();
  }

  // Fall back to full notes text
  return notes.trim();
}

/**
 * Normalize a treatment string for comparison purposes.
 * Converts to lowercase, trims whitespace, and collapses multiple spaces.
 * 
 * @param treatment - The treatment string to normalize
 * @returns The normalized treatment string
 */
export function normalizeTreatment(treatment: string): string {
  return treatment
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove punctuation
}

/**
 * Check if two treatment strings match after normalization.
 * 
 * @param treatment1 - First treatment string
 * @param treatment2 - Second treatment string
 * @returns True if treatments match after normalization
 */
export function treatmentsMatch(treatment1: string, treatment2: string): boolean {
  return normalizeTreatment(treatment1) === normalizeTreatment(treatment2);
}
