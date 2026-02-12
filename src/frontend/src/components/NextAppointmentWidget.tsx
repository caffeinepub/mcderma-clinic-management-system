import { Clock, User, FileText, Calendar } from 'lucide-react';
import { formatTimestamp12Hour } from '../lib/utils';
import type { Appointment } from '../backend';

interface NextAppointmentWidgetProps {
  appointments: Appointment[];
  currentTime: Date;
}

export default function NextAppointmentWidget({ appointments, currentTime }: NextAppointmentWidgetProps) {
  // Find the next upcoming appointment (smallest appointmentTime >= now)
  const nowMs = currentTime.getTime() * 1_000_000; // Convert to nanoseconds
  
  const upcomingAppointments = appointments
    .filter(apt => Number(apt.appointmentTime) >= nowMs)
    .sort((a, b) => Number(a.appointmentTime) - Number(b.appointmentTime));
  
  const nextAppointment = upcomingAppointments[0];

  if (!nextAppointment) {
    return (
      <div className="bg-gradient-to-br from-muted to-muted/50 rounded-xl p-4 shadow-sm border border-border/50 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center flex-shrink-0">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Next Appointment</p>
            <p className="text-base text-foreground">No upcoming appointments</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 shadow-md border-2 border-primary/20 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Next Appointment</p>
          <p className="text-lg font-bold text-foreground">{formatTimestamp12Hour(nextAppointment.appointmentTime)}</p>
        </div>
      </div>
      
      <div className="space-y-2 pl-15">
        {/* Patient Name */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-sm font-semibold text-foreground truncate">{nextAppointment.patientName}</p>
        </div>
        
        {/* Treatment/Notes */}
        {nextAppointment.notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80 line-clamp-2">{nextAppointment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
