import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useActor } from "../hooks/useActor";

interface SubscriptionContextType {
  expiryDate: Date | null;
  isActive: boolean;
  isLoading: boolean;
  daysRemaining: number;
  refresh: () => Promise<void>;
  renew: () => Promise<void>;
  isRenewing: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  expiryDate: null,
  isActive: true,
  isLoading: true,
  daysRemaining: 0,
  refresh: async () => {},
  renew: async () => {},
  isRenewing: false,
});

export function SubscriptionProvider({
  children,
}: { children: React.ReactNode }) {
  const { actor } = useActor();
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);

  const fetchExpiry = useCallback(async () => {
    if (!actor) return;
    try {
      const expiryNs = await (actor as any).getSubscriptionExpiry();
      // Convert nanoseconds (BigInt) to milliseconds
      const ms = Number(expiryNs) / 1_000_000;
      setExpiryDate(new Date(ms));
    } catch (e) {
      console.error("Failed to fetch subscription", e);
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor) fetchExpiry();
  }, [actor, fetchExpiry]);

  const renew = useCallback(async () => {
    if (!actor) return;
    setIsRenewing(true);
    try {
      const newExpiryNs = await (actor as any).renewSubscription();
      const ms = Number(newExpiryNs) / 1_000_000;
      setExpiryDate(new Date(ms));
    } catch (e) {
      console.error("Failed to renew subscription", e);
      throw e;
    } finally {
      setIsRenewing(false);
    }
  }, [actor]);

  const now = new Date();
  const isActive = expiryDate ? expiryDate > now : true;
  const daysRemaining = expiryDate
    ? Math.max(
        0,
        Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <SubscriptionContext.Provider
      value={{
        expiryDate,
        isActive,
        isLoading,
        daysRemaining,
        refresh: fetchExpiry,
        renew,
        isRenewing,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
