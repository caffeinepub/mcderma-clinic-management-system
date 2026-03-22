import { useState } from "react";
import BottomNav from "./BottomNav";
import Header from "./Header";
import LeftSidebar from "./LeftSidebar";

type TabId = "schedule" | "patients" | "leads" | "history" | "settings";

interface AuthenticatedShellProps {
  children: React.ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function AuthenticatedShell({
  children,
  activeTab,
  onTabChange,
}: AuthenticatedShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allTabs: Array<TabId> = [
    "schedule",
    "patients",
    "leads",
    "history",
    "settings",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Header onToggleSidebar={() => setSidebarOpen(true)} />
      <LeftSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pb-20 pt-2">
        <div className="container mx-auto px-4 py-4 max-w-7xl">{children}</div>
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        allowedTabs={allTabs}
      />
    </div>
  );
}
