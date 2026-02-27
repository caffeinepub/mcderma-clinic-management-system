import React, { useState } from 'react';
import { useGetStaff, useCreateStaff, useDeleteStaff } from '../../hooks/useQueries';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_OPTIONS = [
  'Admin',
  'Doctor',
  'Receptionist',
  'Nurse',
  'Patient Relationship Executive',
  'Staff',
];

export default function PermissionsMatrix() {
  const { data: staffList = [], isLoading } = useGetStaff();
  const createStaff = useCreateStaff();
  const deleteStaff = useDeleteStaff();

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');

  const handleAdd = async () => {
    if (!newName.trim() || !newRole) {
      toast.error('Please enter a name and select a role');
      return;
    }
    try {
      await createStaff.mutateAsync({ name: newName.trim(), role: newRole });
      toast.success(`${newName.trim()} added as ${newRole}`);
      setNewName('');
      setNewRole('');
    } catch {
      toast.error('Failed to add staff member');
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteStaff.mutateAsync(name);
      toast.success(`${name} removed`);
    } catch {
      toast.error('Failed to remove staff member');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Staff Management</h3>

      {/* Add new staff */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Staff name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 min-w-[120px]"
        />
        <Select value={newRole} onValueChange={setNewRole}>
          <SelectTrigger className="w-[180px]">
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
        <Button
          onClick={handleAdd}
          disabled={createStaff.isPending}
          size="sm"
          className="gap-1.5"
        >
          {createStaff.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <UserPlus size={14} />
          )}
          Add
        </Button>
      </div>

      {/* Staff list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
          <Loader2 size={14} className="animate-spin" />
          Loading staff...
        </div>
      ) : staffList.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No staff members added yet.</p>
      ) : (
        <div className="space-y-2">
          {staffList.map((staff) => (
            <div
              key={staff.name}
              className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2"
            >
              <div>
                <span className="text-sm font-medium text-foreground">{staff.name}</span>
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {staff.role}
                </span>
              </div>
              <button
                onClick={() => handleDelete(staff.name)}
                disabled={deleteStaff.isPending}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                title="Remove staff"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
