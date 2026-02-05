import { Phone, MessageCircle, Edit, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Appointment } from '../backend';
import { toast } from 'sonner';
import { useGetPatients, useAddPatient, useDeleteAppointment } from '../hooks/useQueries';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { formatTimestamp12Hour } from '../lib/utils';
import AppointmentFeedbackActions from './AppointmentFeedbackActions';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentCard({ appointment, onEdit }: AppointmentCardProps) {
  const { data: patients = [] } = useGetPatients();
  const addPatient = useAddPatient();
  const deleteAppointment = useDeleteAppointment();

  const date = new Date(Number(appointment.appointmentTime) / 1000000);
  const timeStr = formatTimestamp12Hour(appointment.appointmentTime);
  const dateStr = format(date, 'MMM dd, yyyy');

  const handleCall = () => {
    window.location.href = `tel:${appointment.mobile}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello ${appointment.patientName}, this is a reminder for your appointment at ${timeStr} on ${dateStr}. ${appointment.notes ? `Purpose: ${appointment.notes}` : ''}`
    );
    window.open(`https://wa.me/${appointment.mobile}?text=${message}`, '_blank');
  };

  const handleAddToPatients = async () => {
    const existingPatient = patients.find(p => p.mobile === appointment.mobile);
    if (existingPatient) {
      toast.info('Patient already exists in the patients list');
      return;
    }

    try {
      await addPatient.mutateAsync({
        image: null,
        name: appointment.patientName,
        mobile: appointment.mobile,
        area: '',
        notes: `Added from appointment on ${dateStr}`,
      });
      toast.success('Patient added successfully');
    } catch (error) {
      toast.error('Failed to add patient');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment.mutateAsync(appointment.id);
      toast.success('Appointment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3.5">
        <div className="space-y-2.5">
          {/* Row 1: Time and Name on one line */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-primary leading-none">{timeStr}</div>
            <h3 className="font-semibold text-base truncate leading-none flex-1 text-right">{appointment.patientName}</h3>
          </div>

          {/* Row 2: Action buttons in horizontal row with wrapping */}
          <div className="flex items-center gap-1 flex-wrap">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleWhatsApp} 
              className="h-9 w-9"
              title="WhatsApp Reminder"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <AppointmentFeedbackActions
              mobile={appointment.mobile}
              patientName={appointment.patientName}
            />
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onEdit(appointment)} 
              className="h-9 w-9"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleCall} 
              className="h-9 w-9"
              title="Call"
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleAddToPatients} 
              disabled={addPatient.isPending} 
              className="h-9 w-9"
              title="Add to Patients"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this appointment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Row 3: Mobile number */}
          <button 
            onClick={handleCall}
            className="text-sm text-muted-foreground flex items-center gap-1.5 hover:text-primary transition-colors leading-none"
          >
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="underline">{appointment.mobile}</span>
          </button>

          {/* Notes (if present) */}
          {appointment.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-tight pt-0.5">{appointment.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
