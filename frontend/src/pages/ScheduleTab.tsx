import React, { useState, useCallback } from 'react';
import { Plus, Calendar } from 'lucide-react';
import {
  useGetTodaysAppointments,
  useGetTomorrowAppointments,
  useGetUpcomingAppointments,
  useUpdateAppointment,
  useDeleteAppointment,
  type Appointment,
} from '../hooks/useQueries';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentDialog from '../components/AppointmentDialog';
import NextAppointmentWidget from '../components/NextAppointmentWidget';
import FollowUpDateTimeDialog from '../components/FollowUpDateTimeDialog';
import PrescriptionEditorDialog from '../components/PrescriptionEditorDialog';
import { toast } from 'sonner';

export default function ScheduleTab() {
  const { data: todayAppointments = [] } = useGetTodaysAppointments();
  const { data: tomorrowAppointments = [] } = useGetTomorrowAppointments();
  const { data: upcomingAppointments = [] } = useGetUpcomingAppointments();

  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [followUpAppointment, setFollowUpAppointment] = useState<Appointment | null>(null);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptionAppointment, setPrescriptionAppointment] = useState<Appointment | null>(null);

  const handleEdit = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (appointment: Appointment) => {
    try {
      await deleteAppointment.mutateAsync(appointment.id);
      toast.success('Appointment deleted');
    } catch {
      toast.error('Failed to delete appointment');
    }
  }, [deleteAppointment]);

  const handleCall = useCallback((mobile: string) => {
    window.open(`tel:${mobile}`);
  }, []);

  const handleWhatsApp = useCallback((mobile: string, patientName: string) => {
    const msg = encodeURIComponent(`Hello ${patientName}, this is a reminder about your appointment.`);
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${msg}`);
  }, []);

  const handleFollowUp = useCallback((appointment: Appointment) => {
    setFollowUpAppointment(appointment);
    setFollowUpDialogOpen(true);
  }, []);

  // FollowUpDateTimeDialog calls onConfirm with a bigint timestamp
  const handleFollowUpConfirm = useCallback(async (dateTime: bigint) => {
    if (!followUpAppointment) return;
    try {
      await updateAppointment.mutateAsync({
        ...followUpAppointment,
        appointmentTime: dateTime,
        isFollowUp: true,
      });
      toast.success('Follow-up scheduled');
      setFollowUpDialogOpen(false);
      setFollowUpAppointment(null);
    } catch {
      toast.error('Failed to schedule follow-up');
    }
  }, [followUpAppointment, updateAppointment]);

  const handlePrescription = useCallback((appointment: Appointment) => {
    setPrescriptionAppointment(appointment);
    setPrescriptionDialogOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingAppointment(null);
    setDialogOpen(true);
  }, []);

  const sortByTime = (a: Appointment, b: Appointment) =>
    Number(a.appointmentTime) - Number(b.appointmentTime);

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Next Appointment Widget */}
      <div className="px-4 pt-4 pb-2">
        <NextAppointmentWidget />
      </div>

      {/* Appointments Today count banner */}
      <div className="mx-4 mb-3 bg-primary rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-primary-foreground/80 text-xs font-medium">Appointments Today</p>
          <p className="text-primary-foreground text-2xl font-bold leading-tight">{todayAppointments.length}</p>
        </div>
        <Calendar size={24} className="text-primary-foreground/70" />
      </div>

      {/* Today's Schedule */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-3">Today's Schedule</h2>
        {todayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar size={40} className="mb-2 opacity-40" />
            <p className="text-sm">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...todayAppointments].sort(sortByTime).map((appointment) => (
              <AppointmentCard
                key={String(appointment.id)}
                appointment={appointment}
                section="today"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCall={handleCall}
                onWhatsApp={handleWhatsApp}
                onFollowUp={handleFollowUp}
                onPrescription={handlePrescription}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tomorrow */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-3">Tomorrow</h2>
        {tomorrowAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar size={40} className="mb-2 opacity-40" />
            <p className="text-sm">No appointments scheduled for tomorrow</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...tomorrowAppointments].sort(sortByTime).map((appointment) => (
              <AppointmentCard
                key={String(appointment.id)}
                appointment={appointment}
                section="tomorrow"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCall={handleCall}
                onWhatsApp={handleWhatsApp}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-bold text-foreground mb-3">Upcoming</h2>
        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar size={40} className="mb-2 opacity-40" />
            <p className="text-sm">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...upcomingAppointments].sort(sortByTime).map((appointment) => (
              <AppointmentCard
                key={String(appointment.id)}
                appointment={appointment}
                section="upcoming"
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCall={handleCall}
                onWhatsApp={handleWhatsApp}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={handleAddNew}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-40"
        aria-label="Add appointment"
      >
        <Plus size={24} />
      </button>

      {/* Dialogs */}
      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={editingAppointment}
      />

      {followUpAppointment && (
        <FollowUpDateTimeDialog
          open={followUpDialogOpen}
          onOpenChange={setFollowUpDialogOpen}
          onConfirm={handleFollowUpConfirm}
          isPending={updateAppointment.isPending}
        />
      )}

      {prescriptionAppointment && (
        <PrescriptionEditorDialog
          open={prescriptionDialogOpen}
          onOpenChange={setPrescriptionDialogOpen}
          appointment={prescriptionAppointment}
        />
      )}
    </div>
  );
}
