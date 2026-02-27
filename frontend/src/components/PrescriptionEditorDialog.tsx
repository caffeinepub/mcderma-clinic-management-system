import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, Send, Loader2, FileText, PenTool, History } from 'lucide-react';
import { toast } from 'sonner';
import type { Appointment, Prescription } from '../hooks/useQueries';
import { ExternalBlob } from '../backend';
import { useSavePrescription, usePrescriptions, useGetCallerUserProfile, useGetPatients, useAddPatient } from '../hooks/useQueries';
import PrescriptionTypedForm from './prescription/PrescriptionTypedForm';
import FreehandPad from './prescription/FreehandPad';
import PrescriptionCameraCapture from './prescription/PrescriptionCameraCapture';
import PrescriptionHistoryList from './prescription/PrescriptionHistoryList';
import { sendPrescriptionViaWhatsApp } from '../utils/whatsappPrescription';
import { normalizePhone } from '../utils/phone';

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

  const savePrescription = useSavePrescription();
  const { data: prescriptionHistory = [], isLoading: isLoadingHistory, refetch: refetchHistory } = usePrescriptions(appointment.mobile);
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: patients = [] } = useGetPatients();
  const addPatient = useAddPatient();

  const sortedPrescriptionHistory = [...prescriptionHistory].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  const ensurePatientExists = async () => {
    const normalizedMobile = normalizePhone(appointment.mobile);
    const exists = patients.find((p) => normalizePhone(p.mobile) === normalizedMobile);
    if (!exists) {
      await addPatient.mutateAsync({
        image: undefined,
        name: appointment.patientName,
        mobile: appointment.mobile,
        area: '',
        notes: '',
        prescriptionHistory: [],
      });
    }
  };

  const handleSave = async () => {
    try {
      let prescriptionType: Prescription['prescriptionType'];
      let prescriptionData: Prescription['prescriptionData'];

      if (activeTab === 'typed') {
        if (!typedContent.trim()) { toast.error('Please enter prescription content'); return; }
        prescriptionType = { typed: null };
        prescriptionData = { typed: typedContent };
      } else if (activeTab === 'freehand') {
        if (!freehandBlob) { toast.error('Please draw prescription content'); return; }
        prescriptionType = { freehand: null };
        prescriptionData = { freehand: freehandBlob };
      } else if (activeTab === 'camera') {
        if (!cameraBlob) { toast.error('Please capture prescription image'); return; }
        prescriptionType = { camera: null };
        prescriptionData = { camera: cameraBlob };
      } else {
        toast.error('Invalid prescription type'); return;
      }

      await ensurePatientExists();

      const prescription: Prescription = {
        patientName: appointment.patientName,
        mobile: appointment.mobile,
        clinicName: userProfile?.clinicName || 'Clinic',
        prescriptionType,
        prescriptionData,
        doctorNotes: doctorNotes || '',
        consultationType: { inPerson: null },
        appointmentId: [appointment.id],
        timestamp: BigInt(Date.now()) * BigInt(1000000),
        symptoms: [],
        allergies: [],
        medicalHistory: [],
        followUp: [],
      };

      await savePrescription.mutateAsync(prescription);
      toast.success('Prescription saved successfully!');
      setTypedContent('');
      setFreehandBlob(null);
      setCameraBlob(null);
      setDoctorNotes('');
      await refetchHistory();
      setActiveTab('history');
    } catch (error: any) {
      toast.error('Failed to save prescription', { description: error.message || 'Please try again' });
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
      await sendPrescriptionViaWhatsApp(appointment.mobile, appointment.patientName, typedContent, clinicName);
    } else if (activeTab === 'freehand' && freehandBlob) {
      await sendPrescriptionViaWhatsApp(appointment.mobile, appointment.patientName, freehandBlob, clinicName);
    } else if (activeTab === 'camera' && cameraBlob) {
      await sendPrescriptionViaWhatsApp(appointment.mobile, appointment.patientName, cameraBlob, clinicName);
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
            <p className="text-sm text-muted-foreground">{userProfile?.clinicName || 'Clinic'}</p>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="typed" className="gap-2"><FileText className="h-4 w-4" />Typed</TabsTrigger>
              <TabsTrigger value="freehand" className="gap-2"><PenTool className="h-4 w-4" />Freehand</TabsTrigger>
              <TabsTrigger value="camera" className="gap-2"><Camera className="h-4 w-4" />Camera</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" />History</TabsTrigger>
            </TabsList>

            <TabsContent value="typed" className="space-y-4">
              <PrescriptionTypedForm content={typedContent} onChange={setTypedContent} />
              <div className="space-y-2">
                <Label htmlFor="doctor-notes">Doctor Notes (Optional)</Label>
                <Textarea id="doctor-notes" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={handleSendWhatsApp} variant="outline" disabled={!typedContent.trim()} className="gap-2">
                  <Send className="h-4 w-4" />Send via WhatsApp
                </Button>
                <Button onClick={handleSave} disabled={savePrescription.isPending || !typedContent.trim()} className="gap-2">
                  {savePrescription.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : 'Save Prescription'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="freehand" className="space-y-4">
              <FreehandPad onSave={handleFreehandSave} />
              <div className="space-y-2">
                <Label htmlFor="doctor-notes-freehand">Doctor Notes (Optional)</Label>
                <Textarea id="doctor-notes-freehand" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={handleSendWhatsApp} variant="outline" disabled={!freehandBlob} className="gap-2">
                  <Send className="h-4 w-4" />Send via WhatsApp
                </Button>
                <Button onClick={handleSave} disabled={savePrescription.isPending || !freehandBlob} className="gap-2">
                  {savePrescription.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : 'Save Prescription'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              {!cameraBlob ? (
                <div className="text-center py-8">
                  <Button onClick={() => setShowCameraCapture(true)} className="gap-2">
                    <Camera className="h-5 w-5" />Open Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <img src={cameraBlob.getDirectURL()} alt="Captured prescription" className="w-full h-auto rounded" />
                  </div>
                  <Button onClick={() => { setCameraBlob(null); setShowCameraCapture(true); }} variant="outline" className="w-full">
                    Retake Photo
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="doctor-notes-camera">Doctor Notes (Optional)</Label>
                <Textarea id="doctor-notes-camera" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="Additional notes..." rows={2} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={handleSendWhatsApp} variant="outline" disabled={!cameraBlob} className="gap-2">
                  <Send className="h-4 w-4" />Send via WhatsApp
                </Button>
                <Button onClick={handleSave} disabled={savePrescription.isPending || !cameraBlob} className="gap-2">
                  {savePrescription.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : 'Save Prescription'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Loading history...</span>
                </div>
              ) : (
                <PrescriptionHistoryList prescriptions={sortedPrescriptionHistory} />
              )}
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
