import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { SiInstagram, SiWhatsapp } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LeadCard from '../components/LeadCard';
import LeadDialog from '../components/LeadDialog';
import { useGetLeads } from '../hooks/useQueries';
import type { Lead } from '../hooks/useQueries';

export default function LeadsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: leads = [], isLoading } = useGetLeads();

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLead(undefined);
  };

  const handleOpenInstagram = () => {
    // Try to open Instagram app on mobile, fallback to web
    const instagramUrl = 'instagram://';
    const instagramWebUrl = 'https://www.instagram.com';
    
    // Create a temporary link to test if app opens
    const link = document.createElement('a');
    link.href = instagramUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Try to open the app
    link.click();
    
    // Fallback to web after a short delay if app doesn't open
    setTimeout(() => {
      window.open(instagramWebUrl, '_blank');
    }, 500);
    
    document.body.removeChild(link);
  };

  const handleOpenWhatsApp = () => {
    // Try to open WhatsApp app, fallback to web
    const whatsappUrl = 'whatsapp://';
    const whatsappWebUrl = 'https://wa.me';
    
    // Create a temporary link to test if app opens
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Try to open the app
    link.click();
    
    // Fallback to web after a short delay if app doesn't open
    setTimeout(() => {
      window.open(whatsappWebUrl, '_blank');
    }, 500);
    
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    return (
      lead.leadName.toLowerCase().includes(query) ||
      lead.mobile.includes(query) ||
      lead.treatmentWanted.toLowerCase().includes(query) ||
      lead.area.toLowerCase().includes(query)
    );
  });

  // Sort leads by follow-up date
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    return Number(a.followUpDate - b.followUpDate);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleOpenInstagram} 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <SiInstagram className="h-4 w-4" />
            <span className="hidden sm:inline">Instagram</span>
          </Button>
          <Button 
            onClick={handleOpenWhatsApp} 
            size="sm" 
            variant="outline"
            className="gap-2"
          >
            <SiWhatsapp className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading leads...</p>
        </div>
      ) : sortedLeads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{searchQuery ? 'No leads found matching your search' : 'No leads yet. Add your first lead!'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedLeads.map((lead) => (
            <LeadCard key={lead.mobile} lead={lead} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <LeadDialog open={isDialogOpen} onOpenChange={handleCloseDialog} lead={editingLead} />
    </div>
  );
}
