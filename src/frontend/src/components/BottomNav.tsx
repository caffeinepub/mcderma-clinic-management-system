import { Calendar, Users, UserPlus, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'schedule' | 'patients' | 'leads' | 'settings';
  onTabChange: (tab: 'schedule' | 'patients' | 'leads' | 'settings') => void;
  allowedTabs: Array<'schedule' | 'patients' | 'leads' | 'settings'>;
}

export default function BottomNav({ activeTab, onTabChange, allowedTabs }: BottomNavProps) {
  const tabs = [
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
    { id: 'patients' as const, label: 'Patients', icon: Users },
    { id: 'leads' as const, label: 'Leads', icon: UserPlus },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  // All tabs are always visible
  const visibleTabs = tabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40">
      <div className="flex justify-around items-center h-16 max-w-7xl mx-auto px-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'fill-primary/20' : ''}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
