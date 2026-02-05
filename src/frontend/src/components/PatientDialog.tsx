import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Patient } from '../backend';
import { ExternalBlob } from '../backend';
import { Camera, Upload, Loader2, Contact } from 'lucide-react';
import { useCamera } from '../camera/useCamera';
import { useAddPatient, useUpdatePatient } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useContactPicker } from '../hooks/useContactPicker';
import { normalizePhoneNumber } from '../utils/phone';
import ContactImportReviewDialog from './ContactImportReviewDialog';

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient;
}

export default function PatientDialog({ open, onOpenChange, patient }: PatientDialogProps) {
  const addPatient = useAddPatient();
  const updatePatient = useUpdatePatient();
  const { pickContact } = useContactPicker();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    area: '',
    notes: '',
    imageBlob: null as ExternalBlob | null,
    imagePreview: '',
  });
  const [showCamera, setShowCamera] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingContact, setPendingContact] = useState({ name: '', mobile: '' });

  const { isActive, startCamera, stopCamera, capturePhoto, videoRef, canvasRef, error } = useCamera({
    facingMode: 'user',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        mobile: patient.mobile,
        area: patient.area,
        notes: patient.notes,
        imageBlob: patient.image || null,
        imagePreview: patient.image ? patient.image.getDirectURL() : '',
      });
    } else {
      setFormData({
        name: '',
        mobile: '',
        area: '',
        notes: '',
        imageBlob: null,
        imagePreview: '',
      });
    }
    setShowCamera(false);
  }, [patient, open]);

  useEffect(() => {
    if (!open && isActive) {
      stopCamera();
    }
  }, [open, isActive, stopCamera]);

  const handlePickContact = async () => {
    try {
      const contact = await pickContact();
      const normalizedMobile = normalizePhoneNumber(contact.mobile || '');
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

    try {
      if (patient) {
        await updatePatient.mutateAsync({
          mobile: patient.mobile,
          image: formData.imageBlob,
          name: formData.name,
          newMobile: formData.mobile,
          area: formData.area,
          notes: formData.notes,
        });
        toast.success('Patient updated successfully');
      } else {
        await addPatient.mutateAsync({
          image: formData.imageBlob,
          name: formData.name,
          mobile: formData.mobile,
          area: formData.area,
          notes: formData.notes,
        });
        toast.success('Patient added successfully');
      }
      onOpenChange(false);
      if (isActive) {
        stopCamera();
      }
    } catch (error) {
      toast.error('Failed to save patient');
    }
  };

  const handleCameraCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      const arrayBuffer = await photo.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          imageBlob: blob,
          imagePreview: reader.result as string 
        });
        setShowCamera(false);
        stopCamera();
        toast.success('Photo captured successfully');
      };
      reader.readAsDataURL(photo);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          imageBlob: blob,
          imagePreview: reader.result as string 
        });
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartCamera = async () => {
    setShowCamera(true);
    const success = await startCamera();
    if (!success) {
      toast.error('Failed to start camera');
      setShowCamera(false);
    }
  };

  const isPending = addPatient.isPending || updatePatient.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{patient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Patient Photo</Label>
              {formData.imagePreview && !showCamera && (
                <div className="flex justify-center mb-2">
                  <img src={formData.imagePreview} alt="Patient" className="h-32 w-32 rounded-full object-cover border-4 border-primary/20" />
                </div>
              )}
              {showCamera && (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error.message}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleCameraCapture} disabled={!isActive} className="flex-1">
                      Capture Photo
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { stopCamera(); setShowCamera(false); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {!showCamera && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleStartCamera} className="flex-1" disabled={isPending}>
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                  <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()} className="flex-1" disabled={isPending}>
                    <Upload className="h-4 w-4 mr-2" />
                    Gallery
                  </Button>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter patient name"
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
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Enter area/location"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Treatment History / Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter treatment history or notes"
                rows={4}
                disabled={isPending}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Patient'
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
