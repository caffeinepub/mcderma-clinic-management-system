import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Edit, Trash2, Star } from 'lucide-react';
import { formatDateDDMMYY } from '../lib/utils';
import type { Lead } from '../hooks/useQueries';
import { useDeleteLead, useUpdateLead, useGetWhatsAppTemplates } from '../hooks/useQueries';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getLeadInitialContactMessage, openWhatsAppWithLeadMessage } from '../utils/whatsappTemplates';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}

export default function LeadCard({ lead, onEdit }: LeadCardProps) {
  const deleteLead = useDeleteLead();
  const updateLead = useUpdateLead();
  const { data: templates = [] } = useGetWhatsAppTemplates();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'initial' | 'followup' | 'appointment'>('initial');

  const handleDelete = async () => {
    try {
      await deleteLead.mutateAsync(lead.mobile);
      toast.success('Lead deleted successfully');
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error('Failed to delete lead', { description: error.message || 'Please try again' });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLead.mutateAsync({ ...lead, leadStatus: newStatus });
      toast.success('Status updated successfully');
    } catch (error: any) {
      toast.error('Failed to update status', { description: error.message || 'Please try again' });
    }
  };

  const handleCall = () => { window.location.href = `tel:${lead.mobile}`; };

  const handleWhatsApp = () => { setShowTemplateDialog(true); };

  const handleSendTemplate = () => {
    const leadInitialTemplate = templates.find(t => t.templateName === 'lead-initial-contact');
    const leadFollowUpTemplate = templates.find(t => t.templateName === 'lead-follow-up');
    const leadAppointmentTemplate = templates.find(t => t.templateName === 'lead-appointment-scheduling');

    const leadData = { leadName: lead.leadName, mobile: lead.mobile, treatmentWanted: lead.treatmentWanted };
    let message = '';

    if (selectedTemplate === 'initial') {
      message = getLeadInitialContactMessage(leadData, leadInitialTemplate?.messageContent);
    } else if (selectedTemplate === 'followup') {
      message = getLeadInitialContactMessage(leadData, leadFollowUpTemplate?.messageContent);
    } else if (selectedTemplate === 'appointment') {
      message = getLeadInitialContactMessage(leadData, leadAppointmentTemplate?.messageContent);
    }

    const success = openWhatsAppWithLeadMessage(lead.mobile, message);
    if (success) {
      toast.success('Opening WhatsApp...');
      setShowTemplateDialog(false);
    } else {
      toast.error('Failed to open WhatsApp');
    }
  };

  const followUpDate = new Date(Number(lead.followUpDate) / 1000000);
  const expectedDate = new Date(Number(lead.expectedTreatmentDate) / 1000000);

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{lead.leadName}</h3>
                <p className="text-sm text-muted-foreground">{lead.mobile}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: lead.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <Select value={lead.leadStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ringing">Ringing</SelectItem>
                    <SelectItem value="Not Picked">Not Picked</SelectItem>
                    <SelectItem value="Callback">Callback</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Treatment:</span> {lead.treatmentWanted}</p>
              <p><span className="font-medium">Area:</span> {lead.area}</p>
              <p><span className="font-medium">Follow-up:</span> {formatDateDDMMYY(followUpDate)}</p>
              <p><span className="font-medium">Expected Date:</span> {formatDateDDMMYY(expectedDate)}</p>
              {lead.doctorRemark && (
                <p><span className="font-medium">Remark:</span> {lead.doctorRemark}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={handleCall} className="flex-1 gap-2">
                <Phone className="h-4 w-4" />Call
              </Button>
              <Button size="sm" variant="outline" onClick={handleWhatsApp} className="flex-1 gap-2">
                <MessageCircle className="h-4 w-4" />WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => onEdit(lead)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDeleteDialog(true)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>Are you sure you want to delete this lead? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLead.isPending}>
              {deleteLead.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select WhatsApp Template</DialogTitle>
            <DialogDescription>Choose a message template to send to {lead.leadName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="initial">Initial Contact</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
                <SelectItem value="appointment">Appointment Scheduling</SelectItem>
              </SelectContent>
            </Select>
            <div className="p-3 bg-muted rounded-md text-sm">
              <p className="font-medium mb-2">Preview:</p>
              <p className="text-muted-foreground">
                {selectedTemplate === 'initial' && getLeadInitialContactMessage({ leadName: lead.leadName, mobile: lead.mobile, treatmentWanted: lead.treatmentWanted })}
                {selectedTemplate === 'followup' && `Hi ${lead.leadName}, following up on your inquiry about ${lead.treatmentWanted}. Are you still interested?`}
                {selectedTemplate === 'appointment' && `Hello ${lead.leadName}! We are ready to schedule your appointment for ${lead.treatmentWanted}.`}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
            <Button onClick={handleSendTemplate} className="gap-2">
              <MessageCircle className="h-4 w-4" />Send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
