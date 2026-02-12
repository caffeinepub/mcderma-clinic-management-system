import { useState, useEffect } from 'react';
import { Edit2, Download, LogOut, RefreshCw, FileJson, FileSpreadsheet, Network, Smartphone } from 'lucide-react';
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
import { formatDateTime12Hour, formatDateTimestamp12Hour, formatTimestampDDMMYY } from '@/lib/utils';
import { computeLeadAnalytics } from '../utils/leadAnalysis';

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
            appointmentTime: formatDateTimestamp12Hour(a.appointmentTime),
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
            followUpDate: formatTimestampDDMMYY(l.followUpDate),
            expectedTreatmentDate: formatTimestampDDMMYY(l.expectedTreatmentDate),
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

  // Compute lead analytics
  const leadAnalytics = computeLeadAnalytics(leads, appointments);
  const maxValue = Math.max(...leadAnalytics.map(a => Math.max(a.generated, a.converted)), 1);

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
            <RefreshCw className={`mr-2 h-4 w-4 ${displaySyncStatus ? 'animate-spin' : ''}`} />
            {displaySyncStatus ? 'Syncing...' : 'Sync Now'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Analysis</CardTitle>
          <CardDescription>Track lead generation and conversion by treatment type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {leadAnalytics.map((analytics) => (
            <div key={analytics.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{analytics.category}</h4>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Generated: {analytics.generated}</span>
                  <span>Converted: {analytics.converted}</span>
                </div>
              </div>
              
              <div className="flex gap-2 h-12">
                {/* Generated bar */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-xs text-center mb-1 text-muted-foreground">Generated</div>
                  <div 
                    className="bg-primary/30 rounded-t transition-all duration-300"
                    style={{ height: `${(analytics.generated / maxValue) * 100}%`, minHeight: analytics.generated > 0 ? '8px' : '0' }}
                  >
                    <div className="text-xs text-center font-semibold pt-1">
                      {analytics.generated > 0 ? analytics.generated : ''}
                    </div>
                  </div>
                </div>
                
                {/* Converted bar */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="text-xs text-center mb-1 text-muted-foreground">Converted</div>
                  <div 
                    className="bg-primary rounded-t transition-all duration-300"
                    style={{ height: `${(analytics.converted / maxValue) * 100}%`, minHeight: analytics.converted > 0 ? '8px' : '0' }}
                  >
                    <div className="text-xs text-center font-semibold text-primary-foreground pt-1">
                      {analytics.converted > 0 ? analytics.converted : ''}
                    </div>
                  </div>
                </div>
              </div>
              
              {analytics.generated > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  Conversion Rate: {Math.round((analytics.converted / analytics.generated) * 100)}%
                </div>
              )}
            </div>
          ))}
          
          {leadAnalytics.every(a => a.generated === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No lead data available yet</p>
              <p className="text-xs mt-1">Add leads to see conversion analytics</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>Overview of your clinic data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{appointments.length}</p>
              <p className="text-xs text-muted-foreground">Appointments</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{patients.length}</p>
              <p className="text-xs text-muted-foreground">Patients</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{leads.length}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progressive Web App</CardTitle>
          <CardDescription>Install the app for offline access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showInstallButton && (
            <Button onClick={handleInstall} className="w-full">
              <Smartphone className="mr-2 h-4 w-4" />
              Install App
            </Button>
          )}
          
          <Button onClick={handleShare} variant="outline" className="w-full">
            Share App
          </Button>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
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
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your clinic data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
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
          </div>

          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground pb-4">
        <p>© {new Date().getFullYear()} McDerma Clinic Management</p>
        <p className="mt-1">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
