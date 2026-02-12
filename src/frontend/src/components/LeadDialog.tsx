import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import type { Lead } from '../backend';
import { format } from 'date-fns';
import { useAddLead, useUpdateLead, useAddAppointment } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Loader2, Contact } from 'lucide-react';
import { useContactPicker } from '../hooks/useContactPicker';
import { normalizePhone } from '../utils/phone';
import ContactImportReviewDialog from './ContactImportReviewDialog';

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
}

export default function LeadDialog({ open, onOpenChange, lead }: LeadDialogProps) {
  const addLead = useAddLead();
  const updateLead = useUpdateLead();
  const addAppointment = useAddAppointment();
  const { pickContact } = useContactPicker();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    treatmentWanted: '',
    area: '',
    followUpDate: format(new Date(), 'yyyy-MM-dd'),
    expectedTreatmentDate: format(new Date(), 'yyyy-MM-dd'),
    rating: 5,
    doctorRemark: '',
    addToAppointment: false,
    leadStatus: 'Ringing',
  });

  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingContact, setPendingContact] = useState({ name: '', mobile: '' });

  useEffect(() => {
    if (lead) {
      const followUpDate = new Date(Number(lead.followUpDate) / 1000000);
      const expectedDate = new Date(Number(lead.expectedTreatmentDate) / 1000000);
      setFormData({
        name: lead.leadName,
        mobile: lead.mobile,
        treatmentWanted: lead.treatmentWanted,
        area: lead.area,
        followUpDate: format(followUpDate, 'yyyy-MM-dd'),
        expectedTreatmentDate: format(expectedDate, 'yyyy-MM-dd'),
        rating: lead.rating,
        doctorRemark: lead.doctorRemark,
        addToAppointment: false,
        leadStatus: lead.leadStatus || 'Ringing',
      });
    } else {
      setFormData({
        name: '',
        mobile: '',
        treatmentWanted: '',
        area: '',
        followUpDate: format(new Date(), 'yyyy-MM-dd'),
        expectedTreatmentDate: format(new Date(), 'yyyy-MM-dd'),
        rating: 5,
        doctorRemark: '',
        addToAppointment: false,
        leadStatus: 'Ringing',
      });
    }
  }, [lead, open]);

  const handlePickContact = async () => {
    try {
      const contact = await pickContact();
      const normalizedMobile = normalizePhone(contact.mobile || '');
      setPendingContact({
        name: contact.name || '',
        mobile: normalizedMobile,
      });
      setShowReviewDialog(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to access phonebook');
    }
  };

  const handleConfirmContact = (name: string, mobile: string) => {
    setFormData({
      ...formData,
      name: name || formData.name,
      mobile: mobile || formData.mobile,
    });
    toast.success('Contact added from phonebook');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const followUpDateTime = new Date(formData.followUpDate).getTime() * 1000000;
    const expectedDateTime = new Date(formData.expectedTreatmentDate).getTime() * 1000000;

    try {
      if (lead) {
        await updateLead.mutateAsync({
          mobile: lead.mobile,
          leadName: formData.name,
          newMobile: formData.mobile,
          treatmentWanted: formData.treatmentWanted,
          area: formData.area,
          followUpDate: BigInt(followUpDateTime),
          expectedTreatmentDate: BigInt(expectedDateTime),
          rating: formData.rating,
          doctorRemark: formData.doctorRemark,
          addToAppointment: formData.addToAppointment,
          leadStatus: formData.leadStatus,
        });
        toast.success('Lead updated successfully');
      } else {
        await addLead.mutateAsync({
          leadName: formData.name,
          mobile: formData.mobile,
          treatmentWanted: formData.treatmentWanted,
          area: formData.area,
          followUpDate: BigInt(followUpDateTime),
          expectedTreatmentDate: BigInt(expectedDateTime),
          rating: formData.rating,
          doctorRemark: formData.doctorRemark,
          addToAppointment: formData.addToAppointment,
          leadStatus: formData.leadStatus,
        });
        toast.success('Lead added successfully');
      }

      if (formData.addToAppointment) {
        const appointmentDateTime = new Date(`${formData.expectedTreatmentDate}T09:00`).getTime() * 1000000;
        await addAppointment.mutateAsync({
          patientName: formData.name,
          mobile: formData.mobile,
          appointmentTime: BigInt(appointmentDateTime),
          notes: `Treatment: ${formData.treatmentWanted}`,
        });
        toast.success('Appointment created');
      }

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save lead');
    }
  };

  const isPending = addLead.isPending || updateLead.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lead ? 'Edit Lead' : 'New Lead'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePickContact}
                disabled={isPending}
                className="gap-2"
              >
                <Contact className="h-4 w-4" />
                Add from phonebook
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Lead Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter lead name"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
                placeholder="Enter mobile number"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentWanted">Treatment Wanted *</Label>
              <Input
                id="treatmentWanted"
                value={formData.treatmentWanted}
                onChange={(e) => setFormData({ ...formData, treatmentWanted: e.target.value })}
                required
                placeholder="e.g., Skin treatment, Hair treatment"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
                placeholder="Enter area"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpDate">Follow-up Date *</Label>
              <Input
                id="followUpDate"
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedTreatmentDate">Expected Treatment Date *</Label>
              <Input
                id="expectedTreatmentDate"
                type="date"
                value={formData.expectedTreatmentDate}
                onChange={(e) => setFormData({ ...formData, expectedTreatmentDate: e.target.value })}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Rating: {formData.rating}/10</Label>
              <Slider
                value={[formData.rating]}
                onValueChange={(value) => setFormData({ ...formData, rating: value[0] })}
                min={0}
                max={10}
                step={1}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorRemark">Doctor's Remark</Label>
              <Textarea
                id="doctorRemark"
                value={formData.doctorRemark}
                onChange={(e) => setFormData({ ...formData, doctorRemark: e.target.value })}
                rows={3}
                placeholder="Enter doctor's remarks"
                disabled={isPending}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="addToAppointment"
                checked={formData.addToAppointment}
                onCheckedChange={(checked) => setFormData({ ...formData, addToAppointment: checked as boolean })}
                disabled={isPending}
              />
              <Label htmlFor="addToAppointment" className="cursor-pointer">
                Add to appointments
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : lead ? (
                  'Update'
                ) : (
                  'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ContactImportReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        contactName={pendingContact.name}
        contactMobile={pendingContact.mobile}
        onConfirm={handleConfirmContact}
      />
    </>
  );
}
