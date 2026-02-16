import { X, UserCheck, Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStaffSession } from '../staff/useStaffSession';
import { cn } from '@/lib/utils';

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
  onOpenStaffLogin: () => void;
}

export default function LeftSidebar({ open, onClose, onOpenStaffLogin }: LeftSidebarProps) {
  const { staffSession, clearStaffSession } = useStaffSession();

  const handleStaffLogout = () => {
    clearStaffSession();
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-50 w-64 bg-card border-r transition-transform duration-300 md:sticky md:top-16 md:h-[calc(100vh-4rem)]",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Close button (mobile only) */}
          <div className="flex items-center justify-between p-4 border-b md:hidden">
            <h2 className="font-semibold">Staff Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Top actions */}
          <div className="p-4 space-y-3 border-b">
            <Button
              onClick={onOpenStaffLogin}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <UserCheck className="h-4 w-4" />
              Staff Login
            </Button>
            <Button
              onClick={onOpenStaffLogin}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Clock className="h-4 w-4" />
              Auto Attendance
            </Button>
          </div>

          {/* Staff session info */}
          {staffSession && (
            <div className="p-4 border-b bg-muted/50">
              <div className="text-sm">
                <p className="font-medium">{staffSession.name}</p>
                <p className="text-muted-foreground text-xs">{staffSession.role}</p>
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom logout */}
          {staffSession && (
            <div className="p-4 border-t">
              <Button
                onClick={handleStaffLogout}
                variant="ghost"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Log out (Staff)
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
