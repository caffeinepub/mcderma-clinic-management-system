import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFeedbackPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sanitizedMobile: string;
  patientName: string;
  onConfirmSend: () => void;
  message: string;
}

export default function WhatsAppFeedbackPreviewDialog({
  open,
  onOpenChange,
  sanitizedMobile,
  patientName,
  onConfirmSend,
  message,
}: WhatsAppFeedbackPreviewDialogProps) {
  const handleSend = () => {
    onConfirmSend();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send Feedback Request
          </DialogTitle>
          <DialogDescription>
            Review the message before sending to {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-1">Sending to:</p>
            <p className="text-sm text-muted-foreground">+{sanitizedMobile}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Message:</p>
            <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
              {message}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
