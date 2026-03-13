import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import AuthenticatedShell from "./components/AuthenticatedShell";
import ProfileSetupDialog from "./components/ProfileSetupDialog";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import LeadsTab from "./pages/LeadsTab";
import LoginPage from "./pages/LoginPage";
import PatientsTab from "./pages/PatientsTab";
import ScheduleTab from "./pages/ScheduleTab";
import SettingsTab from "./pages/SettingsTab";

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "schedule" | "patients" | "leads" | "settings"
  >("schedule");

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (
      isAuthenticated &&
      !profileLoading &&
      isFetched &&
      userProfile === null
    ) {
      setShowProfileSetup(true);
    } else if (userProfile) {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile]);

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginPage />
        <Toaster position="top-center" />
      </ThemeProvider>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "schedule":
        return <ScheduleTab />;
      case "patients":
        return <PatientsTab />;
      case "leads":
        return <LeadsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return <ScheduleTab />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthenticatedShell activeTab={activeTab} onTabChange={setActiveTab}>
        {renderTabContent()}
      </AuthenticatedShell>
      {showProfileSetup && <ProfileSetupDialog />}
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
