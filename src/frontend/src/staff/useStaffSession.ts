import { useState, useEffect } from 'react';
import type { TabType } from '../App';
import { useGetStaffPermissions } from '../hooks/useQueries';

interface StaffSession {
  name: string;
  role: string;
}

const STORAGE_KEY = 'staff_session';

export function useStaffSession() {
  const [staffSession, setStaffSessionState] = useState<StaffSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const { data: allPermissions = {} } = useGetStaffPermissions();

  // Persist to sessionStorage
  useEffect(() => {
    if (staffSession) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(staffSession));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [staffSession]);

  const setStaffSession = (session: StaffSession | null) => {
    setStaffSessionState(session);
  };

  const clearStaffSession = () => {
    setStaffSessionState(null);
  };

  const canAccessTab = (tab: TabType): boolean => {
    // If no staff session, clinic owner has full access
    if (!staffSession) return true;

    const permissions = allPermissions[staffSession.name];
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

  return {
    staffSession,
    setStaffSession,
    clearStaffSession,
    canAccessTab,
  };
}
