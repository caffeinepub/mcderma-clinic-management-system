import React from 'react';
import { Prescription } from '../../hooks/useQueries';
import { FileText, Camera, PenLine } from 'lucide-react';

interface PrescriptionHistoryListProps {
  prescriptions: Prescription[];
}

function formatTimestamp(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) : ts;
  const d = new Date(ms);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPrescriptionTypeLabel(type: Prescription['prescriptionType']): string {
  if ('typed' in type) return 'Typed';
  if ('freehand' in type) return 'Freehand';
  if ('camera' in type) return 'Camera';
  return 'Unknown';
}

function getPrescriptionTypeIcon(type: Prescription['prescriptionType']) {
  if ('typed' in type) return <FileText size={14} />;
  if ('freehand' in type) return <PenLine size={14} />;
  if ('camera' in type) return <Camera size={14} />;
  return <FileText size={14} />;
}

export default function PrescriptionHistoryList({
  prescriptions,
}: PrescriptionHistoryListProps) {
  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <FileText size={32} className="mb-2 opacity-40" />
        <p className="text-sm">No prescription history</p>
      </div>
    );
  }

  const sorted = [...prescriptions].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  return (
    <div className="space-y-3">
      {sorted.map((rx, idx) => {
        const typeLabel = getPrescriptionTypeLabel(rx.prescriptionType);
        const typeIcon = getPrescriptionTypeIcon(rx.prescriptionType);

        return (
          <div
            key={idx}
            className="bg-muted/40 rounded-xl p-3 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {typeIcon}
                <span className="font-medium">{typeLabel}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(rx.timestamp)}
              </span>
            </div>

            {'typed' in rx.prescriptionData && (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {rx.prescriptionData.typed}
              </p>
            )}

            {'freehand' in rx.prescriptionData && (
              <div className="mt-1">
                <img
                  src={rx.prescriptionData.freehand?.getDirectURL?.() ?? ''}
                  alt="Freehand prescription"
                  className="max-w-full rounded-lg border border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {'camera' in rx.prescriptionData && (
              <div className="mt-1">
                <img
                  src={rx.prescriptionData.camera?.getDirectURL?.() ?? ''}
                  alt="Camera prescription"
                  className="max-w-full rounded-lg border border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {rx.doctorNotes && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note: {rx.doctorNotes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
