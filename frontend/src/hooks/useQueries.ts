import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  username: string;
  clinicName: string;
}

export interface Appointment {
  id: bigint;
  patientName: string;
  mobile: string;
  appointmentTime: bigint;
  notes: string;
  isFollowUp: boolean;
  assignedDoctor?: string | null;
}

export interface Patient {
  image?: any;
  name: string;
  mobile: string;
  area: string;
  notes: string;
  prescriptionHistory: Prescription[];
}

export type PatientView = Patient;

export interface Lead {
  leadName: string;
  mobile: string;
  treatmentWanted: string;
  area: string;
  followUpDate: bigint;
  expectedTreatmentDate: bigint;
  rating: number;
  doctorRemark: string;
  addToAppointment: boolean;
  leadStatus: string;
}

export interface Staff {
  name: string;
  role: string;
}

export interface Attendance {
  name: string;
  role: string;
  timestamp: bigint;
}

export interface StaffPermissions {
  canAccessAppointments: boolean;
  canAccessPatients: boolean;
  canAccessLeads: boolean;
  canAccessSettings: boolean;
  hasFullControl: boolean;
}

export interface WhatsAppTemplate {
  templateName: string;
  messageContent: string;
}

export interface AdminConfig {
  hashedPassword: Uint8Array | null;
  securityQuestion: string;
  hashedSecurityAnswer: Uint8Array | null;
}

export type PrescriptionType = { typed: null } | { freehand: null } | { camera: null };
export type ConsultationType = { telemedicine: null } | { inPerson: null };
export type PrescriptionData =
  | { typed: string }
  | { freehand: any }
  | { camera: any };

export interface Prescription {
  patientName: string;
  mobile: string;
  clinicName: string;
  prescriptionType: PrescriptionType;
  prescriptionData: PrescriptionData;
  doctorNotes: string;
  consultationType: ConsultationType;
  appointmentId: bigint[] | [];
  timestamp: bigint;
  symptoms: string[] | [];
  allergies: string[] | [];
  medicalHistory: string[] | [];
  followUp: string[] | [];
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export function useGetAppointments() {
  const { actor, isFetching } = useActor();
  return useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      if (!actor) return [];
      const result = await (actor as any).getAppointments();
      return result.map((a: any) => ({
        ...a,
        assignedDoctor: Array.isArray(a.assignedDoctor)
          ? (a.assignedDoctor[0] ?? null)
          : (a.assignedDoctor ?? null),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias hooks for backward compatibility
export function useGetTodaysAppointments() {
  const result = useGetAppointments();
  const today = new Date();
  return {
    ...result,
    data: (result.data ?? []).filter((a) => {
      const d = new Date(Number(a.appointmentTime));
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      );
    }),
  };
}

export function useGetTomorrowAppointments() {
  const result = useGetAppointments();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    ...result,
    data: (result.data ?? []).filter((a) => {
      const d = new Date(Number(a.appointmentTime));
      return (
        d.getFullYear() === tomorrow.getFullYear() &&
        d.getMonth() === tomorrow.getMonth() &&
        d.getDate() === tomorrow.getDate()
      );
    }),
  };
}

export function useGetUpcomingAppointments() {
  const result = useGetAppointments();
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);
  return {
    ...result,
    data: (result.data ?? []).filter((a) => {
      const d = new Date(Number(a.appointmentTime));
      return d >= dayAfterTomorrow;
    }),
  };
}

export function useCreateAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).createAppointment(appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Alias
export const useAddAppointment = useCreateAppointment;

export function useUpdateAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appointment: Appointment) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updateAppointment(appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useDeleteAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteAppointment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useAssignDoctorToAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      appointmentId,
      doctorName,
    }: {
      appointmentId: bigint;
      doctorName: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).assignDoctorToAppointment(appointmentId, doctorName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// ─── Patients ─────────────────────────────────────────────────────────────────

export function useGetPatients() {
  const { actor, isFetching } = useActor();
  return useQuery<PatientView[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPatients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      patient: Omit<PatientView, 'prescriptionHistory'> & {
        prescriptionHistory?: Prescription[];
      }
    ) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).createPatient(patient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Alias
export const useAddPatient = useCreatePatient;

export function useUpdatePatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patient: PatientView) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updatePatient(patient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useDeletePatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mobile: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deletePatient(mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export function useGetLeads() {
  const { actor, isFetching } = useActor();
  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getLeads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Lead) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).createLead(lead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// Alias
export const useAddLead = useCreateLead;

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Lead) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).updateLead(lead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mobile: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteLead(mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export function useGetStaff() {
  const { actor, isFetching } = useActor();
  return useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getStaff();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStaffByRole(role: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Staff[]>({
    queryKey: ['staff', 'byRole', role],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getStaffByRole(role);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateStaff() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (staff: Staff) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).createStaff(staff);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useDeleteStaff() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).deleteStaff(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function useGetAllAttendance() {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ['attendance'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllAttendance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTodaysAttendance() {
  const { actor, isFetching } = useActor();
  return useQuery<Attendance[]>({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getTodaysAttendance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attendance: Omit<Attendance, 'timestamp'>) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).createAttendance(attendance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useGetAdminConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<AdminConfig | null>({
    queryKey: ['adminConfig'],
    queryFn: async () => {
      if (!actor) return null;
      return (actor as any).getAdminConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetupAdminConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      password: string;
      securityQuestion: string;
      securityAnswer: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).setupAdminConfig(
        params.password,
        params.securityQuestion,
        params.securityAnswer
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminConfig'] });
    },
  });
}

export function useVerifyAdminPassword() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).verifyAdminPassword(password);
    },
  });
}

export function useGetPermissionsMatrix() {
  const { actor, isFetching } = useActor();
  return useQuery<Record<string, StaffPermissions>>({
    queryKey: ['permissionsMatrix'],
    queryFn: async () => {
      if (!actor) return {};
      return (actor as any).getPermissionsMatrix();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePermissionsMatrix() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matrix: Record<string, StaffPermissions>) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).savePermissionsMatrix(matrix);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionsMatrix'] });
    },
  });
}

// ─── WhatsApp Templates ───────────────────────────────────────────────────────

export function useGetWhatsAppTemplates() {
  const { actor, isFetching } = useActor();
  return useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsappTemplates'],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getWhatsAppTemplates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveWhatsAppTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: WhatsAppTemplate) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).saveWhatsAppTemplate(template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] });
    },
  });
}

// Alias for backward compat
export const useSaveWhatsAppTemplates = useSaveWhatsAppTemplate;

// ─── Prescriptions ────────────────────────────────────────────────────────────

export function usePrescriptions(patientMobile: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Prescription[]>({
    queryKey: ['prescriptions', patientMobile],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPrescriptions(patientMobile);
    },
    enabled: !!actor && !isFetching && !!patientMobile,
  });
}

export function useSavePrescription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prescription: Prescription) => {
      if (!actor) throw new Error('Actor not available');
      return (actor as any).savePrescription(prescription);
    },
    onSuccess: (_data: any, variables: Prescription) => {
      queryClient.invalidateQueries({
        queryKey: ['prescriptions', variables.mobile],
      });
    },
  });
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export function useGetLastModified() {
  const { actor, isFetching } = useActor();
  return useQuery<Record<string, bigint>>({
    queryKey: ['lastModified'],
    queryFn: async () => {
      if (!actor) return {};
      return (actor as any).getLastModified();
    },
    enabled: !!actor && !isFetching,
  });
}
