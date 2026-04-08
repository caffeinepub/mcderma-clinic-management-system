import { Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import RenewSubscriptionDialog from "./RenewSubscriptionDialog";

interface SubscriptionExpiredModalProps {
  open: boolean;
}

export default function SubscriptionExpiredModal({
  open,
}: SubscriptionExpiredModalProps) {
  const [showRenew, setShowRenew] = useState(false);

  return (
    <>
      <Dialog open={open}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Subscription Expired</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your clinic subscription has expired.
                <br />
                Please renew to continue adding new appointments.
              </p>
            </div>
            <div className="w-full rounded-xl border bg-muted/40 p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">3 Month Access</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renewal Fee</span>
                <span className="font-bold text-primary">₹1,499</span>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowRenew(true)}
            >
              Renew Subscription – ₹1,499
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <RenewSubscriptionDialog open={showRenew} onOpenChange={setShowRenew} />
    </>
  );
}
