import { Calendar, Users, UserPlus, Settings } from 'lucide-react';
import type { TabType } from '../App';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  allowedTabs?: TabType[];
}

export default function BottomNav({ activeTab, onTabChange, allowedTabs }: BottomNavProps) {
  const allTabs = [
    { id: 'schedule' as TabType, label: 'Schedule', icon: Calendar },
    { id: 'patients' as TabType, label: 'Patients', icon: Users },
    { id: 'leads' as TabType, label: 'Leads', icon: UserPlus },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  // Filter tabs based on allowed tabs (for staff permissions)
  const tabs = allowedTabs 
    ? allTabs.filter(tab => allowedTabs.includes(tab.id))
    : allTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-2">
        <div className={cn(
          "grid gap-1 py-2",
          tabs.length === 4 ? "grid-cols-4" : 
          tabs.length === 3 ? "grid-cols-3" : 
          tabs.length === 2 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-3 transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
