import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Appointment, PatientView, UserProfile, Attendance, Prescription, Lead, AdminConfig, Staff, StaffPermissions } from '../backend';
import { ExternalBlob, Variant_typed_freehand_camera, Variant_telemedicine_inPerson } from '../backend';

// Temporary type definitions for missing backend types
interface WhatsAppTemplate {
  templateName: string;
  messageContent: string;
}

// Export types for use in other components
export type { Lead, Staff, StaffPermissions, PatientView };

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Appointment Queries
export function useGetAppointments() {
  const { actor, isFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAppointments();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useGetTodaysAppointments() {
  const { actor, isFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['todaysAppointments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTodaysAppointmentsSorted();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useGetTomorrowAppointments() {
  const { actor, isFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['tomorrowAppointments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTomorrowAppointmentsSorted();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useGetUpcomingAppointments() {
  const { actor, isFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['upcomingAppointments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingAppointmentsSorted();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useAddAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id' | 'isFollowUp'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAppointment(
        appointment.patientName,
        appointment.mobile,
        appointment.appointmentTime,
        appointment.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, appointment }: { id: bigint; appointment: Appointment }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAppointment(id, appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
    },
  });
}

export function useDeleteAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAppointment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
    },
  });
}

export function useToggleFollowUpAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleFollowUpAppointment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
    },
  });
}

