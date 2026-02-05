import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatTime12Hour } from '@/lib/utils';

/**
 * Hook that tracks the last successful data synchronization time.
 * Monitors React Query cache updates for data queries and formats the timestamp in 12-hour AM/PM format.
 */
export function useLastSync() {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Update last sync time whenever any data query is successfully fetched
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.status === 'success') {
        const queryKey = event.query.queryKey[0] as string;
        // Track sync time for all data queries including profile
        if (['appointments', 'todaysAppointments', 'tomorrowAppointments', 'upcomingAppointments', 'patients', 'leads', 'currentUserProfile'].includes(queryKey)) {
          setLastSyncTime(new Date());
        }
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    // For older syncs, show time in 12-hour AM/PM format
    return formatTime12Hour(date);
  };

  return {
    lastSyncTime,
    formattedLastSync: formatLastSync(lastSyncTime),
  };
}
