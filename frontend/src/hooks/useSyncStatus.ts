import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook that tracks whether any data queries are currently fetching.
 * Returns true if any appointments, patients, leads, or profile queries are loading.
 */
export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkSyncStatus = () => {
      const queries = queryClient.getQueryCache().getAll();
      const dataQueries = queries.filter(query => {
        const key = query.queryKey[0] as string;
        return ['appointments', 'todaysAppointments', 'tomorrowAppointments', 'upcomingAppointments', 'patients', 'leads', 'currentUserProfile'].includes(key);
      });

      const isAnyFetching = dataQueries.some(query => query.state.fetchStatus === 'fetching');
      setIsSyncing(isAnyFetching);
    };

    // Initial check
    checkSyncStatus();

    // Subscribe to query cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      checkSyncStatus();
    });

    return () => unsubscribe();
  }, [queryClient]);

  return isSyncing;
}
