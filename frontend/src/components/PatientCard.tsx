import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Edit, Trash2, FileText, CalendarPlus } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PatientView } from '../hooks/useQueries';
import PatientDialog from './PatientDialog';
import PatientPrescriptionHistoryDialog from './PatientPrescriptionHistoryDialog';
import AppointmentDialog from './AppointmentDialog';
import { useDeletePatient } from '../hooks/useQueries';
import { toast } from 'sonner';
import { normalizePhone } from '../utils/phone';

interface PatientCardProps {
  patient: PatientView;
}

export default function PatientCard({ patient }: PatientCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const deletePatient = useDeletePatient();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${patient.name}?`)) {
      try {
        await deletePatient.mutateAsync(patient.mobile);
        toast.success('Patient deleted successfully');
      } catch (error: any) {
        toast.error('Failed to delete patient', {
          description: error.message || 'Please try again',
        });
      }
    }
  };

  const handleCall = () => {
    const normalizedMobile = normalizePhone(patient.mobile);
    window.location.href = `tel:${normalizedMobile}`;
  };

  const handleWhatsApp = () => {
    const normalizedMobile = normalizePhone(patient.mobile);
    const whatsappUrl = `https://wa.me/${normalizedMobile}`;
    window.open(whatsappUrl, '_blank');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-blue-500',
  ];

  const colorIndex = patient.name.charCodeAt(0) % avatarColors.length;

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {patient.image ? (
              <img
                src={patient.image.getDirectURL()}
                alt={patient.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColors[colorIndex]} flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0`}
              >
                {getInitials(patient.name)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-foreground mb-1 truncate">
                {patient.name}
              </h3>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{patient.mobile}</span>
                </div>

                {patient.area && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{patient.area}</span>
                  </div>
                )}
              </div>

              {patient.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {patient.notes}
                </p>
              )}

              <TooltipProvider>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleCall}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                        aria-label="Call patient"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Call</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleWhatsApp}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-colors"
                        aria-label="Send WhatsApp message"
                      >
                        <SiWhatsapp className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>WhatsApp</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowHistoryDialog(true)}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                        aria-label="View prescription history"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>History</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowEditDialog(true)}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                        aria-label="Edit patient"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleDelete}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
                        disabled={deletePatient.isPending}
                        aria-label="Delete patient"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setShowAppointmentDialog(true)}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-colors"
                        aria-label="Add to appointment"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to Appointment</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {showEditDialog && (
        <PatientDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          prefilledData={patient}
        />
      )}

      {showHistoryDialog && (
        <PatientPrescriptionHistoryDialog
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          patientName={patient.name}
          patientMobile={patient.mobile}
        />
      )}

      {showAppointmentDialog && (
        <AppointmentDialog
          open={showAppointmentDialog}
          onOpenChange={setShowAppointmentDialog}
          prefilledData={{
            patientName: patient.name,
            mobile: patient.mobile,
          }}
        />
      )}
    </>
  );
}
