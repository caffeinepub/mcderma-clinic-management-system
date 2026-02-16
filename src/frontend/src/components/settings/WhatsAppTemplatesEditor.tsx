import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useGetWhatsAppTemplates, useSaveWhatsAppTemplate } from '../../hooks/useQueries';

export default function WhatsAppTemplatesEditor() {
  const { data: templates = {}, isLoading } = useGetWhatsAppTemplates();
  const saveTemplate = useSaveWhatsAppTemplate();

  const [appointmentReminder, setAppointmentReminder] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (templates['appointment_reminder']) {
      setAppointmentReminder(templates['appointment_reminder'].messageContent);
    }
    if (templates['after_appointment_feedback']) {
      setFeedbackMessage(templates['after_appointment_feedback'].messageContent);
    }
  }, [templates]);

  const handleSaveTemplate = async (templateName: string, content: string) => {
    if (!content.trim()) {
      toast.error('Template content cannot be empty');
      return;
    }

    try {
      await saveTemplate.mutateAsync({
        templateName,
        messageContent: content,
      });
      toast.success('Template saved successfully');
    } catch (error: any) {
      toast.error('Failed to save template', {
        description: error.message || 'Please try again',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Message Templates
          </CardTitle>
          <CardDescription>
            Customize the WhatsApp messages sent to patients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="appointment-reminder">Appointment Reminder Message</Label>
            <Textarea
              id="appointment-reminder"
              value={appointmentReminder}
              onChange={(e) => setAppointmentReminder(e.target.value)}
              placeholder="Enter appointment reminder message..."
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={() => handleSaveTemplate('appointment_reminder', appointmentReminder)}
              disabled={saveTemplate.isPending}
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Reminder Template
            </Button>
          </div>

          <div className="space-y-3">
            <Label htmlFor="feedback-message">After Appointment Feedback Message</Label>
            <Textarea
              id="feedback-message"
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Enter feedback request message..."
              rows={6}
              className="resize-none"
            />
            <Button
              onClick={() => handleSaveTemplate('after_appointment_feedback', feedbackMessage)}
              disabled={saveTemplate.isPending}
              size="sm"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Feedback Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
