import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Appointment, Patient, Lead, UserProfile, Time } from '../backend';
import { ExternalBlob } from '../backend';

// Backend timestamp check queries
export function useGetLastModified() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Time | null>({
    queryKey: ['lastModified'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLastModified();
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
  });
}

export function useGetLastSyncTime() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Time | null>({
    queryKey: ['lastSyncTime'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getLastSyncTime();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateLastSyncTime() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLastSyncTime();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lastSyncTime'] });
    },
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

// Appointment Queries
export function useGetAppointments() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      if (!actor) return [];
      const appointments = await actor.getAppointments();
      return appointments.sort((a, b) => {
        const timeA = Number(a.appointmentTime);
        const timeB = Number(b.appointmentTime);
        return timeA - timeB;
      });
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useGetTodaysAppointments() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['todaysAppointments'],
    queryFn: async () => {
      if (!actor) return [];
      const appointments = await actor.getTodaysAppointmentsSorted();
      return appointments.sort((a, b) => {
        const timeA = Number(a.appointmentTime);
        const timeB = Number(b.appointmentTime);
        return timeA - timeB;
      });
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useGetTomorrowAppointments() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['tomorrowAppointments'],
    queryFn: async () => {
      if (!actor) return [];
      const appointments = await actor.getTomorrowAppointmentsSorted();
      return appointments.sort((a, b) => {
        const timeA = Number(a.appointmentTime);
        const timeB = Number(b.appointmentTime);
        return timeA - timeB;
      });
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useGetUpcomingAppointments() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Appointment[]>({
    queryKey: ['upcomingAppointments'],
    queryFn: async () => {
      if (!actor) return [];
      const appointments = await actor.getUpcomingAppointmentsSorted();
      return appointments.sort((a, b) => {
        const timeA = Number(a.appointmentTime);
        const timeB = Number(b.appointmentTime);
        return timeA - timeB;
      });
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useAddAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { patientName: string; mobile: string; appointmentTime: bigint; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAppointment(data.patientName, data.mobile, data.appointmentTime, data.notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

export function useUpdateAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; appointment: Appointment }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAppointment(data.id, data.appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

export function useDeleteAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAppointment(appointmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

export function useToggleFollowUpAppointment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleFollowUpAppointment(appointmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['todaysAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['tomorrowAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

// Patient Queries
export function useGetPatients() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPatients();
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useAddPatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { image: ExternalBlob | null; name: string; mobile: string; area: string; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addPatient(data.image, data.name, data.mobile, data.area, data.notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

export function useUpdatePatient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { mobile: string; image: ExternalBlob | null; name: string; newMobile: string; area: string; notes: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePatient(data.mobile, data.image, data.name, data.newMobile, data.area, data.notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
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
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

// Lead Queries
export function useGetLeads() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      if (!actor) return [];
      const leads = await actor.getLeads();
      return leads.sort((a, b) => Number(a.followUpDate) - Number(b.followUpDate));
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
}

export function useAddLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
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
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLead(
        data.leadName,
        data.mobile,
        data.treatmentWanted,
        data.area,
        data.followUpDate,
        data.expectedTreatmentDate,
        data.rating,
        data.doctorRemark,
        data.addToAppointment,
        data.leadStatus
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      mobile: string;
      leadName: string;
      newMobile: string;
      treatmentWanted: string;
      area: string;
      followUpDate: bigint;
      expectedTreatmentDate: bigint;
      rating: number;
      doctorRemark: string;
      addToAppointment: boolean;
      leadStatus: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLead(
        data.mobile,
        data.leadName,
        data.newMobile,
        data.treatmentWanted,
        data.area,
        data.followUpDate,
        data.expectedTreatmentDate,
        data.rating,
        data.doctorRemark,
        data.addToAppointment,
        data.leadStatus
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
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
      queryClient.invalidateQueries({ queryKey: ['lastModified'] });
    },
  });
}

// Staff Management Queries (Placeholder - backend functions needed)
export function useGetStaff() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<{ name: string; role: string }>>({
    queryKey: ['staff'],
    queryFn: async () => {
      if (!actor) return [];
      // TODO: Backend function needed: actor.getStaff()
      // For now, return empty array
      return [];
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
  });
}

export function useAddStaff() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; role: string }) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Backend function needed: actor.addStaff(name, role)
      throw new Error('Backend function not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

// Attendance Queries (Placeholder - backend functions needed)
export function useRegisterAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; role: string }) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Backend function needed: actor.registerAttendance(name, role)
      throw new Error('Backend function not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaysAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['allAttendance'] });
    },
  });
}

export function useGetTodaysAttendance() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<{ name: string; role: string; timestamp: bigint }>>({
    queryKey: ['todaysAttendance'],
    queryFn: async () => {
      if (!actor) return [];
      // TODO: Backend function needed: actor.getTodaysAttendance()
      return [];
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
  });
}

export function useGetAllAttendance() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<{ name: string; role: string; timestamp: bigint }>>({
    queryKey: ['allAttendance'],
    queryFn: async () => {
      if (!actor) return [];
      // TODO: Backend function needed: actor.getAllAttendance()
      return [];
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
  });
}

// Admin Config Queries (Placeholder - backend functions needed)
export function useGetAdminConfig() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<{ hashedPassword: Uint8Array | null; securityQuestion: string; hashedSecurityAnswer: Uint8Array | null }>({
    queryKey: ['adminConfig'],
    queryFn: async () => {
      if (!actor) return { hashedPassword: null, securityQuestion: 'Which is your favorite colour', hashedSecurityAnswer: null };
      // TODO: Backend function needed: actor.getAdminConfig()
      return { hashedPassword: null, securityQuestion: 'Which is your favorite colour', hashedSecurityAnswer: null };
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
  });
}

export function useSaveAdminConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { hashedPassword: Uint8Array; securityQuestion: string; hashedSecurityAnswer: Uint8Array }) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Backend function needed: actor.saveAdminConfig(config)
      throw new Error('Backend function not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminConfig'] });
    },
  });
}

