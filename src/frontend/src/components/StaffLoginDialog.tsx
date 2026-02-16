import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useGetStaff, useRegisterAttendance } from '../hooks/useQueries';
import { useStaffSession } from '../staff/useStaffSession';

interface StaffLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StaffLoginDialog({ open, onOpenChange }: StaffLoginDialogProps) {
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  const { data: staffList = [], isLoading: staffLoading } = useGetStaff();
  const registerAttendance = useRegisterAttendance();
  const { setStaffSession } = useStaffSession();

  // Update role when staff name changes
  useEffect(() => {
    if (selectedStaffName) {
      const staff = staffList.find(s => s.name === selectedStaffName);
      if (staff) {
        setSelectedRole(staff.role);
      }
    } else {
      setSelectedRole('');
    }
  }, [selectedStaffName, staffList]);

  const handleLogin = async () => {
    if (!selectedStaffName) {
      toast.error('Please select a staff member');
      return;
    }

    try {
      await registerAttendance.mutateAsync({
        name: selectedStaffName,
        role: selectedRole,
      });

      // Set staff session
      setStaffSession({
        name: selectedStaffName,
        role: selectedRole,
      });

      toast.success(`${selectedStaffName} your attendance have been registered.`);
      onOpenChange(false);
      setSelectedStaffName('');
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.error('Already registered', {
          description: `${selectedStaffName} has already registered attendance today.`,
        });
      } else {
        toast.error('Failed to register attendance', {
          description: error.message || 'Please try again.',
        });
      }
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
            <Label htmlFor="staff-name">Staff Name</Label>
            <Select value={selectedStaffName} onValueChange={setSelectedStaffName}>
              <SelectTrigger id="staff-name">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : staffList.length === 0 ? (
                  <SelectItem value="none" disabled>No staff members found</SelectItem>
                ) : (
                  staffList.map((staff) => (
                    <SelectItem key={staff.name} value={staff.name}>
                      {staff.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={selectedRole}
              readOnly
              placeholder="Role will appear here"
              className="bg-muted"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleLogin} 
            disabled={!selectedStaffName || registerAttendance.isPending}
          >
            {registerAttendance.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
