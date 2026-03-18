import { useCamera } from "@/camera/useCamera";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Contact,
  Image as ImageIcon,
  Loader2,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useContactPicker } from "../hooks/useContactPicker";
import type { PatientView } from "../hooks/useQueries";
import { useAddPatient, useUpdatePatient } from "../hooks/useQueries";
import { normalizePhone } from "../utils/phone";
import { addCustomTreatment, getTreatmentsList } from "../utils/treatmentsList";
import ContactImportReviewDialog from "./ContactImportReviewDialog";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledData?: PatientView;
}

export default function PatientDialog({
  open,
  onOpenChange,
  prefilledData,
}: PatientDialogProps) {
  const addPatient = useAddPatient();
  const updatePatient = useUpdatePatient();
  const { pickContact } = useContactPicker();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    area: "",
    treatment: "",
    notes: "",
  });
  const [treatments, setTreatments] = useState<string[]>(() =>
    getTreatmentsList(),
  );
  const [showAddTreatment, setShowAddTreatment] = useState(false);
  const [newTreatmentInput, setNewTreatmentInput] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [pendingContact, setPendingContact] = useState({
    name: "",
    mobile: "",
  });

  const {
    isActive: isCameraActive,
    error: cameraError,
    isLoading: isCameraLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: "environment",
    width: 1280,
    height: 720,
    quality: 0.9,
  });

  useEffect(() => {
    setTreatments(getTreatmentsList());
    if (prefilledData) {
      // Extract treatment from notes if it starts with "Treatment:"
      const notesStr = prefilledData.notes || "";
      const treatmentMatch = notesStr.match(/^Treatment:\s*([^\n]+)/i);
      const extractedTreatment = treatmentMatch ? treatmentMatch[1].trim() : "";
      const remainingNotes = treatmentMatch
        ? notesStr.replace(treatmentMatch[0], "").trim()
        : notesStr;

      setFormData({
        name: prefilledData.name,
        mobile: prefilledData.mobile,
        area: prefilledData.area,
        treatment: extractedTreatment,
        notes: remainingNotes,
      });

      if (prefilledData.image) {
        setImagePreview(prefilledData.image.getDirectURL());
      }
    } else {
      setFormData({
        name: "",
        mobile: "",
        area: "",
        treatment: "",
        notes: "",
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [prefilledData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open && isCameraActive) {
      stopCamera();
      setShowCamera(false);
    }
  }, [open, isCameraActive, stopCamera]);

  const handlePickContact = async () => {
    try {
      const contact = await pickContact();
      const normalizedMobile = normalizePhone(contact.mobile || "");
      setPendingContact({
        name: contact.name || "",
        mobile: normalizedMobile,
      });
      setShowReviewDialog(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to access phonebook");
    }
  };

  const handleConfirmContact = (name: string, mobile: string) => {
    setFormData((prev) => ({
      ...prev,
      name: name || prev.name,
      mobile: mobile || prev.mobile,
    }));
    toast.success("Contact added from phonebook");
  };

  const handleAddCustomTreatment = () => {
    if (!newTreatmentInput.trim()) return;
    const updated = addCustomTreatment(newTreatmentInput.trim());
    setTreatments(updated);
    setFormData((prev) => ({ ...prev, treatment: newTreatmentInput.trim() }));
    setNewTreatmentInput("");
    setShowAddTreatment(false);
    toast.success("Treatment added");
  };

  const handleOpenCamera = async () => {
    setShowCamera(true);
    const success = await startCamera();
    if (!success) {
      toast.error("Failed to start camera");
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
      toast.success("Photo captured");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      toast.success("Image selected");
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

      // Combine treatment and notes into the notes field
      const combinedNotes = [
        formData.treatment ? `Treatment: ${formData.treatment}` : "",
        formData.notes,
      ]
        .filter(Boolean)
        .join("\n");

      if (prefilledData) {
        await updatePatient.mutateAsync({
          oldMobile: prefilledData.mobile,
          patient: {
            image: imageBlob,
            name: formData.name,
            mobile: formData.mobile,
            area: formData.area,
            notes: combinedNotes,
          },
        });
        toast.success("Patient updated successfully");
      } else {
        await addPatient.mutateAsync({
          image: imageBlob,
          name: formData.name,
          mobile: formData.mobile,
          area: formData.area,
          notes: combinedNotes,
        });
        toast.success("Patient added successfully");
      }

      onOpenChange(false);
    } catch (_error) {
      console.error("Patient save error:", _error);
      toast.error("Failed to save patient");
    }
  };

  const isPending = addPatient.isPending || updatePatient.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {prefilledData ? "Edit Patient" : "New Patient"}
            </DialogTitle>
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
                  {isCameraLoading ? "Starting..." : "Camera"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-input")?.click()}
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
                <div
                  className="relative bg-black rounded-lg overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">
                  +91
                </span>
                <Input
                  className="rounded-l-none flex-1"
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                  required
                  placeholder="10-digit number"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) =>
                  setFormData({ ...formData, area: e.target.value })
                }
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Treatment</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.treatment}
                  onValueChange={(v) =>
                    setFormData({ ...formData, treatment: v })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger
                    className="flex-1"
                    data-ocid="patient.treatment.select"
                  >
                    <SelectValue placeholder="Select treatment" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatments.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddTreatment((v) => !v)}
                  disabled={isPending}
                  title="Add custom treatment"
                  data-ocid="patient.treatment.add_button"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showAddTreatment && (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="New treatment name"
                    value={newTreatmentInput}
                    onChange={(e) => setNewTreatmentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomTreatment();
                      }
                    }}
                    data-ocid="patient.treatment.input"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomTreatment}
                    data-ocid="patient.treatment.save_button"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Treatment History / Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                disabled={isPending}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : prefilledData ? (
                  "Update"
                ) : (
                  "Add"
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
