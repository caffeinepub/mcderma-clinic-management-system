import React, { useState } from 'react';
import { Phone, MessageCircle, Edit, Trash2, UserPlus, Clock, FileText, ChevronDown } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Appointment, useGetStaffByRole, useAssignDoctorToAppointment } from '../hooks/useQueries';
import { toast } from 'sonner';

function formatTime12Hour(ms: number): string {
  const d = new Date(ms);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function formatDateDDMMYY(ms: number): string {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

interface AppointmentCardProps {
  appointment: Appointment;
  section: 'today' | 'tomorrow' | 'upcoming';
  onEdit: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
  onCall?: (mobile: string) => void;
  onWhatsApp?: (mobile: string, patientName: string) => void;
  onFollowUp?: (appointment: Appointment) => void;
  onAddToPatients?: (appointment: Appointment) => void;
  onPrescription?: (appointment: Appointment) => void;
  onFeedback?: (appointment: Appointment) => void;
}

export default function AppointmentCard({
  appointment,
  section,
  onEdit,
  onDelete,
  onCall,
  onWhatsApp,
  onFollowUp,
  onAddToPatients,
  onPrescription,
  onFeedback,
}: AppointmentCardProps) {
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);

  const { data: doctors = [], isLoading: doctorsLoading } = useGetStaffByRole('Doctor');
  const assignDoctor = useAssignDoctorToAppointment();

  const timeMs = Number(appointment.appointmentTime);
  const timeStr = formatTime12Hour(timeMs);

  const notes = appointment.notes || '';
  const treatmentLine = notes
    .split('\n')
    .find((l) => l.toLowerCase().startsWith('treatment:'));
  const displayNotes = treatmentLine
    ? treatmentLine.replace(/^treatment:\s*/i, '')
    : notes.split('\n')[0] || '';

  const assignedDoctor = appointment.assignedDoctor ?? null;

  const handleAssignDoctor = async (doctorName: string) => {
    setDoctorDropdownOpen(false);
    try {
      await assignDoctor.mutateAsync({
        appointmentId: appointment.id,
        doctorName,
      });
      toast.success(`Dr. ${doctorName} assigned`);
    } catch {
      toast.error('Failed to assign doctor');
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
      {/* Row 1: Time + Patient Name */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-primary font-semibold text-sm">
          {timeStr}
          {section === 'upcoming' && (
            <span className="text-muted-foreground font-normal ml-2 text-xs">
              {formatDateDDMMYY(timeMs)}
            </span>
          )}
        </span>
        <span className="font-semibold text-foreground text-sm">{appointment.patientName}</span>
      </div>

      {/* Row 2: Action icons */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {onFeedback && (
          <button
            onClick={() => onFeedback(appointment)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Feedback"
          >
            <MessageCircle size={16} />
          </button>
        )}
        {onWhatsApp && (
          <button
            onClick={() => onWhatsApp(appointment.mobile, appointment.patientName)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-green-600 hover:text-green-700"
            title="WhatsApp"
          >
            <SiWhatsapp size={16} />
          </button>
        )}
        <button
          onClick={() => onEdit(appointment)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Edit"
        >
          <Edit size={16} />
        </button>
        {onCall && (
          <button
            onClick={() => onCall(appointment.mobile)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Call"
          >
            <Phone size={16} />
          </button>
        )}
        {onAddToPatients && (
          <button
            onClick={() => onAddToPatients(appointment)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Add to Patients"
          >
            <UserPlus size={16} />
          </button>
        )}
        {onFollowUp && section === 'today' && (
          <button
            onClick={() => onFollowUp(appointment)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Follow Up"
          >
            <Clock size={16} />
          </button>
        )}
        {onPrescription && section === 'today' && (
          <button
            onClick={() => onPrescription(appointment)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Prescription"
          >
            <FileText size={16} />
          </button>
        )}
        <button
          onClick={() => onDelete(appointment)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-destructive hover:text-destructive/80"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Row 3: Mobile + Notes */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        {appointment.mobile && (
          <div className="flex items-center gap-1">
            <Phone size={11} />
            <span className="text-primary">{appointment.mobile}</span>
          </div>
        )}
        {displayNotes && <div>{displayNotes}</div>}
        {appointment.isFollowUp && (
          <span className="inline-block bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full">
            Follow Up
          </span>
        )}
      </div>

      {/* Doctor Assignment Dropdown — Today section only */}
      {section === 'today' && (
        <div className="mt-2 flex justify-end relative">
          <button
            onClick={() => setDoctorDropdownOpen((prev) => !prev)}
            disabled={doctorsLoading || assignDoctor.isPending}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {assignDoctor.isPending && (
              <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
            )}
            <span>{assignedDoctor ? `Dr. ${assignedDoctor}` : 'Assign Doctor'}</span>
            <ChevronDown size={12} />
          </button>

          {doctorDropdownOpen && (
            <div className="absolute bottom-full right-0 mb-1 z-50 bg-popover border border-border rounded-lg shadow-lg min-w-[160px] overflow-hidden">
              {doctors.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No doctors available
                </div>
              ) : (
                doctors.map((doc) => (
                  <button
                    key={doc.name}
                    onClick={() => handleAssignDoctor(doc.name)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors ${
                      assignedDoctor === doc.name
                        ? 'text-primary font-semibold'
                        : 'text-foreground'
                    }`}
                  >
                    Dr. {doc.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
