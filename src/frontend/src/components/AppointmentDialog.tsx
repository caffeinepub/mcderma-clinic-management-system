import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Appointment } from '../backend';
import { format } from 'date-fns';
import { useAddAppointment, useUpdateAppointment } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, Contact } from 'lucide-react';
import { useContactPicker } from '../hooks/useContactPicker';
import { normalizePhoneNumber } from '../utils/phone';
import ContactImportReviewDialog from './ContactImportReviewDialog';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
  appointmentId?: bigint;
  prefilledData?: {
    patientName?: string;
    mobile?: string;
  };
}

export default function AppointmentDialog({ open, onOpenChange, appointment, appointmentId, prefilledData }: AppointmentDialogProps) {
  const addAppointment = useAddAppointment();
  const updateAppointment = useUpdateAppointment();
  const { pickContact } = useContactPicker();

  const [formData, setFormData] = useState({
    patientName: '',
    mobile: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hour: '9',
    minute: '00',
    period: 'AM' as 'AM' | 'PM',
    notes: '',
  });

  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingContact, setPendingContact] = useState({ name: '', mobile: '' });

  useEffect(() => {
    if (appointment) {
      const date = new Date(Number(appointment.appointmentTime) / 1000000);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      
      // Convert to 12-hour format
      if (hours === 0) hours = 12;
      else if (hours > 12) hours = hours - 12;

      setFormData({
        patientName: appointment.patientName,
        mobile: appointment.mobile,
        date: format(date, 'yyyy-MM-dd'),
        hour: hours.toString(),
        minute: minutes.toString().padStart(2, '0'),
        period,
        notes: appointment.notes,
      });
    } else if (prefilledData) {
      setFormData({
        patientName: prefilledData.patientName || '',
        mobile: prefilledData.mobile || '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hour: '9',
        minute: '00',
        period: 'AM',
        notes: '',
      });
    } else {
      setFormData({
        patientName: '',
        mobile: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        hour: '9',
        minute: '00',
        period: 'AM',
        notes: '',
      });
    }
  }, [appointment, prefilledData, open]);

  const handlePickContact = async () => {
    try {
      const contact = await pickContact();
      const normalizedMobile = normalizePhoneNumber(contact.mobile || '');
      setPendingContact({
        name: contact.name || '',
        mobile: normalizedMobile,
      });
      setShowReviewDialog(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to access phonebook');
    }
  };

  const handleConfirmContact = (name: string, mobile: string) => {
    setFormData({
      ...formData,
      patientName: name || formData.patientName,
      mobile: mobile || formData.mobile,
    });
    toast.success('Contact added from phonebook');
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      if (appointment && appointmentId !== undefined) {
        await updateAppointment.mutateAsync({
          id: appointmentId,
          appointment: {
            id: appointmentId,
            patientName: formData.patientName,
            mobile: formData.mobile,
            appointmentTime,
            notes: formData.notes,
          },
        });
        toast.success('Appointment updated successfully');
      } else {
        await addAppointment.mutateAsync({
          patientName: formData.patientName,
          mobile: formData.mobile,
          appointmentTime,
          notes: formData.notes,
        });
        toast.success('Appointment added successfully');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save appointment');
    }
  };

  const isPending = addAppointment.isPending || updateAppointment.isPending;

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{appointment ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePickContact}
                disabled={isPending}
                className="gap-2"
              >
                <Contact className="h-4 w-4" />
                Add from phonebook
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                required
                placeholder="Enter patient name"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
                placeholder="Enter mobile number"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Time *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={formData.hour}
                  onValueChange={(value) => setFormData({ ...formData, hour: value })}
                  disabled={isPending}
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Min" />
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {formData.hour}:{formData.minute} {formData.period}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Purpose / Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter appointment purpose or notes"
                rows={3}
                disabled={isPending}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Appointment'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ContactImportReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        contactName={pendingContact.name}
        contactMobile={pendingContact.mobile}
        onConfirm={handleConfirmContact}
      />
    </>
  );
}
