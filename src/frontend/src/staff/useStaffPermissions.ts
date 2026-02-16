import type { TabType } from '../App';

export interface StaffPermissions {
  canAccessAppointments: boolean;
  canAccessPatients: boolean;
  canAccessLeads: boolean;
  canAccessSettings: boolean;
  hasFullControl: boolean;
}

export function useStaffPermissions(
  staffName: string | null,
  allPermissions: Record<string, StaffPermissions>
) {
  const canAccessTab = (tab: TabType): boolean => {
    // If no staff name, assume clinic owner with full access
    if (!staffName) return true;

    const permissions = allPermissions[staffName];
    if (!permissions) return false;

    // Full control grants access to everything
    if (permissions.hasFullControl) return true;

    // Map tabs to permissions
    switch (tab) {
      case 'schedule':
        return permissions.canAccessAppointments;
      case 'patients':
        return permissions.canAccessPatients;
      case 'leads':
        return permissions.canAccessLeads;
      case 'settings':
        return permissions.canAccessSettings;
      default:
        return false;
    }
  };

  return { canAccessTab };
}
