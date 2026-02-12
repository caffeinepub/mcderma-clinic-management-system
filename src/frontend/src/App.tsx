import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useBackendAwareSync } from './hooks/useBackendAwareSync';
import { useNotifications } from './hooks/useNotifications';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ScheduleTab from './pages/ScheduleTab';
import PatientsTab from './pages/PatientsTab';
import LeadsTab from './pages/LeadsTab';
import SettingsTab from './pages/SettingsTab';
import WidgetView from './pages/WidgetView';
import LoginPage from './pages/LoginPage';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import AppointmentReminderOverlay from './components/AppointmentReminderOverlay';
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

  const isAuthenticated = !!identity;

  // Initialize automatic background sync for authenticated users
  useBackendAwareSync();

  // Initialize notification system for appointment reminders
  const { activeReminder, dismissReminder } = useNotifications();

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

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto px-4 py-6">
          {activeTab === 'schedule' && <ScheduleTab />}
          {activeTab === 'patients' && <PatientsTab />}
          {activeTab === 'leads' && <LeadsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showProfileSetup && <ProfileSetupDialog />}
      
      {/* Full-screen appointment reminder overlay */}
      {activeReminder && (
        <AppointmentReminderOverlay
          appointment={activeReminder.appointment}
          onDismiss={dismissReminder}
        />
      )}
    </div>
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
