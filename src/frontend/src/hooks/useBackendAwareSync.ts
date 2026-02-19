import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

/**
 * Automatic synchronization hook that:
 * - Polls backend every 30 seconds for automatic updates
 * - Triggers sync when app regains focus
 * - Invalidates all data queries after mutations
 */
export function useBackendAwareSync() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  // Auto-refresh queries every 30 seconds when actor is available
  useEffect(() => {
    if (!actor) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [actor, queryClient]);

  // Sync on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (!actor) return;
      
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [actor, queryClient]);
}
