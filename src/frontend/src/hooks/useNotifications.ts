import { useEffect, useRef, useState, useCallback } from 'react';
import { useGetAppointments } from './useQueries';
import type { Appointment } from '../backend';
import { toast } from 'sonner';
import { formatTimestamp12Hour } from '../lib/utils';
import { playNotificationSound } from '../utils/notificationSound';

interface ScheduledNotification {
  appointmentTime: bigint;
  timeoutId: NodeJS.Timeout;
}

export interface ActiveReminder {
  appointment: Appointment;
}

export function useNotifications() {
  const { data: appointments = [] } = useGetAppointments();
  const scheduledNotifications = useRef<Map<string, ScheduledNotification>>(new Map());
  const scheduledAlerts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const firedReminders = useRef<Set<string>>(new Set());
  const permissionRequested = useRef(false);
  const notificationSupported = typeof window !== 'undefined' && 'Notification' in window;
  
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);

  // Request notification permission
  useEffect(() => {
    if (!permissionRequested.current && notificationSupported) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            toast.success('Notifications enabled for appointment reminders');
          } else if (permission === 'denied') {
            toast.info('Notifications blocked. You will receive in-app reminders instead.');
          }
        });
      } else if (Notification.permission === 'denied') {
        toast.info('Notifications are blocked. Enable them in browser settings for better reminders.');
      }
      permissionRequested.current = true;
    }
  }, [notificationSupported]);

  // Dismiss active reminder
  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

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

    // Determine if we should use browser notifications or in-app overlay
    const useNotifications = notificationSupported && Notification.permission === 'granted';
    const isDocumentVisible = () => !document.hidden;

    // Schedule new reminders
    appointments.forEach((appointment) => {
      // Convert nanoseconds to milliseconds
      const appointmentTime = Number(appointment.appointmentTime) / 1_000_000;
      const notificationTime = appointmentTime - 15 * 60 * 1000; // 15 minutes before
      const now = Date.now();

      // Only schedule if reminder time is in the future
      if (notificationTime > now) {
        const delay = notificationTime - now;
        const key = `${appointment.id}-${appointment.appointmentTime}`;

        // Skip if already fired
        if (firedReminders.current.has(key)) {
          return;
        }

        const timeString = formatTimestamp12Hour(appointment.appointmentTime);
        const reminderMessage = `${appointment.patientName} at ${timeString}${appointment.notes ? ` - ${appointment.notes}` : ''}`;

        const timeoutId = setTimeout(() => {
          // Mark as fired to prevent duplicates
          firedReminders.current.add(key);

          // Check if app is in foreground
          if (isDocumentVisible()) {
            // Show in-app full-screen overlay with sound
            playNotificationSound();
            setActiveReminder({ appointment });
          } else if (useNotifications) {
            // Show browser notification when app is in background
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
          } else {
            // Fallback to alert
            alert(`Upcoming Appointment:\n${reminderMessage}`);
          }
        }, delay);

        scheduledNotifications.current.set(key, {
          appointmentTime: appointment.appointmentTime,
          timeoutId,
        });
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
    activeReminder,
    dismissReminder,
  };
}
