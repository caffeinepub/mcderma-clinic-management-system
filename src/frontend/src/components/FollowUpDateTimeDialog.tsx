import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface FollowUpDateTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dateTime: bigint) => void;
  isPending?: boolean;
}

export default function FollowUpDateTimeDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: FollowUpDateTimeDialogProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    hour: '9',
    minute: '00',
    period: 'AM' as 'AM' | 'PM',
  });

  useEffect(() => {
    if (open) {
      // Reset to default values when dialog opens
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        hour: '9',
        minute: '00',
        period: 'AM',
      });
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert 12-hour format to 24-hour format
    let hours = parseInt(formData.hour);
    if (formData.period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (formData.period === 'AM' && hours === 12) {
      hours = 0;
    }

    const timeString = `${hours.toString().padStart(2, '0')}:${formData.minute}`;
    const dateTime = new Date(`${formData.date}T${timeString}`);
    const appointmentTime = BigInt(dateTime.getTime() * 1000000);

    onConfirm(appointmentTime);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-Up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="followup-date">Date *</Label>
            <Input
              id="followup-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Time *</Label>
            <div className="flex gap-2">
              <Select
                value={formData.hour}
                onValueChange={(value) => setFormData({ ...formData, hour: value })}
                disabled={isPending}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Hour" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={formData.minute}
                onValueChange={(value) => setFormData({ ...formData, minute: value })}
                disabled={isPending}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Minute" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={formData.period}
                onValueChange={(value: 'AM' | 'PM') => setFormData({ ...formData, period: value })}
                disabled={isPending}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
