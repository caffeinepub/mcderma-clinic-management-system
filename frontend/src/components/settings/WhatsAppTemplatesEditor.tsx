import React, { useState, useEffect } from 'react';
import { useGetWhatsAppTemplates, useSaveWhatsAppTemplate } from '../../hooks/useQueries';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_TEMPLATES: Record<string, string> = {
  appointmentReminder:
    'Hello {{patientName}}, this is a reminder for your appointment at {{clinicName}} on {{date}} at {{time}}. Please arrive 10 minutes early.',
  feedback:
    'Hello {{patientName}}, thank you for visiting {{clinicName}}. We would love to hear your feedback. Please share your experience with us!',
  leadInitial:
    'Hello {{leadName}}, thank you for your interest in {{treatmentWanted}} at {{clinicName}}. We would love to help you. When would be a good time to connect?',
  leadFollowUp:
    'Hello {{leadName}}, just following up on your inquiry about {{treatmentWanted}}. Have you had a chance to consider our offer?',
  leadAppointment:
    'Hello {{leadName}}, we would like to schedule your appointment for {{treatmentWanted}} at {{clinicName}}. Please let us know your preferred date and time.',
};

const TEMPLATE_LABELS: Record<string, string> = {
  appointmentReminder: 'Appointment Reminder',
  feedback: 'Feedback Request',
  leadInitial: 'Lead — Initial Contact',
  leadFollowUp: 'Lead — Follow Up',
  leadAppointment: 'Lead — Appointment Scheduling',
};

export default function WhatsAppTemplatesEditor() {
  const { data: templates = [], isLoading } = useGetWhatsAppTemplates();
  const saveTemplate = useSaveWhatsAppTemplate();

  const [values, setValues] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (templates.length > 0) {
      const loaded: Record<string, string> = { ...DEFAULT_TEMPLATES };
      for (const t of templates) {
        loaded[t.templateName] = t.messageContent;
      }
      setValues(loaded);
    }
  }, [templates]);

  const handleSave = async (templateName: string) => {
    setSaving(templateName);
    try {
      await saveTemplate.mutateAsync({
        templateName,
        messageContent: values[templateName] ?? '',
      });
      toast.success('Template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 size={16} className="animate-spin" />
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.keys(DEFAULT_TEMPLATES).map((key) => (
        <div key={key} className="space-y-2">
          <Label className="text-sm font-semibold">{TEMPLATE_LABELS[key]}</Label>
          <Textarea
            value={values[key] ?? ''}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [key]: e.target.value }))
            }
            rows={3}
            className="text-sm resize-none"
            placeholder={`Enter ${TEMPLATE_LABELS[key]} template...`}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSave(key)}
            disabled={saving === key}
            className="gap-1.5"
          >
            {saving === key ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            Save
          </Button>
        </div>
      ))}
    </div>
  );
}
