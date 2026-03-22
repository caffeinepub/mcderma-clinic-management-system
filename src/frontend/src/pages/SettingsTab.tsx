import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Download,
  FileText,
  MessageSquare,
  Share2,
  Shield,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ExportFormatDialog from "../components/ExportFormatDialog";
import PrivacyPolicyDialog from "../components/PrivacyPolicyDialog";
import AdminGateDialog from "../components/admin/AdminGateDialog";
import PermissionsMatrix from "../components/admin/PermissionsMatrix";
import AttendanceSection from "../components/settings/AttendanceSection";
import WhatsAppTemplatesEditor from "../components/settings/WhatsAppTemplatesEditor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetAllAttendance,
  useGetAppointments,
  useGetCallerUserProfile,
  useGetLeads,
  useGetPatients,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";
import { exportAttendanceData } from "../utils/attendanceExport";
import {
  exportAppointmentsToExcel,
  exportAppointmentsToPDF,
  exportAttendanceToExcel,
  exportAttendanceToPDF,
  exportLeadsToExcel,
  exportLeadsToPDF,
  exportPatientsToExcel,
  exportPatientsToPDF,
} from "../utils/exportUtils";

type ExportType = "appointments" | "patients" | "leads" | "attendance" | null;

export default function SettingsTab() {
  const { data: profile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: appointments = [] } = useGetAppointments();
  const { data: patients = [] } = useGetPatients();
  const { data: leads = [] } = useGetLeads();
  const { data: attendance = [] } = useGetAllAttendance();

  const [username, setUsername] = useState(profile?.username || "");
  const [clinicName, setClinicName] = useState(profile?.clinicName || "");
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState<ExportType>(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await saveProfile.mutateAsync({
        username,
        clinicName,
      });
      toast.success("Profile updated successfully");
    } catch (_error) {
      toast.error("Failed to update profile");
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    toast.success("Logged out successfully");
  };

  const handleShareApp = async () => {
    const shareData = {
      title: "Client Appointment Management App",
      text: "Check out this clinic management app!",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        toast.success("App link copied to clipboard");
      }
    } catch (_error) {
      toast.error("Failed to share app");
    }
  };

  const handleExportClick = (type: ExportType) => {
    setExportType(type);
    setShowExportDialog(true);
  };

  const handleExportConfirm = (format: "pdf" | "excel") => {
    try {
      if (exportType === "appointments") {
        if (format === "pdf") {
          exportAppointmentsToPDF(appointments);
        } else {
          exportAppointmentsToExcel(appointments);
        }
        toast.success("Appointments exported successfully");
      } else if (exportType === "patients") {
        if (format === "pdf") {
          exportPatientsToPDF(patients);
        } else {
          exportPatientsToExcel(patients);
        }
        toast.success("Patients exported successfully");
      } else if (exportType === "leads") {
        if (format === "pdf") {
          exportLeadsToPDF(leads);
        } else {
          exportLeadsToExcel(leads);
        }
        toast.success("Leads exported successfully");
      } else if (exportType === "attendance") {
        const monthlyData = exportAttendanceData(attendance);
        if (format === "pdf") {
          exportAttendanceToPDF(attendance, monthlyData);
        } else {
          exportAttendanceToExcel(attendance, monthlyData);
        }
        toast.success("Attendance exported successfully");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleAdminUnlock = () => {
    setIsAdminUnlocked(true);
    setShowAdminGate(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and application settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Admin</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal and clinic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  data-ocid="settings.profile.input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicName">App / Clinic Name</Label>
                <Input
                  id="clinicName"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Client Appointment Management"
                  data-ocid="settings.clinicname.input"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saveProfile.isPending}
                  data-ocid="settings.profile.save_button"
                >
                  {saveProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareApp}
                  className="gap-2"
                  data-ocid="settings.share.button"
                >
                  <Share2 className="h-4 w-4" />
                  Share App
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="gap-2"
                  data-ocid="privacy_policy.open_modal_button"
                >
                  <FileText className="h-4 w-4" />
                  Privacy Policy
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleLogout}
                data-ocid="settings.logout.button"
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceSection />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppTemplatesEditor />
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          {!isAdminUnlocked ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Section
                </CardTitle>
                <CardDescription>
                  This section requires admin authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowAdminGate(true)}
                  className="gap-2"
                  data-ocid="settings.admin.open_modal_button"
                >
                  <Shield className="h-4 w-4" />
                  Unlock Admin Section
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PermissionsMatrix />
          )}
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Download your clinic data by category in PDF or Excel format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  onClick={() => handleExportClick("appointments")}
                  variant="outline"
                  className="gap-2 justify-start"
                  data-ocid="settings.appointments.button"
                >
                  <Download className="h-4 w-4" />
                  Export Appointments
                </Button>
                <Button
                  onClick={() => handleExportClick("patients")}
                  variant="outline"
                  className="gap-2 justify-start"
                  data-ocid="settings.patients.button"
                >
                  <Download className="h-4 w-4" />
                  Export Patients
                </Button>
                <Button
                  onClick={() => handleExportClick("leads")}
                  variant="outline"
                  className="gap-2 justify-start"
                  data-ocid="settings.leads.button"
                >
                  <Download className="h-4 w-4" />
                  Export Leads
                </Button>
                <Button
                  onClick={() => handleExportClick("attendance")}
                  variant="outline"
                  className="gap-2 justify-start"
                  data-ocid="settings.attendance.button"
                >
                  <Download className="h-4 w-4" />
                  Export Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdminGateDialog
        open={showAdminGate}
        onOpenChange={setShowAdminGate}
        onUnlocked={handleAdminUnlock}
      />

      <ExportFormatDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onConfirm={handleExportConfirm}
        title="Select Export Format"
        description="Choose PDF or Excel format for your export"
      />

      <PrivacyPolicyDialog
        open={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </div>
  );
}
