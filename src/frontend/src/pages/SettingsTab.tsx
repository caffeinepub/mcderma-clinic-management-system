import { useState } from 'react';
import { Download, RefreshCw, Package, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetAppointments, useGetPatients, useGetLeads } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { formatDateDDMMYY } from '../lib/utils';
import { computeLeadAnalytics } from '../utils/leadAnalysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AttendanceSection from '../components/settings/AttendanceSection';
import WhatsAppTemplatesEditor from '../components/settings/WhatsAppTemplatesEditor';
import AdminGateDialog from '../components/admin/AdminGateDialog';
import PermissionsMatrix from '../components/admin/PermissionsMatrix';
import { exportAttendanceData } from '../utils/attendanceExport';
import { useGetAllAttendance } from '../hooks/useQueries';

export default function SettingsTab() {
  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const queryClient = useQueryClient();
  const { data: appointments = [] } = useGetAppointments();
  const { data: patients = [] } = useGetPatients();
  const { data: leads = [] } = useGetLeads();
  const { data: allAttendance = [] } = useGetAllAttendance();

  const [username, setUsername] = useState(userProfile?.username || '');
  const [clinicName, setClinicName] = useState(userProfile?.clinicName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAdminGate, setShowAdminGate] = useState(false);

  const handleSaveProfile = async () => {
    if (!username.trim() || !clinicName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile.mutateAsync({ username, clinicName });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    toast.info('Syncing data...');
    await queryClient.invalidateQueries();
    toast.success('Data synced successfully');
  };

  const handleExportData = (format: 'json' | 'csv', dataType: 'all' | 'appointments' | 'patients' | 'leads' | 'attendance') => {
    try {
      let data: any;
      let filename: string;

      if (dataType === 'attendance') {
        const exportData = exportAttendanceData(allAttendance);
        data = exportData;
        filename = `attendance-export-${new Date().toISOString().split('T')[0]}`;
      } else if (dataType === 'all') {
        data = { appointments, patients, leads };
        filename = `clinic-data-${new Date().toISOString().split('T')[0]}`;
      } else if (dataType === 'appointments') {
        data = appointments;
        filename = `appointments-${new Date().toISOString().split('T')[0]}`;
      } else if (dataType === 'patients') {
        data = patients;
        filename = `patients-${new Date().toISOString().split('T')[0]}`;
      } else {
        data = leads;
        filename = `leads-${new Date().toISOString().split('T')[0]}`;
      }

      if (format === 'json') {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export
        let csvContent = '';
        
        if (dataType === 'attendance') {
          // Attendance CSV format
          csvContent = convertAttendanceToCSV(data);
        } else if (dataType === 'appointments' || dataType === 'all') {
          const appointmentsData = dataType === 'all' ? data.appointments : data;
          csvContent = 'Patient Name,Mobile,Date,Time,Notes,Follow Up\n';
          appointmentsData.forEach((apt: any) => {
            const aptDate = new Date(Number(apt.appointmentTime) / 1000000);
            const date = formatDateDDMMYY(aptDate);
            const time = aptDate.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            csvContent += `"${apt.patientName}","${apt.mobile}","${date}","${time}","${apt.notes}","${apt.isFollowUp ? 'Yes' : 'No'}"\n`;
          });
        } else if (dataType === 'patients') {
          csvContent = 'Name,Mobile,Area,Notes\n';
          patients.forEach((patient: any) => {
            csvContent += `"${patient.name}","${patient.mobile}","${patient.area}","${patient.notes}"\n`;
          });
        } else if (dataType === 'leads') {
          csvContent = 'Lead Name,Mobile,Treatment,Area,Follow Up Date,Rating,Status\n';
          leads.forEach((lead: any) => {
            const followUpDateObj = new Date(Number(lead.followUpDate) / 1000000);
            const followUpDate = formatDateDDMMYY(followUpDateObj);
            csvContent += `"${lead.leadName}","${lead.mobile}","${lead.treatmentWanted}","${lead.area}","${followUpDate}",${lead.rating},"${lead.leadStatus}"\n`;
          });
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`${dataType === 'all' ? 'All data' : dataType.charAt(0).toUpperCase() + dataType.slice(1)} exported successfully`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const convertAttendanceToCSV = (data: any): string => {
    let csv = '';
    
    // Header
    csv += 'Staff Name,';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    months.forEach(month => {
      csv += `${month} - Absent Dates,${month} - Present Days,${month} - Absent Days,`;
    });
    csv += '\n';

    // Data rows
    Object.entries(data).forEach(([staffName, yearData]: [string, any]) => {
      csv += `"${staffName}",`;
      months.forEach((_, monthIndex) => {
        const monthData = yearData.months[monthIndex];
        if (monthData) {
          const absentDates = monthData.absentDates.join('; ');
          csv += `"${absentDates}",${monthData.presentDays},${monthData.absentDays},`;
        } else {
          csv += '"",0,0,';
        }
      });
      csv += '\n';
    });

    return csv;
  };

  const handleOpenAdmin = () => {
    setShowAdminGate(true);
  };

  const handleAdminUnlocked = () => {
    setAdminUnlocked(true);
    setShowAdminGate(false);
  };

  // Lead Analysis Data
  const leadAnalysisData = computeLeadAnalytics(leads, appointments);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your profile and application settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal and clinic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name</Label>
                <Input
                  id="clinicName"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Enter your clinic name"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
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
                  <div className="text-2xl font-bold text-primary">{appointments.length}</div>
                  <div className="text-sm text-muted-foreground">Appointments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{patients.length}</div>
                  <div className="text-sm text-muted-foreground">Patients</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{leads.length}</div>
                  <div className="text-sm text-muted-foreground">Leads</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Analysis</CardTitle>
              <CardDescription>Conversion rates by treatment type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="generated" fill="hsl(var(--primary))" name="Generated" />
                  <Bar dataKey="converted" fill="hsl(var(--chart-2))" name="Converted" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceSection />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          <WhatsAppTemplatesEditor />
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          {!adminUnlocked ? (
            <Card>
              <CardHeader>
                <CardTitle>Admin Section</CardTitle>
                <CardDescription>Manage staff permissions and access control</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleOpenAdmin}>
                  Unlock Admin Section
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PermissionsMatrix />
          )}
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Sync and export your clinic data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Manual Sync</h3>
                <Button onClick={handleManualSync} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync Now
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-3">Export Data</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => handleExportData('json', 'all')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    All Data (JSON)
                  </Button>
                  <Button onClick={() => handleExportData('csv', 'appointments')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Appointments (CSV)
                  </Button>
                  <Button onClick={() => handleExportData('csv', 'patients')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Patients (CSV)
                  </Button>
                  <Button onClick={() => handleExportData('csv', 'leads')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Leads (CSV)
                  </Button>
                  <Button onClick={() => handleExportData('json', 'attendance')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Attendance (JSON)
                  </Button>
                  <Button onClick={() => handleExportData('csv', 'attendance')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Attendance (CSV)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                PWA Features
              </CardTitle>
              <CardDescription>Install this app on your device for offline access</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This application can be installed on your device. Look for the "Add to Home Screen" or "Install" option in your browser menu.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Deployment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <span className="font-mono">{import.meta.env.MODE}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-center text-sm text-muted-foreground py-8 border-t">
        <p>
          © {new Date().getFullYear()} Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <AdminGateDialog
        open={showAdminGate}
        onOpenChange={setShowAdminGate}
        onUnlocked={handleAdminUnlocked}
      />
    </div>
  );
}
