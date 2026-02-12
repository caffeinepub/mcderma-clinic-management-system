import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Patient } from '../backend';
import { ExternalBlob } from '../backend';
import { useAddPatient, useUpdatePatient } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Camera, Image as ImageIcon, Loader2, Contact } from 'lucide-react';
import { useCamera } from '@/camera/useCamera';
import { useContactPicker } from '../hooks/useContactPicker';
import { normalizePhone } from '../utils/phone';
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
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingContact, setPendingContact] = useState({ name: '', mobile: '' });

  const {
    isActive: isCameraActive,
    isSupported: isCameraSupported,
    error: cameraError,
    isLoading: isCameraLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: 'environment',
    width: 1280,
    height: 720,
    quality: 0.9,
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        mobile: patient.mobile,
        area: patient.area,
        notes: patient.notes,
      });

      if (patient.image) {
        setImagePreview(patient.image.getDirectURL());
      }
    } else {
      setFormData({
        name: '',
        mobile: '',
        area: '',
        notes: '',
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [patient, open]);

  useEffect(() => {
    if (!open && isCameraActive) {
      stopCamera();
      setShowCamera(false);
    }
  }, [open, isCameraActive, stopCamera]);

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

  const handleOpenCamera = async () => {
    setShowCamera(true);
    const success = await startCamera();
    if (!success) {
      toast.error('Failed to start camera');
      setShowCamera(false);
    }
  };

  const handleCapturePhoto = async () => {
    const photo = await capturePhoto();
    if (photo) {
      setImageFile(photo);
      setImagePreview(URL.createObjectURL(photo));
      await stopCamera();
      setShowCamera(false);
      toast.success('Photo captured');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      toast.success('Image selected');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageBlob: ExternalBlob | null = null;

      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlob.fromBytes(uint8Array);
      } else if (patient?.image) {
        imageBlob = patient.image;
      }

      if (patient) {
        await updatePatient.mutateAsync({
          mobile: patient.mobile,
          image: imageBlob,
          name: formData.name,
          newMobile: formData.mobile,
          area: formData.area,
          notes: formData.notes,
        });
        toast.success('Patient updated successfully');
      } else {
        await addPatient.mutateAsync({
          image: imageBlob,
          name: formData.name,
          mobile: formData.mobile,
          area: formData.area,
          notes: formData.notes,
        });
        toast.success('Patient added successfully');
      }

      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to save patient');
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

            <div className="space-y-2">
              <Label>Patient Photo</Label>
              {showCamera ? (
                <div className="space-y-2">
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  {cameraError && (
                    <p className="text-sm text-destructive">{cameraError.message}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCapturePhoto}
                      disabled={!isCameraActive || isCameraLoading}
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        stopCamera();
                        setShowCamera(false);
                      }}
                      disabled={isCameraLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {imagePreview && (
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src={imagePreview}
                        alt="Patient preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    {isCameraSupported && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenCamera}
                        disabled={isPending}
                        className="flex-1"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Camera
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('imageInput')?.click()}
                      disabled={isPending}
                      className="flex-1"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Gallery
                    </Button>
                  </div>
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Enter notes"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : patient ? (
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
