import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useGetStaff, useGetStaffPermissions, useSaveStaffPermissions, useAddStaff } from '../../hooks/useQueries';
import { Shield, Plus, Save } from 'lucide-react';

export default function PermissionsMatrix() {
  const { data: staffList = [] } = useGetStaff();
  const { data: allPermissions = {} } = useGetStaffPermissions();
  const savePermissions = useSaveStaffPermissions();
  const addStaff = useAddStaff();

  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');

  useEffect(() => {
    setPermissions(allPermissions);
  }, [allPermissions]);

  const sections = [
    { id: 'canAccessAppointments', label: 'Appointment tab' },
    { id: 'canAccessPatients', label: 'Patient tab' },
    { id: 'canAccessLeads', label: 'Lead tab' },
    { id: 'canAccessSettings', label: 'Settings' },
    { id: 'hasFullControl', label: 'Full control' },
  ];

  const handleTogglePermission = (staffName: string, permissionId: string) => {
    setPermissions((prev) => ({
      ...prev,
      [staffName]: {
        ...prev[staffName],
        [permissionId]: !prev[staffName]?.[permissionId],
      },
    }));
  };

  const handleSavePermissions = async () => {
    try {
      // Save all permissions
      for (const [staffName, perms] of Object.entries(permissions)) {
        await savePermissions.mutateAsync({
          staffName,
          permissions: perms as any,
        });
      }
      toast.success('Permissions saved successfully');
    } catch (error: any) {
      toast.error('Failed to save permissions', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName.trim() || !newStaffRole.trim()) {
      toast.error('Please enter staff name and role');
      return;
    }

    try {
      await addStaff.mutateAsync({
        name: newStaffName,
        role: newStaffRole,
      });

      // Initialize permissions for new staff
      setPermissions((prev) => ({
        ...prev,
        [newStaffName]: {
          canAccessAppointments: false,
          canAccessPatients: false,
          canAccessLeads: false,
          canAccessSettings: false,
          hasFullControl: false,
        },
      }));

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
            <Shield className="h-5 w-5" />
            Staff Permissions Matrix
          </CardTitle>
          <CardDescription>
            Configure which sections each staff member can access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showAddStaff ? (
            <Button onClick={() => setShowAddStaff(true)} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff Member
            </Button>
          ) : (
            <div className="flex gap-2 p-4 border rounded-lg bg-muted/50">
              <Input
                placeholder="Staff name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
              />
              <Input
                placeholder="Role"
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
              />
              <Button onClick={handleAddStaff} disabled={addStaff.isPending}>
                Add
              </Button>
              <Button variant="outline" onClick={() => setShowAddStaff(false)}>
                Cancel
              </Button>
            </div>
          )}

          {staffList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staff members yet. Add staff members to configure permissions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Section</th>
                    {staffList.map((staff) => (
                      <th key={staff.name} className="text-center p-3 font-medium min-w-[120px]">
                        <div className="text-sm">{staff.name}</div>
                        <div className="text-xs text-muted-foreground font-normal">{staff.role}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => (
                    <tr key={section.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{section.label}</td>
                      {staffList.map((staff) => (
                        <td key={staff.name} className="p-3 text-center">
                          <Checkbox
                            checked={permissions[staff.name]?.[section.id] || false}
                            onCheckedChange={() => handleTogglePermission(staff.name, section.id)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {staffList.length > 0 && (
            <Button
              onClick={handleSavePermissions}
              disabled={savePermissions.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {savePermissions.isPending ? 'Saving...' : 'Save All Permissions'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