// Staff Permissions Queries (Placeholder - backend functions needed)
export function useGetStaffPermissions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Record<string, {
    canAccessAppointments: boolean;
    canAccessPatients: boolean;
    canAccessLeads: boolean;
    canAccessSettings: boolean;
    hasFullControl: boolean;
  }>>({
    queryKey: ['staffPermissions'],
    queryFn: async () => {
      if (!actor) return {};
      // TODO: Backend function needed: actor.getStaffPermissions()
      return {};
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
  });
}

export function useSaveStaffPermissions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      staffName: string;
      permissions: {
        canAccessAppointments: boolean;
        canAccessPatients: boolean;
        canAccessLeads: boolean;
        canAccessSettings: boolean;
        hasFullControl: boolean;
      };
    }) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Backend function needed: actor.saveStaffPermissions(staffName, permissions)
      throw new Error('Backend function not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffPermissions'] });
    },
  });
}

// WhatsApp Templates Queries (Placeholder - backend functions needed)
export function useGetWhatsAppTemplates() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Record<string, { templateName: string; messageContent: string }>>({
    queryKey: ['whatsappTemplates'],
    queryFn: async () => {
      if (!actor) return {};
      // TODO: Backend function needed: actor.getWhatsAppTemplates()
      return {};
    },
    enabled: !!actor && !actorFetching,
    refetchOnWindowFocus: false,
  });
}

export function useSaveWhatsAppTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { templateName: string; messageContent: string }) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Backend function needed: actor.saveWhatsAppTemplate(template)
      throw new Error('Backend function not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappTemplates'] });
    },
  });
}

export function useGetWhatsAppTemplate() {
  const { actor, isFetching: actorFetching } = useActor();

  return useMutation({
    mutationFn: async (templateName: string) => {
      if (!actor) throw new Error('Actor not available');
      // TODO: Backend function needed: actor.getWhatsAppTemplate(templateName)
      throw new Error('Backend function not implemented');
    },
  });
}
