interface ContactPickerResult {
  name: string;
  mobile: string;
}

interface ContactPickerError {
  type: 'unsupported' | 'permission-denied' | 'no-selection' | 'unknown';
  message: string;
}

export function useContactPicker() {
  const pickContact = async (): Promise<ContactPickerResult> => {
    // Check if Contact Picker API is supported
    if (!('contacts' in navigator) || !('ContactsManager' in window)) {
      const error: ContactPickerError = {
        type: 'unsupported',
        message: 'Phonebook access is not available on this device. Please enter details manually.',
      };
      throw error;
    }

    try {
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
      
      if (!contacts || contacts.length === 0) {
        const error: ContactPickerError = {
          type: 'no-selection',
          message: 'No contact selected. Please try again or enter details manually.',
        };
        throw error;
      }

      const contact = contacts[0];
      const name = contact.name?.[0] || '';
      
      // Deterministically select the first phone number
      const mobile = contact.tel?.[0] || '';

      if (!name && !mobile) {
        const error: ContactPickerError = {
          type: 'unknown',
          message: 'Could not read contact information. Please enter details manually.',
        };
        throw error;
      }

      return { name, mobile };
    } catch (error: any) {
      // Handle permission denied or user cancellation
      if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
        const permissionError: ContactPickerError = {
          type: 'permission-denied',
          message: 'Phonebook access was denied. Please enter details manually.',
        };
        throw permissionError;
      }

      // If it's already our custom error, re-throw it
      if (error.type) {
        throw error;
      }

      // Unknown error
      const unknownError: ContactPickerError = {
        type: 'unknown',
        message: 'Failed to access phonebook. Please enter details manually.',
      };
      throw unknownError;
    }
  };

  return { pickContact };
}
