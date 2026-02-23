import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PatientView } from '../hooks/useQueries';
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
  prefilledData?: PatientView;
}

export default function PatientDialog({ open, onOpenChange, prefilledData }: PatientDialogProps) {
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
    if (prefilledData) {
      setFormData({
        name: prefilledData.name,
        mobile: prefilledData.mobile,
        area: prefilledData.area,
        notes: prefilledData.notes,
      });

      if (prefilledData.image) {
        setImagePreview(prefilledData.image.getDirectURL());
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
  }, [prefilledData, open]);

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
      let imageBlob: ExternalBlob | undefined = undefined;

      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlob.fromBytes(uint8Array);
      } else if (prefilledData?.image) {
        imageBlob = prefilledData.image;
      }

      if (prefilledData) {
        await updatePatient.mutateAsync({
          oldMobile: prefilledData.mobile,
          patient: {
            image: imageBlob,
            name: formData.name,
            mobile: formData.mobile,
            area: formData.area,
            notes: formData.notes,
          },
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
            <DialogTitle>{prefilledData ? 'Edit Patient' : 'New Patient'}</DialogTitle>
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
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenCamera}
                  disabled={isPending || isCameraLoading}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {isCameraLoading ? 'Starting...' : 'Camera'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-input')?.click()}
                  disabled={isPending}
                  className="flex-1"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {imagePreview && (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Patient preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {showCamera && (
              <div className="space-y-2">
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
                      <div>
                        <p className="font-semibold mb-2">Camera Error</p>
                        <p className="text-sm">{cameraError.message}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={!isCameraActive}
                    className="flex-1"
                  >
                    Capture
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      stopCamera();
                      setShowCamera(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
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
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
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
                ) : prefilledData ? (
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
