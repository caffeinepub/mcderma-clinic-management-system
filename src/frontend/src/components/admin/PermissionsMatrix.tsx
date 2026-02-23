import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useGetStaff, useAddStaff } from '../../hooks/useQueries';
import { Users, Plus } from 'lucide-react';
import type { StaffPermissions } from '../../hooks/useQueries';

const ROLE_OPTIONS = [
  'Admin',
  'Doctor',
  'Receptionist',
  'Nurse',
  'Patient Relationship Executive',
];

export default function PermissionsMatrix() {
  const { data: staffList = [] } = useGetStaff();
  const addStaff = useAddStaff();

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');

  const handleAddStaff = async () => {
    if (!newStaffName.trim() || !newStaffRole.trim()) {
      toast.error('Please enter staff name and select a role');
      return;
    }

    try {
      const defaultPermissions: StaffPermissions = {
        canAccessAppointments: false,
        canAccessPatients: false,
        canAccessLeads: false,
        canAccessSettings: false,
        hasFullControl: false,
      };

      await addStaff.mutateAsync({
        name: newStaffName,
        role: newStaffRole,
        permissions: defaultPermissions,
      });

      toast.success('Staff member added successfully');
      setNewStaffName('');
      setNewStaffRole('');
      setShowAddStaff(false);
    } catch (error: any) {
      toast.error('Failed to add staff member', {
        description: error.message || 'Please try again',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Management
          </CardTitle>
          <CardDescription>
            Add and manage staff members for attendance tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showAddStaff ? (
            <Button onClick={() => setShowAddStaff(true)} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff Member
            </Button>
          ) : (
            <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="newStaffName">Staff Name</Label>
                <Input
                  id="newStaffName"
                  placeholder="Enter staff name"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newStaffRole">Staff Role</Label>
                <Select value={newStaffRole} onValueChange={setNewStaffRole}>
                  <SelectTrigger id="newStaffRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddStaff} disabled={addStaff.isPending}>
                  {addStaff.isPending ? 'Adding...' : 'Add'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowAddStaff(false);
                  setNewStaffName('');
                  setNewStaffRole('');
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {staffList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No staff members found. Add staff members to track attendance.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Staff List</h4>
              <div className="border rounded-lg divide-y">
                {staffList.map((staff) => (
                  <div
                    key={staff.name}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-sm text-muted-foreground">{staff.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
