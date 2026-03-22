import { Calendar, ClockIcon, Settings, UserPlus, Users } from "lucide-react";

type TabId = "schedule" | "patients" | "leads" | "history" | "settings";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  allowedTabs: Array<TabId>;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "schedule" as const, label: "Schedule", icon: Calendar },
    { id: "patients" as const, label: "Patients", icon: Users },
    { id: "leads" as const, label: "Leads", icon: UserPlus },
    { id: "history" as const, label: "History", icon: ClockIcon },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-40">
      <div className="flex justify-around items-center h-16 max-w-7xl mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
