import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppointmentCard from '../components/AppointmentCard';
import AppointmentDialog from '../components/AppointmentDialog';
import { useGetTodaysAppointments, useGetTomorrowAppointments, useGetUpcomingAppointments } from '../hooks/useQueries';
import type { Appointment } from '../backend';

export default function ScheduleTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<{ appointment: Appointment; id: bigint } | undefined>(undefined);

  const { data: todaysAppointments = [], isLoading: loadingToday } = useGetTodaysAppointments();
  const { data: tomorrowAppointments = [], isLoading: loadingTomorrow } = useGetTomorrowAppointments();
  const { data: upcomingAppointments = [], isLoading: loadingUpcoming } = useGetUpcomingAppointments();

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment({ appointment, id: appointment.id });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppointment(undefined);
  };

  const isLoading = loadingToday || loadingTomorrow || loadingUpcoming;

  return (
    <div className="space-y-6">
      {/* Today's Count Card - Ultra Compact Design */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-lg px-3 py-1.5 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] opacity-90 mb-0 leading-none">Appointments Today</p>
            <p className="text-base font-bold leading-tight mt-0.5">{todaysAppointments.length}</p>
          </div>
          <Calendar className="h-4 w-4 opacity-80" />
        </div>
      </div>

      {/* Today's Schedule */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-foreground">Today's Schedule</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading appointments...</p>
          </div>
        ) : todaysAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id.toString()}
                appointment={appointment}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tomorrow's Schedule */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-foreground">Tomorrow</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading appointments...</p>
          </div>
        ) : tomorrowAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No appointments scheduled for tomorrow</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tomorrowAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id.toString()}
                appointment={appointment}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Schedule */}
      <section>
        <h2 className="text-xl font-semibold mb-3 text-foreground">Upcoming</h2>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading appointments...</p>
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming appointments</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id.toString()} className="min-w-[280px]">
                  <AppointmentCard
                    appointment={appointment}
                    onEdit={handleEdit}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Floating Add Button */}
      <Button
        onClick={() => setIsDialogOpen(true)}
        size="lg"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add/Edit Appointment Dialog */}
      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        appointment={editingAppointment?.appointment}
        appointmentId={editingAppointment?.id}
      />
    </div>
  );
}
