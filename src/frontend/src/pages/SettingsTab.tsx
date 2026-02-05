import { useState, useEffect } from 'react';
import { Edit2, Download, LogOut, RefreshCw, FileJson, FileSpreadsheet, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetAppointments, useGetPatients, useGetLeads, useUpdateLastSyncTime } from '../hooks/useQueries';
import { useLastSync } from '../hooks/useLastSync';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatDateTime12Hour } from '@/lib/utils';

export default function SettingsTab() {
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { mutate: saveProfile } = useSaveCallerUserProfile();
  const { data: appointments = [] } = useGetAppointments();
  const { data: patients = [] } = useGetPatients();
  const { data: leads = [] } = useGetLeads();
  const { formattedLastSync, lastSyncTime } = useLastSync();
  const isSyncing = useSyncStatus();
  const { mutateAsync: updateSyncTime } = useUpdateLastSyncTime();
  const queryClient = useQueryClient();

  const [clinicName, setClinicName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    if (userProfile?.clinicName) {
      setClinicName(userProfile.clinicName);
    }
  }, [userProfile]);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleSaveClinicName = () => {
    if (!userProfile) return;

    saveProfile(
      { ...userProfile, clinicName },
      {
        onSuccess: () => {
          toast.success('Clinic name updated successfully');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('Failed to update clinic name');
        },
      }
    );
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      // Invalidate and refetch all data queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['todaysAppointments'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['patients'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['leads'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'], refetchType: 'active' }),
      ]);

      // Update backend sync time
      await updateSyncTime();
      
      toast.success('Data synced successfully');
    } catch (error) {
      toast.error('Failed to sync data');
      console.error('Sync error:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    toast.success('Logged out successfully');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'McDerma Clinic Management',
      text: 'Check out this clinic management system!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('App installed successfully');
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  const convertToCSV = (data: any[], headers: string[]): string => {
    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const escaped = ('' + value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  const sanitizeFilename = (name: string): string => {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'mcderma';
  };

  const formatDateFromBigInt = (timestamp: bigint): string => {
    try {
      // Convert nanoseconds to milliseconds
      const milliseconds = Number(timestamp) / 1_000_000;
      return new Date(milliseconds).toISOString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString();
    }
  };

  const formatDateStringFromBigInt = (timestamp: bigint): string => {
    try {
      // Convert nanoseconds to milliseconds and format in 12-hour AM/PM format
      const milliseconds = Number(timestamp) / 1_000_000;
      const date = new Date(milliseconds);
      return formatDateTime12Hour(date);
    } catch (error) {
      console.error('Error formatting date string:', error);
      return formatDateTime12Hour(new Date());
    }
  };

  const formatDateOnlyFromBigInt = (timestamp: bigint): string => {
    try {
      // Convert nanoseconds to milliseconds
      const milliseconds = Number(timestamp) / 1_000_000;
      return new Date(milliseconds).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toLocaleDateString();
    }
  };

  const handleExport = () => {
    try {
      const currentDate = new Date();
      const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      const baseFilename = sanitizeFilename(userProfile?.clinicName || 'McDerma');
      
      if (exportFormat === 'json') {
        const data = {
          clinicName: userProfile?.clinicName || 'McDerma',
          exportDate: currentDate.toISOString(),
          appointments: appointments.map(a => ({
            patientName: a.patientName,
            mobile: a.mobile,
            appointmentTime: formatDateFromBigInt(a.appointmentTime),
            notes: a.notes,
          })),
          patients: patients.map(p => ({
            name: p.name,
            mobile: p.mobile,
            area: p.area,
            notes: p.notes,
            hasImage: !!p.image,
          })),
          leads: leads.map(l => ({
            leadName: l.leadName,
            mobile: l.mobile,
            treatmentWanted: l.treatmentWanted,
            area: l.area,
            followUpDate: formatDateFromBigInt(l.followUpDate),
            expectedTreatmentDate: formatDateFromBigInt(l.expectedTreatmentDate),
            rating: l.rating,
            doctorRemark: l.doctorRemark,
          })),
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseFilename}-${dateString}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Data exported successfully as JSON');
      } else {
        // CSV Export - create separate files for each data type
        const appointmentsCSV = convertToCSV(
          appointments.map(a => ({
            patientName: a.patientName,
            mobile: a.mobile,
            appointmentTime: formatDateStringFromBigInt(a.appointmentTime),
            notes: a.notes,
          })),
          ['patientName', 'mobile', 'appointmentTime', 'notes']
        );

        const patientsCSV = convertToCSV(
          patients.map(p => ({
            name: p.name,
            mobile: p.mobile,
            area: p.area,
            notes: p.notes,
          })),
          ['name', 'mobile', 'area', 'notes']
        );

        const leadsCSV = convertToCSV(
          leads.map(l => ({
            leadName: l.leadName,
            mobile: l.mobile,
            treatmentWanted: l.treatmentWanted,
            area: l.area,
            followUpDate: formatDateOnlyFromBigInt(l.followUpDate),
            expectedTreatmentDate: formatDateOnlyFromBigInt(l.expectedTreatmentDate),
            rating: l.rating,
            doctorRemark: l.doctorRemark,
          })),
          ['leadName', 'mobile', 'treatmentWanted', 'area', 'followUpDate', 'expectedTreatmentDate', 'rating', 'doctorRemark']
        );

        // Download appointments CSV
        const appointmentsBlob = new Blob([appointmentsCSV], { type: 'text/csv;charset=utf-8;' });
        const appointmentsUrl = URL.createObjectURL(appointmentsBlob);
        const appointmentsLink = document.createElement('a');
        appointmentsLink.href = appointmentsUrl;
        appointmentsLink.download = `${baseFilename}-appointments-${dateString}.csv`;
        document.body.appendChild(appointmentsLink);
        appointmentsLink.click();
        document.body.removeChild(appointmentsLink);
        URL.revokeObjectURL(appointmentsUrl);

        // Download patients CSV
        const patientsBlob = new Blob([patientsCSV], { type: 'text/csv;charset=utf-8;' });
        const patientsUrl = URL.createObjectURL(patientsBlob);
        const patientsLink = document.createElement('a');
        patientsLink.href = patientsUrl;
        patientsLink.download = `${baseFilename}-patients-${dateString}.csv`;
        document.body.appendChild(patientsLink);
        patientsLink.click();
        document.body.removeChild(patientsLink);
        URL.revokeObjectURL(patientsUrl);

        // Download leads CSV
        const leadsBlob = new Blob([leadsCSV], { type: 'text/csv;charset=utf-8;' });
        const leadsUrl = URL.createObjectURL(leadsBlob);
        const leadsLink = document.createElement('a');
        leadsLink.href = leadsUrl;
        leadsLink.download = `${baseFilename}-leads-${dateString}.csv`;
        document.body.appendChild(leadsLink);
        leadsLink.click();
        document.body.removeChild(leadsLink);
        URL.revokeObjectURL(leadsUrl);

        toast.success('Data exported successfully as CSV files');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  const displaySyncStatus = isSyncing || isManualSyncing;
  const isMainnet = window.location.hostname.includes('.ic0.app') || window.location.hostname.includes('.icp0.io');
  const networkLabel = isMainnet ? 'Mainnet' : 'Local';

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your clinic settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clinic Information</CardTitle>
          <CardDescription>Update your clinic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={userProfile?.username || ''} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic Name</Label>
            <div className="flex gap-2">
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter clinic name"
              />
              {!isEditing ? (
                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSaveClinicName}>Save</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization</CardTitle>
          <CardDescription>Automatic sync with manual refresh option</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className={`h-5 w-5 text-primary ${displaySyncStatus ? 'animate-spin' : ''}`} />
              <div>
                <p className="text-sm font-medium">
                  {displaySyncStatus ? 'Syncing...' : 'Last Synced'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSyncTime ? formatDateTime12Hour(lastSyncTime) : 'Never'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{formattedLastSync}</p>
            </div>
          </div>
          
          <Button 
            onClick={handleManualSync} 
            disabled={displaySyncStatus}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${displaySyncStatus ? 'animate-spin' : ''}`} />
            {displaySyncStatus ? 'Syncing...' : 'Sync Now'}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Data syncs automatically every 15 minutes and when you return to the app. Click "Sync Now" for an immediate refresh.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>Overview of your clinic data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{appointments.length}</p>
              <p className="text-xs text-muted-foreground">Appointments</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{patients.length}</p>
              <p className="text-xs text-muted-foreground">Patients</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{leads.length}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployment Info</CardTitle>
          <CardDescription>Current network and build information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Network className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Network</p>
              <p className="text-xs text-muted-foreground">{networkLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Actions</CardTitle>
          <CardDescription>Share, install, and manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
            <img 
              src="/assets/generated/share-icon-transparent.dim_24x24.png" 
              alt="Share" 
              className="h-4 w-4 mr-2"
            />
            Share App
          </Button>

          {showInstallButton && (
            <Button variant="outline" className="w-full justify-start" onClick={handleInstall}>
              <img 
                src="/assets/generated/add-to-home-icon-transparent.dim_24x24.png" 
                alt="Add to Home Screen" 
                className="h-4 w-4 mr-2"
              />
              Add to Home Screen
            </Button>
          )}

          <Separator className="my-2" />

          <div className="space-y-3">
            <Label htmlFor="exportFormat">Export Format</Label>
            <Select value={exportFormat} onValueChange={(value: 'json' | 'csv') => setExportFormat(value)}>
              <SelectTrigger id="exportFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    <span>JSON (Single File)</span>
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>CSV (Multiple Files)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data as {exportFormat.toUpperCase()}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              {exportFormat === 'json' 
                ? 'Exports all data in a single JSON file with complete structure.'
                : 'Exports data as separate CSV files for appointments, patients, and leads.'}
            </p>
          </div>

          <Separator />

          <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground py-4">
        <p>© 2026. Built with ❤️ using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">caffeine.ai</a></p>
      </div>
    </div>
  );
}
