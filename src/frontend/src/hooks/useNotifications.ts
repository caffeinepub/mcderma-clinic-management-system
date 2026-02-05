import { useEffect, useRef } from 'react';
import { useGetAppointments } from './useQueries';
import type { Appointment } from '../backend';
import { toast } from 'sonner';
import { formatTimestamp12Hour } from '../lib/utils';

interface ScheduledNotification {
  appointmentTime: bigint;
  timeoutId: NodeJS.Timeout;
}

export function useNotifications() {
  const { data: appointments = [] } = useGetAppointments();
  const scheduledNotifications = useRef<Map<string, ScheduledNotification>>(new Map());
  const scheduledAlerts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const permissionRequested = useRef(false);
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  // Request notification permission
  useEffect(() => {
    if (!permissionRequested.current && notificationSupported) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            toast.success('Notifications enabled for appointment reminders');
          } else if (permission === 'denied') {
            toast.info('Notifications blocked. You will receive alert reminders instead.');
          }
        });
      } else if (Notification.permission === 'denied') {
        toast.info('Notifications are blocked. Enable them in browser settings for better reminders.');
      }
      permissionRequested.current = true;
    }
  }, [notificationSupported]);

  // Schedule notifications or alerts for appointments
  useEffect(() => {
    // Clear all existing scheduled notifications and alerts
    scheduledNotifications.current.forEach((notification) => {
      clearTimeout(notification.timeoutId);
    });
    scheduledNotifications.current.clear();

    scheduledAlerts.current.forEach((alertTimeout) => {
      clearTimeout(alertTimeout);
    });
    scheduledAlerts.current.clear();

    // Determine if we should use notifications or alerts
    const useNotifications = notificationSupported && Notification.permission === 'granted';

    // Schedule new reminders
    appointments.forEach((appointment) => {
      // Convert nanoseconds to milliseconds
      const appointmentTime = Number(appointment.appointmentTime) / 1_000_000;
      const notificationTime = appointmentTime - 15 * 60 * 1000; // 15 minutes before
      const now = Date.now();

      // Only schedule if reminder time is in the future
      if (notificationTime > now) {
        const delay = notificationTime - now;
        const key = `${appointment.patientName}-${appointment.appointmentTime}`;

        const timeString = formatTimestamp12Hour(appointment.appointmentTime);

        const reminderMessage = `${appointment.patientName} at ${timeString}${appointment.notes ? ` - ${appointment.notes}` : ''}`;

        if (useNotifications) {
          // Schedule browser notification
          const timeoutId = setTimeout(() => {
            try {
              const notification = new Notification('Upcoming Appointment', {
                body: reminderMessage,
                icon: '/assets/generated/mcderma-pwa-icon-192.dim_192x192.png',
                badge: '/assets/generated/mcderma-pwa-icon-192.dim_192x192.png',
                tag: key,
                requireInteraction: false,
              });

              notification.onclick = () => {
                window.focus();
                notification.close();
              };

              // Auto-close after 10 seconds
              setTimeout(() => notification.close(), 10000);
            } catch (error) {
              console.error('Failed to show notification:', error);
              // Fallback to alert if notification fails
              alert(`Upcoming Appointment:\n${reminderMessage}`);
            }
          }, delay);

          scheduledNotifications.current.set(key, {
            appointmentTime: appointment.appointmentTime,
            timeoutId,
          });
        } else {
          // Schedule alert as fallback
          const timeoutId = setTimeout(() => {
            alert(`Upcoming Appointment:\n${reminderMessage}`);
          }, delay);

          scheduledAlerts.current.set(key, timeoutId);
        }
      }
    });

    // Cleanup function
    return () => {
      scheduledNotifications.current.forEach((notification) => {
        clearTimeout(notification.timeoutId);
      });
      scheduledNotifications.current.clear();

      scheduledAlerts.current.forEach((alertTimeout) => {
        clearTimeout(alertTimeout);
      });
      scheduledAlerts.current.clear();
    };
  }, [appointments, notificationSupported]);

  return {
    notificationPermission: notificationSupported ? Notification.permission : 'default',
    isUsingAlerts: !notificationSupported || Notification.permission !== 'granted',
  };
}
