import { Phone, MessageCircle, Edit, Trash2, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Lead } from '../backend';
import { format, isPast } from 'date-fns';
import { useDeleteLead, useUpdateLeadStatus } from '../hooks/useQueries';
import { toast } from 'sonner';
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

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
}

export default function LeadCard({ lead, onEdit }: LeadCardProps) {
  const deleteLead = useDeleteLead();
  const updateLeadStatus = useUpdateLeadStatus();

  const handleCall = () => {
    window.location.href = `tel:${lead.mobile}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello ${lead.leadName}, this is a follow-up regarding ${lead.treatmentWanted}. ${lead.doctorRemark ? `Note: ${lead.doctorRemark}` : ''}`
    );
    window.open(`https://wa.me/${lead.mobile}?text=${message}`, '_blank');
  };

  const handleDelete = async () => {
    try {
      await deleteLead.mutateAsync(lead.mobile);
      toast.success('Lead deleted successfully');
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLeadStatus.mutateAsync({
        mobile: lead.mobile,
        leadStatus: newStatus,
      });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const followUpDate = new Date(Number(lead.followUpDate) / 1000000);
  const expectedDate = new Date(Number(lead.expectedTreatmentDate) / 1000000);
  const isOverdue = isPast(followUpDate) && followUpDate.toDateString() !== new Date().toDateString();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-0.5 truncate leading-tight">{lead.leadName}</h3>
            <button 
              onClick={handleCall}
              className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            >
              <Phone className="h-2.5 w-2.5" />
              <span className="underline">{lead.mobile}</span>
            </button>
            {lead.area && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">📍 {lead.area}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold">{lead.rating}/7</span>
            </div>
            <Select 
              value={lead.leadStatus || 'Ringing'} 
              onValueChange={handleStatusChange}
              disabled={updateLeadStatus.isPending}
            >
              <SelectTrigger className="h-6 text-xs w-[110px] px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ringing">Ringing</SelectItem>
                <SelectItem value="will call and come">will call and come</SelectItem>
                <SelectItem value="follow up date given">follow up date given</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-1.5 space-y-0.5">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">Treatment:</span>
            <Badge variant="secondary" className="text-xs h-4 px-1.5">{lead.treatmentWanted}</Badge>
          </div>
          
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-muted-foreground">Follow-up:</span>
            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
              {format(followUpDate, 'MMM dd, yyyy')}
            </span>
            {isOverdue && <Badge variant="destructive" className="text-xs h-4 px-1">Overdue</Badge>}
          </div>

          <div className="flex items-center gap-1 text-xs">
            <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-muted-foreground">Expected:</span>
            <span>{format(expectedDate, 'MMM dd, yyyy')}</span>
          </div>

          {lead.doctorRemark && (
            <div className="text-xs bg-muted/50 rounded-md p-1.5 mt-1">
              <p className="text-muted-foreground text-xs mb-0.5">Remark:</p>
              <p className="text-xs line-clamp-2">{lead.doctorRemark}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-1.5">
          <Button size="sm" variant="outline" onClick={handleCall} className="h-6 text-xs px-2 py-0">
            <Phone className="h-2.5 w-2.5 mr-1" />
            Call
          </Button>
          <Button size="sm" variant="outline" onClick={handleWhatsApp} className="h-6 text-xs px-2 py-0">
            <MessageCircle className="h-2.5 w-2.5 mr-1" />
            WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(lead)} className="h-6 text-xs px-2 py-0">
            <Edit className="h-2.5 w-2.5 mr-1" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-6 text-xs px-2 py-0 text-destructive hover:text-destructive">
                <Trash2 className="h-2.5 w-2.5 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this lead? This action cannot be undone.
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
  );
}
