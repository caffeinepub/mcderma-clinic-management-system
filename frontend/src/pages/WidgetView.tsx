import { Clock, User, FileText, Calendar } from 'lucide-react';
import { useGetAppointments } from '../hooks/useQueries';
import { useNow } from '../hooks/useNow';
import { formatTimestamp12Hour } from '../lib/utils';
import { extractTreatmentFromNotes } from '../utils/treatment';

export default function WidgetView() {
  const { data: appointments = [], isLoading } = useGetAppointments();
  const currentTime = useNow();

  // Find the next upcoming appointment
  const nowMs = currentTime.getTime() * 1_000_000; // Convert to nanoseconds
  
  const upcomingAppointments = appointments
    .filter(apt => Number(apt.appointmentTime) >= nowMs)
    .sort((a, b) => Number(a.appointmentTime) - Number(b.appointmentTime));
  
  const nextAppointment = upcomingAppointments[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!nextAppointment) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-8 shadow-lg border border-border/50">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xl font-semibold text-foreground mb-2">Next Appointment</p>
              <p className="text-lg text-muted-foreground">No upcoming appointments</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const treatment = extractTreatmentFromNotes(nextAppointment.notes);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 shadow-xl border-2 border-primary/20">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">Next Appointment</p>
            <p className="text-2xl font-bold text-foreground">{formatTimestamp12Hour(nextAppointment.appointmentTime)}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Patient Name */}
          <div className="flex items-center gap-3 bg-background/50 rounded-lg p-3">
            <User className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Patient</p>
              <p className="text-base font-semibold text-foreground truncate">{nextAppointment.patientName}</p>
            </div>
          </div>
          
          {/* Treatment */}
          {treatment && (
            <div className="flex items-start gap-3 bg-background/50 rounded-lg p-3">
              <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Treatment Required</p>
                <p className="text-base text-foreground">{treatment}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
