import { Phone, MessageCircle, Edit, Trash2, FileText, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Patient } from '../backend';
import { useDeletePatient } from '../hooks/useQueries';
import { toast } from 'sonner';
import AppointmentDialog from './AppointmentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PatientCardProps {
  patient: Patient;
  onEdit: (patient: Patient) => void;
}

export default function PatientCard({ patient, onEdit }: PatientCardProps) {
  const deletePatient = useDeletePatient();
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${patient.mobile}`;
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${patient.mobile}`, '_blank');
  };

  const handleDelete = async () => {
    try {
      await deletePatient.mutateAsync(patient.mobile);
      toast.success('Patient deleted successfully');
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const imageUrl = patient.image ? patient.image.getDirectURL() : '/assets/generated/default-patient-avatar.dim_100x100.png';

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-5 mb-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 ring-2 ring-primary/10 shadow-md">
              <AvatarImage src={imageUrl} alt={patient.name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-lg sm:text-xl font-bold">
                {getInitials(patient.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-2 pt-1">
              <h3 className="font-bold text-xl sm:text-2xl leading-tight text-foreground tracking-tight">{patient.name}</h3>
              
              <button 
                onClick={handleCall}
                className="text-sm sm:text-base text-muted-foreground flex items-center gap-2 hover:text-primary transition-colors cursor-pointer group w-fit"
              >
                <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">{patient.mobile}</span>
              </button>
              
              {patient.area && (
                <p className="text-sm sm:text-base text-muted-foreground flex items-start gap-2 leading-relaxed">
                  <span className="text-base">📍</span>
                  <span className="pt-0.5 font-medium">{patient.area}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleCall} className="h-9 text-sm font-medium shadow-sm hover:shadow">
              <Phone className="h-4 w-4 mr-1.5" />
              Call
            </Button>
            <Button size="sm" variant="outline" onClick={handleWhatsApp} className="h-9 text-sm font-medium shadow-sm hover:shadow">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              WhatsApp
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 text-sm font-medium shadow-sm hover:shadow">
                  <FileText className="h-4 w-4 mr-1.5" />
                  History
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{patient.name} - Treatment History</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm whitespace-pre-wrap">{patient.notes || 'No treatment history recorded.'}</p>
                </div>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={() => onEdit(patient)} className="h-9 text-sm font-medium shadow-sm hover:shadow">
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsAppointmentDialogOpen(true)} 
              className="h-9 text-sm font-semibold text-primary hover:text-primary border-primary/50 hover:bg-primary/10 shadow-sm hover:shadow"
            >
              <CalendarPlus className="h-4 w-4 mr-1.5" />
              Add to Appointment
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 text-sm font-medium text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10 shadow-sm hover:shadow">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this patient record? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={setIsAppointmentDialogOpen}
        prefilledData={{
          patientName: patient.name,
          mobile: patient.mobile,
        }}
      />
    </>
  );
}
