import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { getFeedbackMessage } from '../utils/whatsappFeedback';

interface WhatsAppFeedbackPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sanitizedMobile: string;
  patientName: string;
  onConfirmSend: () => void;
}

export default function WhatsAppFeedbackPreviewDialog({
  open,
  onOpenChange,
  sanitizedMobile,
  patientName,
  onConfirmSend,
}: WhatsAppFeedbackPreviewDialogProps) {
  const feedbackMessage = getFeedbackMessage();

  const handleSend = () => {
    onConfirmSend();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send Feedback Request
          </DialogTitle>
          <DialogDescription>
            Preview the message before sending to {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Destination Number:</p>
            <p className="text-base font-semibold">+{sanitizedMobile}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Message Preview:</p>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-sm whitespace-pre-wrap">{feedbackMessage}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
