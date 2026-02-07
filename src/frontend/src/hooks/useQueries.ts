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
      // Sort appointments by appointmentTime in ascending order (earliest first)
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
      // Use the sorted backend endpoint
      const appointments = await actor.getTodaysAppointmentsSorted();
      // Additional frontend sorting for consistency (backend already sorts)
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
      // Use the sorted backend endpoint
      const appointments = await actor.getTomorrowAppointmentsSorted();
      // Additional frontend sorting for consistency (backend already sorts)
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
      // Use the sorted backend endpoint
      const appointments = await actor.getUpcomingAppointmentsSorted();
      // Additional frontend sorting for consistency (backend already sorts)
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
      return actor.getLeads();
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

export function useUpdateLeadStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { mobile: string; leadStatus: string }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Fetch the current lead data
      const leads = await actor.getLeads();
      const currentLead = leads.find((l) => l.mobile === data.mobile);
      
      if (!currentLead) {
        throw new Error('Lead not found');
      }

      // Update the lead with the new status
      return actor.updateLead(
        data.mobile,
        currentLead.leadName,
        currentLead.mobile,
        currentLead.treatmentWanted,
        currentLead.area,
        currentLead.followUpDate,
        currentLead.expectedTreatmentDate,
        currentLead.rating,
        currentLead.doctorRemark,
        currentLead.addToAppointment,
        data.leadStatus
      );
    },
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['leads'] });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData<Lead[]>(['leads']);

      // Optimistically update to the new value
      if (previousLeads) {
        queryClient.setQueryData<Lead[]>(
          ['leads'],
          previousLeads.map((lead) =>
            lead.mobile === data.mobile ? { ...lead, leadStatus: data.leadStatus } : lead
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousLeads };
    },
    onError: (_err, _data, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we're in sync
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
