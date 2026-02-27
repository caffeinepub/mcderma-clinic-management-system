import { useEffect, useRef, useCallback } from 'react';
import { useGetAppointments, Appointment } from './useQueries';
import { playNotificationSound } from '../utils/notificationSound';

const REMINDER_MINUTES = 15;
const CHECK_INTERVAL_MS = 60_000; // 1 minute

interface FiredReminders {
  [appointmentId: string]: boolean;
}

interface UseNotificationsOptions {
  onReminder?: (appointment: Appointment) => void;
}

export function useNotifications({ onReminder }: UseNotificationsOptions = {}) {
  const { data: appointments = [] } = useGetAppointments();
  const firedRef = useRef<FiredReminders>({});

  const checkReminders = useCallback(() => {
    const now = Date.now();
    const reminderWindowMs = REMINDER_MINUTES * 60 * 1000;

    for (const appt of appointments) {
      const apptTime = Number(appt.appointmentTime);
      const diff = apptTime - now;
      const idStr = String(appt.id);

      if (diff > 0 && diff <= reminderWindowMs && !firedRef.current[idStr]) {
        firedRef.current[idStr] = true;

        // Play sound
        playNotificationSound();

        // Browser notification
        if (
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          new Notification(`Appointment in ${REMINDER_MINUTES} minutes`, {
            body: `${appt.patientName} — ${appt.notes?.split('\n')[0] || ''}`,
            icon: '/assets/generated/mcderma-pwa-icon-192.dim_192x192.png',
          });
        }

        // In-app overlay callback
        if (onReminder) {
          onReminder(appt);
        }
      }
    }
  }, [appointments, onReminder]);

  useEffect(() => {
    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkReminders]);
}
