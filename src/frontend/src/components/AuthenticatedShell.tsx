import { useState } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import LeftSidebar from './LeftSidebar';
import StaffLoginDialog from './StaffLoginDialog';
import type { TabType } from '../App';

interface AuthenticatedShellProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  allowedTabs: TabType[];
}

export default function AuthenticatedShell({ 
  children, 
  activeTab, 
  onTabChange,
  allowedTabs 
}: AuthenticatedShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staffLoginDialogOpen, setStaffLoginDialogOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOpenStaffLogin = () => {
    setStaffLoginDialogOpen(true);
    // Close sidebar on mobile after opening dialog
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onToggleSidebar={handleToggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          onOpenStaffLogin={handleOpenStaffLogin}
        />
        
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} allowedTabs={allowedTabs} />

      <StaffLoginDialog 
        open={staffLoginDialogOpen} 
        onOpenChange={setStaffLoginDialogOpen}
      />
    </div>
  );
}
