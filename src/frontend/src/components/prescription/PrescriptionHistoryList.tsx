import { Card, CardContent } from '@/components/ui/card';
import { FileText, Image as ImageIcon, Camera } from 'lucide-react';
import { formatDateTime12Hour } from '../../lib/utils';
import type { Prescription } from '../../backend';

interface PrescriptionHistoryListProps {
  prescriptions: Prescription[];
  isLoading: boolean;
}

export default function PrescriptionHistoryList({ prescriptions, isLoading }: PrescriptionHistoryListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Loading history...</p>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No prescription history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {prescriptions.map((prescription, index) => {
        const isTyped = prescription.prescriptionData.__kind__ === 'typed';
        const isFreehand = prescription.prescriptionData.__kind__ === 'freehand';
        const isCamera = prescription.prescriptionData.__kind__ === 'camera';

        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {isTyped && <FileText className="h-5 w-5 text-primary" />}
                  {isFreehand && <ImageIcon className="h-5 w-5 text-blue-600" />}
                  {isCamera && <Camera className="h-5 w-5 text-green-600" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {isTyped && 'Typed Prescription'}
                      {isFreehand && 'Freehand Prescription'}
                      {isCamera && 'Camera Prescription'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime12Hour(new Date(Number(prescription.timestamp) / 1000000))}
                    </span>
                  </div>
                  
                  {isTyped && prescription.prescriptionData.__kind__ === 'typed' && (
                    <p className="text-sm text-foreground line-clamp-2">
                      {prescription.prescriptionData.typed}
                    </p>
                  )}
                  
                  {isFreehand && prescription.prescriptionData.__kind__ === 'freehand' && (
                    <div className="mt-2">
                      <img
                        src={prescription.prescriptionData.freehand.getDirectURL()}
                        alt="Freehand Prescription"
                        className="w-full h-auto rounded border max-h-[200px] object-contain"
                      />
                    </div>
                  )}

                  {isCamera && prescription.prescriptionData.__kind__ === 'camera' && (
                    <div className="mt-2">
                      <img
                        src={prescription.prescriptionData.camera.getDirectURL()}
                        alt="Camera Prescription"
                        className="w-full h-auto rounded border max-h-[200px] object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
