import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Camera,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Search,
  X,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";
import type { Prescription } from "../backend";
import { useGetPatients, usePrescriptions } from "../hooks/useQueries";
import type { PatientView } from "../hooks/useQueries";
import { formatDateTime12Hour } from "../utils/dateUtils";
import { sendPrescriptionViaWhatsApp } from "../utils/whatsappPrescription";

function FullScreenImage({
  src,
  onClose,
}: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-white text-black rounded-full p-2 shadow-lg border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="Close"
        style={{ minWidth: 44, minHeight: 44 }}
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

function PatientPrescriptions({
  patient,
  onBack,
}: {
  patient: PatientView;
  onBack: () => void;
}) {
  const { data: prescriptions = [], isLoading } = usePrescriptions(
    patient.mobile,
  );
  const [fullScreenSrc, setFullScreenSrc] = useState<string | null>(null);

  const sorted = [...prescriptions].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  return (
    <div>
      {fullScreenSrc && (
        <FullScreenImage
          src={fullScreenSrc}
          onClose={() => setFullScreenSrc(null)}
        />
      )}

      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <p className="font-semibold text-base">{patient.name}</p>
          <p className="text-xs text-muted-foreground">+91 {patient.mobile}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-40" />
          <p>No prescription history found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((rx) => (
            <PrescriptionCard
              key={rx.timestamp.toString()}
              prescription={rx}
              patientMobile={patient.mobile}
              onImageClick={(src) => setFullScreenSrc(src)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionCard({
  prescription,
  patientMobile,
  onImageClick,
}: {
  prescription: Prescription;
  patientMobile: string;
  onImageClick: (src: string) => void;
}) {
  const kind = prescription.prescriptionData.__kind__;
  const isTyped = kind === "typed";
  const isFreehand = kind === "freehand";
  const isCamera = kind === "camera";

  const getImageSrc = () => {
    if (isFreehand && prescription.prescriptionData.__kind__ === "freehand") {
      return prescription.prescriptionData.freehand.getDirectURL();
    }
    if (isCamera && prescription.prescriptionData.__kind__ === "camera") {
      return prescription.prescriptionData.camera.getDirectURL();
    }
    return null;
  };

  const imageSrc = getImageSrc();

  const handleWhatsApp = async () => {
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
    <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {isTyped && <FileText className="h-4 w-4 text-primary" />}
        {isFreehand && <ImageIcon className="h-4 w-4 text-blue-500" />}
        {isCamera && <Camera className="h-4 w-4 text-green-500" />}
        <span className="text-xs font-medium">
          {isTyped && "Typed Prescription"}
          {isFreehand && "Freehand Prescription"}
          {isCamera && "Camera Prescription"}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {formatDateTime12Hour(
            new Date(Number(prescription.timestamp) / 1_000_000),
          )}
        </span>
      </div>

      {isTyped && prescription.prescriptionData.__kind__ === "typed" && (
        <p className="text-sm text-foreground whitespace-pre-wrap">
          {prescription.prescriptionData.typed}
        </p>
      )}

      {imageSrc && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => onImageClick(imageSrc)}
            className="w-full focus:outline-none"
          >
            <img
              src={imageSrc}
              alt="Prescription"
              className="w-full rounded-lg border object-contain max-h-52 hover:opacity-90 transition-opacity"
            />
          </button>
          {/* Action buttons row */}
          <div className="flex gap-2 mt-2">
            {isCamera && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs gap-1"
                onClick={() => onImageClick(imageSrc)}
              >
                <ZoomIn className="h-3.5 w-3.5" />
                Zoom
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs gap-1 text-green-600 border-green-300 hover:bg-green-50"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* WhatsApp for typed */}
      {isTyped && (
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
  );
}

export default function HistoryTab() {
  const { data: patients = [], isLoading } = useGetPatients();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PatientView | null>(null);

  if (selected) {
    return (
      <PatientPrescriptions
        patient={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  const query = search.trim().toLowerCase();
  const filtered = query
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.mobile.replace(/\s/g, "").includes(query.replace(/\D/g, "")),
      )
    : patients;

  return (
    <div>
      <div className="sticky top-0 bg-background z-10 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or mobile no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{query ? "No patients found" : "No patients yet"}</p>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {filtered.map((p) => (
            <button
              type="button"
              key={p.mobile}
              onClick={() => setSelected(p)}
              className="w-full text-left bg-card border border-border rounded-xl px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground">+91 {p.mobile}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
