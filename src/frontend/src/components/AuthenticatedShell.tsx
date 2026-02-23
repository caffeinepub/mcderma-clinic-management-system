import { useState } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import LeftSidebar from './LeftSidebar';

interface AuthenticatedShellProps {
  children: React.ReactNode;
  activeTab: 'schedule' | 'patients' | 'leads' | 'settings';
  onTabChange: (tab: 'schedule' | 'patients' | 'leads' | 'settings') => void;
}

export default function AuthenticatedShell({ children, activeTab, onTabChange }: AuthenticatedShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // All tabs are always accessible
  const allTabs: Array<'schedule' | 'patients' | 'leads' | 'settings'> = ['schedule', 'patients', 'leads', 'settings'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Header onToggleSidebar={() => setSidebarOpen(true)} />
      <LeftSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pb-20 pt-16">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </div>
      </main>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} allowedTabs={allTabs} />
    </div>
  );
}
