import { Phone, MessageCircle, Edit, Trash2, UserPlus, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { formatTimestamp12Hour, formatTimestampDDMMYY } from '../lib/utils';
import AppointmentFeedbackActions from './AppointmentFeedbackActions';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  section?: 'today' | 'tomorrow' | 'upcoming';
  onFollowUp?: (appointment: Appointment) => void;
}

export default function AppointmentCard({ 
  appointment, 
  onEdit, 
  section,
  onFollowUp 
}: AppointmentCardProps) {
  const { data: patients = [] } = useGetPatients();
  const addPatient = useAddPatient();
  const deleteAppointment = useDeleteAppointment();

  const timeStr = formatTimestamp12Hour(appointment.appointmentTime);
  const dateStr = formatTimestampDDMMYY(appointment.appointmentTime);
  const shortDateStr = formatTimestampDDMMYY(appointment.appointmentTime);

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

  const handleFollowUpClick = () => {
    if (onFollowUp) {
      onFollowUp(appointment);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-2.5">
        <div className="space-y-1.5">
          {/* Row 1: Time (with date for upcoming) and Name on one line */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-primary leading-none flex items-center gap-1.5">
              {timeStr}
              {section === 'upcoming' && (
                <span className="text-xs font-normal text-muted-foreground">• {shortDateStr}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-1 justify-end">
              {appointment.isFollowUp && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 leading-none">
                  Follow Up
                </Badge>
              )}
              <h3 className="font-semibold text-base truncate leading-none">{appointment.patientName}</h3>
            </div>
          </div>

          {/* Row 2: Action buttons in horizontal row with wrapping */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleWhatsApp} 
              className="h-8 w-8"
              title="WhatsApp Reminder"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <AppointmentFeedbackActions
              mobile={appointment.mobile}
              patientName={appointment.patientName}
            />
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onEdit(appointment)} 
              className="h-8 w-8"
              title="Edit"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleCall} 
              className="h-8 w-8"
              title="Call"
            >
              <Phone className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleAddToPatients} 
              disabled={addPatient.isPending} 
              className="h-8 w-8"
              title="Add to Patients"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
            {section === 'today' && onFollowUp && (
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={handleFollowUpClick}
                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Follow Up"
              >
                <CalendarClock className="h-3.5 w-3.5" />
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors leading-none"
          >
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span className="underline">{appointment.mobile}</span>
          </button>

          {/* Notes (if present) */}
          {appointment.notes && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">{appointment.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
