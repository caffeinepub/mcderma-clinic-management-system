import React from 'react';
import { Clock, User, FileText } from 'lucide-react';
import { useGetTodaysAppointments } from '../hooks/useQueries';

function formatTime12Hour(ms: number): string {
  const d = new Date(ms);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function getTreatmentFromNotes(notes: string): string {
  const line = notes
    .split('\n')
    .find((l) => l.toLowerCase().startsWith('treatment:'));
  if (line) return line.replace(/^treatment:\s*/i, '').trim();
  return notes.split('\n')[0]?.trim() || '';
}

export default function NextAppointmentWidget() {
  // Only use today's appointments — never tomorrow or upcoming
  const { data: todaysAppointments = [] } = useGetTodaysAppointments();

  const now = new Date();

  // Find the next upcoming appointment from today's list only (after current time)
  const next = todaysAppointments
    .filter((appt) => Number(appt.appointmentTime) > now.getTime())
    .sort((a, b) => Number(a.appointmentTime) - Number(b.appointmentTime))[0] ?? null;

  if (!next) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Clock size={22} className="text-primary/50" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Next Appointment
          </p>
          <p className="text-base font-semibold text-muted-foreground mt-0.5">
            No Appointment For Today
          </p>
        </div>
      </div>
    );
  }

  const timeMs = Number(next.appointmentTime);
  const timeStr = formatTime12Hour(timeMs);
  const treatment = getTreatmentFromNotes(next.notes);

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
        Next Appointment
      </p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Clock size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-foreground leading-tight">{timeStr}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <User size={13} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {next.patientName}
            </span>
          </div>
          {treatment && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <FileText size={13} className="text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{treatment}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
