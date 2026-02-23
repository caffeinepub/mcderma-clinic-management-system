import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrescriptions } from '../hooks/useQueries';
import PrescriptionHistoryList from './prescription/PrescriptionHistoryList';

interface PatientPrescriptionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientMobile: string;
}

export default function PatientPrescriptionHistoryDialog({
  open,
  onOpenChange,
  patientName,
  patientMobile,
}: PatientPrescriptionHistoryDialogProps) {
  const { data: prescriptions = [], isLoading } = usePrescriptions(patientMobile);

  // Sort by timestamp, newest first
  const sortedPrescriptions = [...prescriptions].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Prescription History - {patientName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            All prescriptions for this patient
          </p>
        </DialogHeader>

        <div className="mt-4">
          <PrescriptionHistoryList 
            prescriptions={sortedPrescriptions} 
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
