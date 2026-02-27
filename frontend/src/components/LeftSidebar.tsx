import { useState } from 'react';
import { X, UserCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetStaff, useCreateAttendance, useGetTodaysAttendance } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatTime12Hour } from '../lib/utils';

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function LeftSidebar({ open, onClose }: LeftSidebarProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: staff = [] } = useGetStaff();
  const { data: todaysAttendance = [] } = useGetTodaysAttendance();
  const createAttendance = useCreateAttendance();
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');

  const selectedStaff = staff.find(s => s.name === selectedStaffName);

  const handleCheckIn = async () => {
    if (!selectedStaffName) {
      toast.error('Please select a staff member');
      return;
    }

    const staffMember = staff.find(s => s.name === selectedStaffName);
    if (!staffMember) {
      toast.error('Staff member not found');
      return;
    }

    try {
      await createAttendance.mutateAsync({
        name: staffMember.name,
        role: staffMember.role,
      });

      toast.success(`${staffMember.name} checked in successfully`);
      setSelectedStaffName('');
    } catch (error: any) {
      toast.error('Failed to check in', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await clear();
      queryClient.clear();
      toast.success('Logged out successfully');
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Attendance Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Attendance
              </h3>

              {/* Check In Subsection */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                <h4 className="text-sm font-medium">Check In</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="staffName">Staff Name</Label>
                  <Select value={selectedStaffName} onValueChange={setSelectedStaffName}>
                    <SelectTrigger id="staffName">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          No staff members found
                        </SelectItem>
                      ) : (
                        staff.map((s) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStaff && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="px-3 py-2 bg-background rounded-md border border-border text-sm">
                      {selectedStaff.role}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCheckIn}
                  disabled={!selectedStaffName || createAttendance.isPending}
                  className="w-full gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  {createAttendance.isPending ? 'Checking in...' : 'Check In'}
                </Button>
              </div>

              {/* Today's Attendance */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Today's Attendance</h4>
                
                {todaysAttendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    No check-ins yet today
                  </p>
                ) : (
                  <div className="space-y-2">
                    {todaysAttendance.map((record, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-md border border-border text-sm"
                      >
                        <span className="font-medium">{record.name}</span>
                        <span className="text-muted-foreground">
                          {formatTime12Hour(new Date(Number(record.timestamp) / 1000000))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
