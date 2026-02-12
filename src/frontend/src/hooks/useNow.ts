import { useState, useEffect } from 'react';

/**
 * Hook that provides a periodically-updated current time value
 * Updates every minute to keep time-sensitive UI fresh
 */
export function useNow(updateIntervalMs: number = 60000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, updateIntervalMs);

    return () => clearInterval(interval);
  }, [updateIntervalMs]);

  return now;
}
