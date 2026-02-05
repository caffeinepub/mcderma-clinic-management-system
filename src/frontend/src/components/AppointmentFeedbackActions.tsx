import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { validateMobileForWhatsApp, generateWhatsAppFeedbackURL } from '../utils/whatsappFeedback';
import WhatsAppFeedbackPreviewDialog from './WhatsAppFeedbackPreviewDialog';

interface AppointmentFeedbackActionsProps {
  mobile: string;
  patientName: string;
  compact?: boolean;
}

export default function AppointmentFeedbackActions({ mobile, patientName, compact = false }: AppointmentFeedbackActionsProps) {
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [sanitizedMobile, setSanitizedMobile] = useState('');

  const handleFeedbackClick = () => {
    const { isValid, sanitized } = validateMobileForWhatsApp(mobile);

    if (!isValid) {
      toast.error('Cannot send feedback request', {
        description: `No valid mobile number found for ${patientName}. Please update the patient's contact information.`,
      });
      return;
    }

    setSanitizedMobile(sanitized);
    setShowPreviewDialog(true);
  };

  const handleConfirmSend = () => {
    const url = generateWhatsAppFeedbackURL(mobile);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (compact) {
    return (
      <>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleFeedbackClick}
          className="h-8 w-8"
          title="Send Feedback Request"
        >
          <MessageCircle className="h-4 w-4 text-green-600" />
        </Button>
        <WhatsAppFeedbackPreviewDialog
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          sanitizedMobile={sanitizedMobile}
          patientName={patientName}
          onConfirmSend={handleConfirmSend}
        />
      </>
    );
  }

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleFeedbackClick}
        className="h-9 w-9"
        title="Send Feedback Request"
      >
        <MessageCircle className="h-4 w-4 text-green-600" />
      </Button>
      <WhatsAppFeedbackPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        sanitizedMobile={sanitizedMobile}
        patientName={patientName}
        onConfirmSend={handleConfirmSend}
      />
    </>
  );
}
