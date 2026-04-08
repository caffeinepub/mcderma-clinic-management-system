import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useSubscription } from "../../context/SubscriptionContext";
import RenewSubscriptionDialog from "./RenewSubscriptionDialog";

export default function SubscriptionWarningBanner() {
  const { daysRemaining, isActive, expiryDate } = useSubscription();
  const [showRenew, setShowRenew] = useState(false);

  if (isActive && daysRemaining > 7) return null;
  if (!expiryDate) return null;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <button
        type="button"
        className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer ${
          !isActive ? "bg-red-500 text-white" : "bg-amber-400 text-amber-900"
        }`}
        onClick={() => setShowRenew(true)}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {!isActive ? (
          <span>
            Subscription expired on {formatDate(expiryDate)} — Tap to renew
            (₹1,499 / 3 months)
          </span>
        ) : (
          <span>
            Subscription expires in {daysRemaining} day
            {daysRemaining !== 1 ? "s" : ""} ({formatDate(expiryDate)}) — Tap to
            renew
          </span>
        )}
      </button>
      <RenewSubscriptionDialog open={showRenew} onOpenChange={setShowRenew} />
    </>
  );
}
