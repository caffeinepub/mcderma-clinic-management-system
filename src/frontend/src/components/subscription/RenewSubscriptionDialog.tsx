import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  QrCode,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSubscription } from "../../context/SubscriptionContext";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface RenewSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UPI_ID = "8898800777@jupiteraxis";

export default function RenewSubscriptionDialog({
  open,
  onOpenChange,
}: RenewSubscriptionDialogProps) {
  const { renew, isRenewing, expiryDate, daysRemaining } = useSubscription();
  const [confirmed, setConfirmed] = useState(false);
  const [showPaymentPage, setShowPaymentPage] = useState(false);

  const handleConfirm = async () => {
    try {
      await renew();
      setConfirmed(true);
      setShowPaymentPage(false);
      toast.success("Subscription renewed for 3 months!");
    } catch {
      toast.error("Failed to renew subscription. Please try again.");
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setShowPaymentPage(false);
    onOpenChange(false);
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      toast.success("UPI ID copied!");
    });
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Success screen
  if (confirmed && expiryDate) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <h2 className="text-xl font-semibold">Subscription Activated!</h2>
            <p className="text-muted-foreground text-sm">
              Your subscription is now active until
              <br />
              <span className="font-semibold text-foreground">
                {formatDate(expiryDate)}
              </span>
            </p>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Payment page with QR code
  if (showPaymentPage) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentPage(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <QrCode className="h-5 w-5 text-primary" />
              Pay via UPI
            </DialogTitle>
            <DialogDescription>
              Scan QR code or use UPI ID to pay ₹1,499
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            {/* QR Code */}
            <div className="border-2 border-primary/20 rounded-xl p-3 bg-white">
              <img
                src="/assets/generated/upi-qr-code.dim_400x400.png"
                alt="UPI QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>

            {/* Amount */}
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">₹1,499</p>
              <p className="text-xs text-muted-foreground">
                3 Month Subscription
              </p>
            </div>

            {/* UPI ID */}
            <div className="w-full rounded-xl border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-sm">
                  {UPI_ID}
                </span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5 text-primary" />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 w-full rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                After completing payment, press{" "}
                <strong>Confirm Payment & Renew</strong> below to activate your
                subscription.
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPaymentPage(false)}
              disabled={isRenewing}
            >
              Back
            </Button>
            <Button onClick={handleConfirm} disabled={isRenewing}>
              {isRenewing ? "Processing..." : "Confirm Payment & Renew"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Default renew dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Renew Subscription
          </DialogTitle>
          <DialogDescription>
            Extend your clinic app access for 3 more months.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium">3 Month Access</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Status</span>
            <span
              className={`font-medium ${
                daysRemaining <= 0
                  ? "text-red-500"
                  : daysRemaining <= 7
                    ? "text-amber-500"
                    : "text-green-600"
              }`}
            >
              {daysRemaining <= 0
                ? "Expired"
                : `${daysRemaining} days remaining`}
            </span>
          </div>
          {expiryDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Expiry</span>
              <span className="font-medium">{formatDate(expiryDate)}</span>
            </div>
          )}
          <div className="border-t pt-3 flex justify-between">
            <span className="font-semibold">Amount to Pay</span>
            <span className="font-bold text-primary text-lg">₹1,499</span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Pay ₹1,499 via UPI and press Confirm once payment is done.
          </span>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-col">
          <Button
            className="w-full"
            variant="default"
            onClick={() => setShowPaymentPage(true)}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRenewing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isRenewing}
              className="flex-1"
            >
              {isRenewing ? "Processing..." : "Confirm Payment & Renew"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