// Patient Queries
export function useGetPatients() {
  const { actor, isFetching } = useActor();

  return useQuery<PatientView[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPatients();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useAddPatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patient: Omit<PatientView, 'prescriptionHistory'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPatient(
        patient.image || null,
        patient.name,
        patient.mobile,
        patient.area,
        patient.notes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oldMobile, patient }: { oldMobile: string; patient: Omit<PatientView, 'prescriptionHistory'> }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePatient(
        oldMobile,
        patient.image || null,
        patient.name,
        patient.mobile,
        patient.area,
        patient.notes
      );
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
      return actor.deletePatient(mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Lead Queries
export function useGetLeads() {
  const { actor, isFetching } = useActor();

  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeads();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useAddLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Lead) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLead(
        lead.leadName,
        lead.mobile,
        lead.treatmentWanted,
        lead.area,
        lead.followUpDate,
        lead.expectedTreatmentDate,
        lead.rating,
        lead.doctorRemark,
        lead.addToAppointment,
        lead.leadStatus
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mobile, lead }: { mobile: string; lead: Lead }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLead(
        mobile,
        lead.leadName,
        lead.mobile,
        lead.treatmentWanted,
        lead.area,
        lead.followUpDate,
        lead.expectedTreatmentDate,
        lead.rating,
        lead.doctorRemark,
        lead.addToAppointment,
        lead.leadStatus
      );
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
      return actor.deleteLead(mobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// Staff Queries
export function useGetStaff() {
  const { actor, isFetching } = useActor();

  return useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getStaff();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useAddStaff() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, role, permissions }: { name: string; role: string; permissions: StaffPermissions }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addStaff(name, role, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

// Attendance Queries
export function useGetAllAttendance() {
  const { actor, isFetching } = useActor();

  return useQuery<Attendance[]>({
    queryKey: ['attendance'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAttendance();
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useGetTodaysAttendance() {
  const { actor, isFetching } = useActor();

  return useQuery<Attendance[]>({
    queryKey: ['todaysAttendance'],
    queryFn: async () => {
      if (!actor) return [];
      const allAttendance = await actor.getAttendance();
      
      // Filter for today's attendance
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartNano = BigInt(todayStart.getTime()) * BigInt(1000000);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndNano = BigInt(todayEnd.getTime()) * BigInt(1000000);
      
      return allAttendance.filter(record => {
        return record.timestamp >= todayStartNano && record.timestamp <= todayEndNano;
      });
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useCreateAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, role }: { name: string; role: string }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Check for duplicate attendance today
      const allAttendance = await actor.getAttendance();
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStartNano = BigInt(todayStart.getTime()) * BigInt(1000000);
      
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndNano = BigInt(todayEnd.getTime()) * BigInt(1000000);
      
      const todaysAttendance = allAttendance.filter(record => {
        return record.timestamp >= todayStartNano && record.timestamp <= todayEndNano;
      });
      
      const alreadyRegistered = todaysAttendance.some(record => record.name === name);
      
      if (alreadyRegistered) {
        throw new Error(`${name} has already checked in today`);
      }
      
      return actor.createAttendance(name, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAttendance'] });
    },
  });
}

// Staff Permissions Queries
export function useGetPermissionsMatrix() {
  const { actor, isFetching } = useActor();

  return useQuery<Record<string, StaffPermissions>>({
    queryKey: ['permissionsMatrix'],
    queryFn: async () => {
      if (!actor) return {};
      const staff = await actor.getStaff();
      const matrix: Record<string, StaffPermissions> = {};
      
      for (const member of staff) {
        const permissions = await actor.getStaffPermissions(member.name);
        if (permissions) {
          matrix[member.name] = permissions;
        }
      }
      
      return matrix;
    },
    enabled: !!actor && !isFetching,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useSetStaffPermissions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffName, permissions }: { staffName: string; permissions: StaffPermissions }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStaffPermissions(staffName, permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionsMatrix'] });
    },
  });
}

// Admin Config Queries
export function useGetAdminConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminConfig | null>({
    queryKey: ['adminConfig'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAdminConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetupAdminConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      hashedPassword, 
      securityQuestion, 
      hashedSecurityAnswer 
    }: { 
      hashedPassword: Uint8Array; 
      securityQuestion: string;
      hashedSecurityAnswer: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setAdminPassword(hashedPassword, securityQuestion, hashedSecurityAnswer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminConfig'] });
    },
  });
}

export function useVerifyAdminPassword() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (hashedPassword: Uint8Array) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyAdminPassword(hashedPassword);
    },
  });
}

// WhatsApp Templates Queries (Placeholder - backend not implemented)
export function useGetWhatsAppTemplates() {
  return useQuery<WhatsAppTemplate[]>({
    queryKey: ['whatsappTemplates'],
    queryFn: async () => {
      // Return default templates for lead entry
      return [
        {
          templateName: 'lead-initial-contact',
          messageContent: 'Hello {leadName}! Thank you for your interest in {treatmentWanted}. We would love to discuss your requirements. When would be a good time to connect?',
        },
        {
          templateName: 'lead-follow-up',
          messageContent: 'Hi {leadName}, following up on your inquiry about {treatmentWanted}. Are you still interested? We have some great options available for you.',
        },
        {
          templateName: 'lead-appointment-scheduling',
          messageContent: 'Hello {leadName}! We are ready to schedule your appointment for {treatmentWanted}. Please let us know your preferred date and time.',
        },
        {
          templateName: 'appointment-reminder',
          messageContent: 'Reminder: Your appointment is scheduled for {date} at {time}. Looking forward to seeing you!',
        },
        {
          templateName: 'after-appointment-feedback',
          messageContent: 'Thank you for visiting us! We hope you had a great experience. Please share your feedback.',
        },
      ];
    },
  });
}

export function useSaveWhatsAppTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templates: WhatsAppTemplate[]) => {
      // Placeholder - backend not implemented
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] });
    },
  });
}

// Prescription Queries
export function usePrescriptions(patientMobile: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Prescription[]>({
    queryKey: ['prescriptions', patientMobile],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPrescriptions(patientMobile);
    },
    enabled: !!actor && !isFetching && !!patientMobile,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

export function useSavePrescription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prescription: Prescription) => {
      if (!actor) throw new Error('Actor not available');
      return actor.savePrescription(prescription);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', variables.mobile] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useDeletePrescription() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientMobile, id }: { patientMobile: string; id: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePrescription(patientMobile, id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', variables.patientMobile] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
