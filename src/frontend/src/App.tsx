import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useBackendAwareSync } from './hooks/useBackendAwareSync';
import { useStaffSession } from './staff/useStaffSession';
import AuthenticatedShell from './components/AuthenticatedShell';
import ScheduleTab from './pages/ScheduleTab';
import PatientsTab from './pages/PatientsTab';
import LeadsTab from './pages/LeadsTab';
import SettingsTab from './pages/SettingsTab';
import WidgetView from './pages/WidgetView';
import LoginPage from './pages/LoginPage';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export type TabType = 'schedule' | 'patients' | 'leads' | 'settings';

function AppContent() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  const [currentRoute, setCurrentRoute] = useState<string>('');
  const { staffSession, canAccessTab } = useStaffSession();

  const isAuthenticated = !!identity;

  // Initialize automatic background sync for authenticated users
  useBackendAwareSync();

  // Simple hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      setCurrentRoute(hash);
    };

    handleHashChange(); // Set initial route
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Enforce staff permissions - redirect to first allowed tab if current tab is restricted
  useEffect(() => {
    if (staffSession && !canAccessTab(activeTab)) {
      // Find first allowed tab
      const allowedTabs: TabType[] = ['schedule', 'patients', 'leads', 'settings'];
      const firstAllowed = allowedTabs.find(tab => canAccessTab(tab));
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [staffSession, activeTab, canAccessTab]);

  // Show loading state while checking authentication
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Widget view route - accessible without full app chrome
  if (currentRoute === '/widget') {
    if (!isAuthenticated) {
      return <LoginPage />;
    }
    return <WidgetView />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show profile setup if user is authenticated but has no profile
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Get allowed tabs for staff mode
  const allowedTabs: TabType[] = staffSession
    ? (['schedule', 'patients', 'leads', 'settings'] as TabType[]).filter(tab => canAccessTab(tab))
    : ['schedule', 'patients', 'leads', 'settings'];

  return (
    <AuthenticatedShell activeTab={activeTab} onTabChange={setActiveTab} allowedTabs={allowedTabs}>
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'schedule' && canAccessTab('schedule') && <ScheduleTab />}
        {activeTab === 'patients' && canAccessTab('patients') && <PatientsTab />}
        {activeTab === 'leads' && canAccessTab('leads') && <LeadsTab />}
        {activeTab === 'settings' && canAccessTab('settings') && <SettingsTab />}
      </div>

      {showProfileSetup && <ProfileSetupDialog />}
    </AuthenticatedShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
