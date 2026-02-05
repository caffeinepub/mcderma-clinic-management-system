import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

/**
 * Enhanced automatic synchronization hook that:
 * - Polls backend every 15 minutes for changes
 * - Triggers sync on app focus/visibility
 * - Triggers sync after mutations
 * - Compares backend timestamps to detect changes
 * - Only refetches when backend indicates newer data
 * - Pauses polling when tab is inactive
 */
export function useBackendAwareSync() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const lastCheckRef = useRef<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  const checkForChanges = useCallback(async () => {
    if (!actor || isCheckingRef.current) return;

    isCheckingRef.current = true;
    try {
      // Get backend modification times for all data types
      const modifiedTimes = await actor.getLastModifiedTimes();
      
      // Get current cache state
      const appointmentsState = queryClient.getQueryState(['appointments']);
      const patientsState = queryClient.getQueryState(['patients']);
      const leadsState = queryClient.getQueryState(['leads']);
      const profileState = queryClient.getQueryState(['currentUserProfile']);

      let hasChanges = false;

      // Check appointments
      if (modifiedTimes.appointments) {
        const backendTime = Number(modifiedTimes.appointments);
        const cacheTime = appointmentsState?.dataUpdatedAt || 0;
        if (backendTime > cacheTime) {
          hasChanges = true;
          await queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' });
          await queryClient.invalidateQueries({ queryKey: ['todaysAppointments'], refetchType: 'active' });
          await queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'], refetchType: 'active' });
          await queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'], refetchType: 'active' });
        }
      }

      // Check patients
      if (modifiedTimes.patients) {
        const backendTime = Number(modifiedTimes.patients);
        const cacheTime = patientsState?.dataUpdatedAt || 0;
        if (backendTime > cacheTime) {
          hasChanges = true;
          await queryClient.invalidateQueries({ queryKey: ['patients'], refetchType: 'active' });
        }
      }

      // Check leads
      if (modifiedTimes.leads) {
        const backendTime = Number(modifiedTimes.leads);
        const cacheTime = leadsState?.dataUpdatedAt || 0;
        if (backendTime > cacheTime) {
          hasChanges = true;
          await queryClient.invalidateQueries({ queryKey: ['leads'], refetchType: 'active' });
        }
      }

      // Check profile
      if (modifiedTimes.profile) {
        const backendTime = Number(modifiedTimes.profile);
        const cacheTime = profileState?.dataUpdatedAt || 0;
        if (backendTime > cacheTime) {
          hasChanges = true;
          await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], refetchType: 'active' });
        }
      }

      lastCheckRef.current = Date.now();
      
      if (hasChanges) {
        // Update sync time in backend
        await actor.updateLastSyncTime();
      }
    } catch (error) {
      console.error('Error checking for backend changes:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [actor, queryClient]);

  // Set up periodic polling (every 15 minutes)
  useEffect(() => {
    if (!actor) return;

    const startPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      // Initial check
      checkForChanges();

      // Poll every 15 minutes (900000ms)
      pollingIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          checkForChanges();
        }
      }, 900000);
    };

    startPolling();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [actor, checkForChanges]);

  // Handle visibility changes (app focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastCheck = Date.now() - lastCheckRef.current;
        // Only check if more than 5 seconds since last check (throttle)
        if (timeSinceLastCheck > 5000) {
          checkForChanges();
        }
      }
    };

    const handleFocus = () => {
      const timeSinceLastCheck = Date.now() - lastCheckRef.current;
      if (timeSinceLastCheck > 5000) {
        checkForChanges();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForChanges]);

  // Listen for mutation events to trigger immediate sync
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event?.type === 'updated' && event.mutation.state.status === 'success') {
        // Trigger sync after successful mutation
        setTimeout(() => {
          checkForChanges();
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, [queryClient, checkForChanges]);

  return { checkForChanges };
}
