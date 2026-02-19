import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, Send, Loader2, FileText, PenTool, History } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, Prescription } from '../backend';
import { ExternalBlob, Variant_typed_freehand_camera, Variant_telemedicine_inPerson } from '../backend';
import { useSavePrescription, useGetPrescriptions, useGetCallerUserProfile } from '../hooks/useQueries';
import PrescriptionTypedForm from './prescription/PrescriptionTypedForm';
import FreehandPad from './prescription/FreehandPad';
import PrescriptionCameraCapture from './prescription/PrescriptionCameraCapture';
import PrescriptionHistoryList from './prescription/PrescriptionHistoryList';
import { sendPrescriptionViaWhatsApp } from '../utils/whatsappPrescription';

interface PrescriptionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}

export default function PrescriptionEditorDialog({
  open,
  onOpenChange,
  appointment,
}: PrescriptionEditorDialogProps) {
  const [activeTab, setActiveTab] = useState<'typed' | 'freehand' | 'camera' | 'history'>('typed');
  const [typedContent, setTypedContent] = useState('');
  const [freehandBlob, setFreehandBlob] = useState<ExternalBlob | null>(null);
  const [cameraBlob, setCameraBlob] = useState<ExternalBlob | null>(null);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescriptionHistory, setPrescriptionHistory] = useState<Prescription[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const savePrescription = useSavePrescription();
  const getPrescriptions = useGetPrescriptions();
  const { data: userProfile } = useGetCallerUserProfile();

  // Load prescription history when dialog opens
  useEffect(() => {
    if (open && appointment.mobile) {
      loadPrescriptionHistory();
    }
  }, [open, appointment.mobile]);

  const loadPrescriptionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getPrescriptions.mutateAsync(appointment.mobile);
      // Sort by timestamp, newest first
      const sorted = [...history].sort((a, b) => Number(b.timestamp - a.timestamp));
      setPrescriptionHistory(sorted);
    } catch (error) {
      console.error('Failed to load prescription history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    try {
      let prescriptionType: Variant_typed_freehand_camera;
      let prescriptionData: Prescription['prescriptionData'];

      // Determine prescription type and data based on active tab
      if (activeTab === 'typed') {
        if (!typedContent.trim()) {
          toast.error('Please enter prescription content');
          return;
        }
        prescriptionType = Variant_typed_freehand_camera.typed;
        prescriptionData = {
          __kind__: 'typed',
          typed: typedContent,
        };
      } else if (activeTab === 'freehand') {
        if (!freehandBlob) {
          toast.error('Please draw prescription content');
          return;
        }
        prescriptionType = Variant_typed_freehand_camera.freehand;
        prescriptionData = {
          __kind__: 'freehand',
          freehand: freehandBlob,
        };
      } else if (activeTab === 'camera') {
        if (!cameraBlob) {
          toast.error('Please capture prescription image');
          return;
        }
        prescriptionType = Variant_typed_freehand_camera.camera;
        prescriptionData = {
          __kind__: 'camera',
          camera: cameraBlob,
        };
      } else {
        toast.error('Invalid prescription type');
        return;
      }

      const prescription: Prescription = {
        patientName: appointment.patientName,
        mobile: appointment.mobile,
        clinicName: userProfile?.clinicName || 'Clinic',
        prescriptionType,
        prescriptionData,
        doctorNotes: doctorNotes || '',
        consultationType: Variant_telemedicine_inPerson.inPerson,
        appointmentId: appointment.id,
        timestamp: BigInt(Date.now()) * BigInt(1000000),
        symptoms: undefined,
        allergies: undefined,
        medicalHistory: undefined,
        followUp: undefined,
      };

      await savePrescription.mutateAsync(prescription);
      toast.success('Prescription saved successfully!');
      
      // Reset form
      setTypedContent('');
      setFreehandBlob(null);
      setCameraBlob(null);
      setDoctorNotes('');
      
      // Reload history
      await loadPrescriptionHistory();
      
      // Switch to history tab to show the saved prescription
      setActiveTab('history');
    } catch (error: any) {
      console.error('Failed to save prescription:', error);
      toast.error('Failed to save prescription', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleFreehandSave = (blob: ExternalBlob) => {
    setFreehandBlob(blob);
    toast.success('Freehand prescription ready to save');
  };

  const handleCameraCapture = (blob: ExternalBlob) => {
    setCameraBlob(blob);
    setShowCameraCapture(false);
    toast.success('Camera prescription captured');
  };

  const handleSendWhatsApp = async () => {
    const clinicName = userProfile?.clinicName || 'Clinic';
    
    if (activeTab === 'typed' && typedContent.trim()) {
      await sendPrescriptionViaWhatsApp(
        appointment.mobile,
        appointment.patientName,
        typedContent,
        clinicName
      );
    } else if (activeTab === 'freehand' && freehandBlob) {
      await sendPrescriptionViaWhatsApp(
        appointment.mobile,
        appointment.patientName,
        freehandBlob,
        clinicName
      );
    } else if (activeTab === 'camera' && cameraBlob) {
      await sendPrescriptionViaWhatsApp(
        appointment.mobile,
        appointment.patientName,
        cameraBlob,
        clinicName
      );
    } else {
      toast.error('No prescription content to send');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Prescription for {appointment.patientName}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {userProfile?.clinicName || 'Clinic'}
            </p>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="typed" className="gap-2">
                <FileText className="h-4 w-4" />
                Typed
              </TabsTrigger>
              <TabsTrigger value="freehand" className="gap-2">
                <PenTool className="h-4 w-4" />
                Freehand
              </TabsTrigger>
              <TabsTrigger value="camera" className="gap-2">
                <Camera className="h-4 w-4" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="typed" className="space-y-4">
              <PrescriptionTypedForm content={typedContent} onChange={setTypedContent} />
              
              <div className="space-y-2">
                <Label htmlFor="doctor-notes">Doctor Notes (Optional)</Label>
                <Textarea
                  id="doctor-notes"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={handleSendWhatsApp}
                  variant="outline"
                  disabled={!typedContent.trim()}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send via WhatsApp
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={savePrescription.isPending || !typedContent.trim()}
                  className="gap-2"
                >
                  {savePrescription.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Prescription'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="freehand" className="space-y-4">
              <FreehandPad onSave={handleFreehandSave} />
              
              <div className="space-y-2">
                <Label htmlFor="doctor-notes-freehand">Doctor Notes (Optional)</Label>
                <Textarea
                  id="doctor-notes-freehand"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={handleSendWhatsApp}
                  variant="outline"
                  disabled={!freehandBlob}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send via WhatsApp
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={savePrescription.isPending || !freehandBlob}
                  className="gap-2"
                >
                  {savePrescription.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Prescription'
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <div className="space-y-4">
                {!cameraBlob ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Camera className="h-16 w-16 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Capture prescription using camera
                    </p>
                    <Button onClick={() => setShowCameraCapture(true)} className="gap-2">
                      <Camera className="h-4 w-4" />
                      Open Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={cameraBlob.getDirectURL()}
                        alt="Captured prescription"
                        className="w-full h-auto"
                      />
                    </div>
                    <Button
                      onClick={() => setShowCameraCapture(true)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Retake Photo
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="doctor-notes-camera">Doctor Notes (Optional)</Label>
                  <Textarea
                    id="doctor-notes-camera"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={handleSendWhatsApp}
                    variant="outline"
                    disabled={!cameraBlob}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send via WhatsApp
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={savePrescription.isPending || !cameraBlob}
                    className="gap-2"
                  >
                    {savePrescription.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Prescription'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <PrescriptionHistoryList 
                prescriptions={prescriptionHistory} 
                isLoading={isLoadingHistory}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showCameraCapture && (
        <PrescriptionCameraCapture
          open={showCameraCapture}
          onOpenChange={setShowCameraCapture}
          onCapture={handleCameraCapture}
        />
      )}
    </>
  );
}
