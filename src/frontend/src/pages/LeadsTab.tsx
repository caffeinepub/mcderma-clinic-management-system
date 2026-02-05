import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeadCard from '../components/LeadCard';
import LeadDialog from '../components/LeadDialog';
import { useGetLeads } from '../hooks/useQueries';
import type { Lead } from '../backend';

export default function LeadsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);

  const { data: leads = [], isLoading } = useGetLeads();

  // Sort leads by follow-up date (nearest first)
  const sortedLeads = [...leads].sort((a, b) => {
    const dateA = Number(a.followUpDate);
    const dateB = Number(b.followUpDate);
    return dateA - dateB;
  });

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLead(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Leads</h2>
        <div className="text-sm text-muted-foreground">
          {leads.length} {leads.length === 1 ? 'lead' : 'leads'}
        </div>
      </div>

      {/* Lead List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading leads...</p>
        </div>
      ) : sortedLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No leads added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedLeads.map((lead, index) => (
            <LeadCard
              key={index}
              lead={lead}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <Button
        onClick={() => setIsDialogOpen(true)}
        size="lg"
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add/Edit Lead Dialog */}
      <LeadDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        lead={editingLead}
      />
    </div>
  );
}
