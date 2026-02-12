import { X, Clock, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimestamp12Hour } from '../lib/utils';
import type { Appointment } from '../backend';

interface AppointmentReminderOverlayProps {
  appointment: Appointment;
  onDismiss: () => void;
}

export default function AppointmentReminderOverlay({ appointment, onDismiss }: AppointmentReminderOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-background border-4 border-primary rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Appointment Reminder</h2>
              <p className="text-sm text-muted-foreground">In 15 minutes</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Appointment Details */}
        <div className="space-y-4 mb-8">
          {/* Patient Name */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Patient</p>
              <p className="text-lg font-semibold text-foreground break-words">{appointment.patientName}</p>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Time</p>
              <p className="text-lg font-semibold text-foreground">{formatTimestamp12Hour(appointment.appointmentTime)}</p>
            </div>
          </div>

          {/* Treatment/Notes */}
          {appointment.notes && (
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Treatment</p>
                <p className="text-base text-foreground break-words">{appointment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={onDismiss}
          size="lg"
          className="w-full text-lg font-semibold"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
}
