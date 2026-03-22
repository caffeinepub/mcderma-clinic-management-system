import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  X,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";
import type { Prescription } from "../../backend";
import { formatDateTime12Hour } from "../../utils/dateUtils";
import { sendPrescriptionViaWhatsApp } from "../../utils/whatsappPrescription";

interface PrescriptionHistoryListProps {
  prescriptions: Prescription[];
  isLoading: boolean;
  patientMobile?: string;
}

function FullScreenViewer({
  src,
  onClose,
}: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-white text-black rounded-full p-2 shadow-lg border-2 border-gray-300 hover:bg-gray-100 transition-colors"
        style={{ minWidth: 44, minHeight: 44 }}
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="Close fullscreen"
      />
      <img
        src={src}
        alt="Prescription"
        className="relative z-10 max-w-full max-h-full object-contain pointer-events-none"
      />
    </div>
  );
}

export default function PrescriptionHistoryList({
  prescriptions,
  isLoading,
  patientMobile,
}: PrescriptionHistoryListProps) {
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
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
    <>
      {zoomSrc && (
        <FullScreenViewer src={zoomSrc} onClose={() => setZoomSrc(null)} />
      )}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {prescriptions.map((prescription) => {
          const isTyped = prescription.prescriptionData.__kind__ === "typed";
          const isFreehand =
            prescription.prescriptionData.__kind__ === "freehand";
          const isCamera = prescription.prescriptionData.__kind__ === "camera";

          const imageSrc =
            isFreehand && prescription.prescriptionData.__kind__ === "freehand"
              ? prescription.prescriptionData.freehand.getDirectURL()
              : isCamera && prescription.prescriptionData.__kind__ === "camera"
                ? prescription.prescriptionData.camera.getDirectURL()
                : null;

          const label = isTyped
            ? "Typed Prescription"
            : isFreehand
              ? "Freehand Prescription"
              : "Camera Prescription";

          const handleWhatsApp = async () => {
            if (!patientMobile) return;
            const patientName = prescription.patientName || "Patient";
            const clinicName = prescription.clinicName || "McDerma Clinic";

            if (isTyped && prescription.prescriptionData.__kind__ === "typed") {
              await sendPrescriptionViaWhatsApp(
                patientMobile,
                patientName,
                prescription.prescriptionData.typed,
                clinicName,
              );
            } else if (
              isFreehand &&
              prescription.prescriptionData.__kind__ === "freehand"
            ) {
              await sendPrescriptionViaWhatsApp(
                patientMobile,
                patientName,
                prescription.prescriptionData.freehand,
                clinicName,
              );
            } else if (
              isCamera &&
              prescription.prescriptionData.__kind__ === "camera"
            ) {
              await sendPrescriptionViaWhatsApp(
                patientMobile,
                patientName,
                prescription.prescriptionData.camera,
                clinicName,
              );
            }
          };

          return (
            <Card
              key={prescription.timestamp.toString()}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {isTyped && <FileText className="h-5 w-5 text-primary" />}
                    {isFreehand && (
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    )}
                    {isCamera && <Camera className="h-5 w-5 text-green-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime12Hour(
                          new Date(Number(prescription.timestamp) / 1000000),
                        )}
                      </span>
                    </div>

                    {isTyped &&
                      prescription.prescriptionData.__kind__ === "typed" && (
                        <p className="text-sm text-foreground line-clamp-2">
                          {prescription.prescriptionData.typed}
                        </p>
                      )}

                    {imageSrc && (
                      <div className="mt-2">
                        <img
                          src={imageSrc}
                          alt={label}
                          className="w-full h-auto rounded border max-h-[200px] object-contain"
                        />
                        {/* Action buttons for image prescriptions */}
                        <div className="flex gap-2 mt-2">
                          {isCamera && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs gap-1"
                              onClick={() => setZoomSrc(imageSrc)}
                            >
                              <ZoomIn className="h-3.5 w-3.5" />
                              Zoom
                            </Button>
                          )}
                          {patientMobile && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs gap-1 text-green-600 border-green-300 hover:bg-green-50"
                              onClick={handleWhatsApp}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* WhatsApp for typed prescriptions */}
                    {isTyped && patientMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-8 text-xs gap-1 text-green-600 border-green-300 hover:bg-green-50"
                        onClick={handleWhatsApp}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
