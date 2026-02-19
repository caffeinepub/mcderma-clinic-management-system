import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetStaff, useRegisterAttendance } from '../hooks/useQueries';
import { useStaffSession } from '../staff/useStaffSession';
import { toast } from 'sonner';

interface StaffLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StaffLoginDialog({ open, onOpenChange }: StaffLoginDialogProps) {
  const { data: staff = [], isLoading } = useGetStaff();
  const registerAttendance = useRegisterAttendance();
  const { setStaffSession } = useStaffSession();
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Auto-populate role when staff is selected
  useEffect(() => {
    if (selectedStaffName) {
      const staffMember = staff.find(s => s.name === selectedStaffName);
      if (staffMember) {
        setSelectedRole(staffMember.role);
      }
    }
  }, [selectedStaffName, staff]);

  const handleLogin = async () => {
    if (!selectedStaffName || !selectedRole) {
      toast.error('Please select a staff member');
      return;
    }

    try {
      // Register attendance
      await registerAttendance.mutateAsync({
        name: selectedStaffName,
        role: selectedRole,
      });

      // Login staff session
      setStaffSession({
        name: selectedStaffName,
        role: selectedRole,
      });

      toast.success(`Welcome, ${selectedStaffName}!`);
      onOpenChange(false);
      setSelectedStaffName('');
      setSelectedRole('');
    } catch (error: any) {
      toast.error('Failed to register attendance', {
        description: error.message || 'Please try again',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Staff Login & Attendance</DialogTitle>
          <DialogDescription>
            Select your name to register attendance and access the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staffName">Staff Name</Label>
            <Select value={selectedStaffName} onValueChange={setSelectedStaffName}>
              <SelectTrigger id="staffName">
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : staff.length === 0 ? (
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

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {selectedRole || 'Select a staff member first'}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLogin}
            disabled={!selectedStaffName || !selectedRole || registerAttendance.isPending}
          >
            {registerAttendance.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
