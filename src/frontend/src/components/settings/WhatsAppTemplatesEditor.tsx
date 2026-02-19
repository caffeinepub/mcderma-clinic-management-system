import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useGetWhatsAppTemplates, useSaveWhatsAppTemplates } from '../../hooks/useQueries';
import { MessageSquare, Save, Users } from 'lucide-react';

export default function WhatsAppTemplatesEditor() {
  const { data: templates = [] } = useGetWhatsAppTemplates();
  const saveTemplates = useSaveWhatsAppTemplates();

  const [reminderTemplate, setReminderTemplate] = useState('');
  const [feedbackTemplate, setFeedbackTemplate] = useState('');
  const [leadInitialTemplate, setLeadInitialTemplate] = useState('');
  const [leadFollowUpTemplate, setLeadFollowUpTemplate] = useState('');
  const [leadAppointmentTemplate, setLeadAppointmentTemplate] = useState('');

  useEffect(() => {
    const reminder = templates.find(t => t.templateName === 'appointment-reminder');
    const feedback = templates.find(t => t.templateName === 'after-appointment-feedback');
    const leadInitial = templates.find(t => t.templateName === 'lead-initial-contact');
    const leadFollowUp = templates.find(t => t.templateName === 'lead-follow-up');
    const leadAppointment = templates.find(t => t.templateName === 'lead-appointment-scheduling');

    if (reminder) setReminderTemplate(reminder.messageContent);
    if (feedback) setFeedbackTemplate(feedback.messageContent);
    if (leadInitial) setLeadInitialTemplate(leadInitial.messageContent);
    if (leadFollowUp) setLeadFollowUpTemplate(leadFollowUp.messageContent);
    if (leadAppointment) setLeadAppointmentTemplate(leadAppointment.messageContent);
  }, [templates]);

  const handleSave = async () => {
    try {
      const updatedTemplates = [
        { templateName: 'appointment-reminder', messageContent: reminderTemplate },
        { templateName: 'after-appointment-feedback', messageContent: feedbackTemplate },
        { templateName: 'lead-initial-contact', messageContent: leadInitialTemplate },
        { templateName: 'lead-follow-up', messageContent: leadFollowUpTemplate },
        { templateName: 'lead-appointment-scheduling', messageContent: leadAppointmentTemplate },
      ];

      await saveTemplates.mutateAsync(updatedTemplates);
      toast.success('Templates saved successfully');
    } catch (error: any) {
      toast.error('Failed to save templates', {
        description: error.message || 'Note: Template saving is not yet available in the backend',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Appointment WhatsApp Templates
          </CardTitle>
          <CardDescription>
            Customize your WhatsApp message templates for appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reminder-template">Appointment Reminder Template</Label>
            <Textarea
              id="reminder-template"
              value={reminderTemplate}
              onChange={(e) => setReminderTemplate(e.target.value)}
              placeholder="Enter appointment reminder message template..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders: {'{patientName}'}, {'{time}'}, {'{date}'}, {'{treatment}'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-template">After Appointment Feedback Template</Label>
            <Textarea
              id="feedback-template"
              value={feedbackTemplate}
              onChange={(e) => setFeedbackTemplate(e.target.value)}
              placeholder="Enter feedback request message template..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders: {'{patientName}'}, {'{clinicName}'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lead Entry WhatsApp Templates
          </CardTitle>
          <CardDescription>
            Customize your WhatsApp message templates for lead communication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lead-initial-template">Initial Contact Template</Label>
            <Textarea
              id="lead-initial-template"
              value={leadInitialTemplate}
              onChange={(e) => setLeadInitialTemplate(e.target.value)}
              placeholder="Enter initial contact message template..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders: {'{leadName}'}, {'{treatmentWanted}'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-followup-template">Follow-up Template</Label>
            <Textarea
              id="lead-followup-template"
              value={leadFollowUpTemplate}
              onChange={(e) => setLeadFollowUpTemplate(e.target.value)}
              placeholder="Enter follow-up message template..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders: {'{leadName}'}, {'{treatmentWanted}'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-appointment-template">Appointment Scheduling Template</Label>
            <Textarea
              id="lead-appointment-template"
              value={leadAppointmentTemplate}
              onChange={(e) => setLeadAppointmentTemplate(e.target.value)}
              placeholder="Enter appointment scheduling message template..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Use placeholders: {'{leadName}'}, {'{treatmentWanted}'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveTemplates.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {saveTemplates.isPending ? 'Saving...' : 'Save All Templates'}
        </Button>
      </div>
    </div>
  );
}
