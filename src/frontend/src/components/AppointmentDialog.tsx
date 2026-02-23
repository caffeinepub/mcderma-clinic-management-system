import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddAppointment, useUpdateAppointment, useGetPatients } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Appointment } from '../backend';
import { useContactPicker } from '../hooks/useContactPicker';
import ContactImportReviewDialog from './ContactImportReviewDialog';
import { normalizePhone } from '../utils/phone';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
  prefilledData?: {
    patientName: string;
    mobile: string;
    appointmentTime?: Date;
    notes?: string;
  };
}

export default function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  prefilledData,
}: AppointmentDialogProps) {
  const isEditing = !!appointment;
  const addAppointment = useAddAppointment();
  const updateAppointment = useUpdateAppointment();
  const { data: patients = [] } = useGetPatients();
  const { pickContact } = useContactPicker();

  const [patientName, setPatientName] = useState('');
  const [mobile, setMobile] = useState('');
  const [date, setDate] = useState<Date>();
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const [notes, setNotes] = useState('');
  const [showContactReview, setShowContactReview] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState('');
  const [selectedContactMobile, setSelectedContactMobile] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>();

  // Check if Contact Picker API is supported
  const isContactPickerSupported = 'contacts' in navigator && 'ContactsManager' in window;

  useEffect(() => {
    if (open) {
      if (prefilledData) {
        setPatientName(prefilledData.patientName);
        setMobile(prefilledData.mobile);
        setNotes(prefilledData.notes || '');
        
        if (prefilledData.appointmentTime) {
          setDate(prefilledData.appointmentTime);
          const hours = prefilledData.appointmentTime.getHours();
          const mins = prefilledData.appointmentTime.getMinutes();
          
          if (hours === 0) {
            setHour('12');
            setPeriod('AM');
          } else if (hours < 12) {
            setHour(hours.toString().padStart(2, '0'));
            setPeriod('AM');
          } else if (hours === 12) {
            setHour('12');
            setPeriod('PM');
          } else {
            setHour((hours - 12).toString().padStart(2, '0'));
            setPeriod('PM');
          }
          
          setMinute(mins.toString().padStart(2, '0'));
        } else {
          setDate(new Date());
        }
      } else if (appointment) {
        setPatientName(appointment.patientName);
        setMobile(appointment.mobile);
        setNotes(appointment.notes);
        
        const appointmentDate = new Date(Number(appointment.appointmentTime) / 1000000);
        setDate(appointmentDate);
        
        const hours = appointmentDate.getHours();
        const mins = appointmentDate.getMinutes();
        
        if (hours === 0) {
          setHour('12');
          setPeriod('AM');
        } else if (hours < 12) {
          setHour(hours.toString().padStart(2, '0'));
          setPeriod('AM');
        } else if (hours === 12) {
          setHour('12');
          setPeriod('PM');
        } else {
          setHour((hours - 12).toString().padStart(2, '0'));
          setPeriod('PM');
        }
        
        setMinute(mins.toString().padStart(2, '0'));
      } else {
        setPatientName('');
        setMobile('');
        setDate(new Date());
        setHour('12');
        setMinute('00');
        setPeriod('PM');
        setNotes('');
      }
    }
  }, [open, appointment, prefilledData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    let hours = parseInt(hour);
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    const appointmentDateTime = new Date(date);
    appointmentDateTime.setHours(hours, parseInt(minute), 0, 0);
    const timestamp = BigInt(appointmentDateTime.getTime() * 1000000);

    try {
      if (isEditing && appointment) {
        await updateAppointment.mutateAsync({
          id: appointment.id,
          appointment: {
            id: appointment.id,
            patientName,
            mobile,
            appointmentTime: timestamp,
            notes,
            isFollowUp: appointment.isFollowUp,
          },
        });
        toast.success('Appointment updated successfully');
      } else {
        // Check if patient exists before creating appointment
        const normalizedMobile = normalizePhone(mobile);
        const patientExists = patients.some(p => normalizePhone(p.mobile) === normalizedMobile);
        
        // If patient doesn't exist, they will be auto-created by the backend
        await addAppointment.mutateAsync({
          patientName,
          mobile,
          appointmentTime: timestamp,
          notes,
        });
        
        if (!patientExists) {
          toast.success('Appointment created and patient added successfully');
        } else {
          toast.success('Appointment created successfully');
        }
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? 'Failed to update appointment' : 'Failed to create appointment');
    }
  };

  const handleImportContact = async () => {
    try {
      const contact = await pickContact();
      if (contact) {
        setSelectedContactName(contact.name);
        setSelectedContactMobile(contact.mobile);
        setShowContactReview(true);
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled contact selection') {
        toast.error('Failed to import contact');
      }
    }
  };

  const handleContactConfirm = (name: string, mobile: string) => {
    setPatientName(name);
    setMobile(mobile);
    setShowContactReview(false);
    setSelectedContactName('');
    setSelectedContactMobile('');
  };

  const handleCalendarOpen = (open: boolean) => {
    setCalendarOpen(open);
    if (open) {
      setTempDate(date || new Date());
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setTempDate(selectedDate);
  };

  const handleSetDate = () => {
    if (tempDate) {
      setDate(tempDate);
      setCalendarOpen(false);
    }
  };

  const handleClearDate = () => {
    setTempDate(undefined);
  };

  const handleCancelDate = () => {
    setCalendarOpen(false);
    setTempDate(date);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Appointment' : 'New Appointment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <div className="flex gap-2">
                <Input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                  required
                  className="flex-1"
                />
                {isContactPickerSupported && !isEditing && (
                  <Button type="button" variant="outline" size="icon" onClick={handleImportContact}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Appointment Date</Label>
              <Popover open={calendarOpen} onOpenChange={handleCalendarOpen} modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 appointment-calendar-popover" align="center" side="top">
                  <div className="enhanced-calendar-container">
                    {/* Blue header with selected date */}
                    <div className="calendar-header">
                      <div className="calendar-year">{tempDate ? format(tempDate, 'yyyy') : format(new Date(), 'yyyy')}</div>
                      <div className="calendar-selected-date">
                        {tempDate ? format(tempDate, 'EEE, d MMM') : format(new Date(), 'EEE, d MMM')}
                      </div>
                    </div>

                    {/* Calendar grid */}
                    <div className="calendar-body">
                      <Calendar 
                        mode="single" 
                        selected={tempDate} 
                        onSelect={handleDateSelect} 
                        initialFocus 
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="calendar-footer">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClearDate}
                        className="calendar-action-btn"
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancelDate}
                        className="calendar-action-btn"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSetDate}
                        className="calendar-action-btn calendar-action-btn-primary"
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Appointment Time</Label>
              <div className="flex gap-2">
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const h = (i + 1).toString().padStart(2, '0');
                      return (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent>
                    {['00', '15', '30', '45'].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={period} onValueChange={(v) => setPeriod(v as 'AM' | 'PM')}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Treatment</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter appointment notes or treatment details"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addAppointment.isPending || updateAppointment.isPending}>
                {addAppointment.isPending || updateAppointment.isPending
                  ? 'Saving...'
                  : isEditing
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ContactImportReviewDialog
        open={showContactReview}
        onOpenChange={setShowContactReview}
        contactName={selectedContactName}
        contactMobile={selectedContactMobile}
        onConfirm={handleContactConfirm}
      />
    </>
  );
}
