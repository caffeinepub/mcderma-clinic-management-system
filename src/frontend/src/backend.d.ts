import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Lead {
    doctorRemark: string;
    leadName: string;
    addToAppointment: boolean;
    area: string;
    treatmentWanted: string;
    leadStatus: string;
    rating: number;
    mobile: string;
    expectedTreatmentDate: bigint;
    followUpDate: bigint;
}
export type Time = bigint;
export interface Appointment {
    id: bigint;
    appointmentTime: bigint;
    notes: string;
    patientName: string;
    mobile: string;
    isFollowUp: boolean;
}
export interface UserProfile {
    username: string;
    clinicName: string;
}
export interface Patient {
    area: string;
    name: string;
    notes: string;
    image?: ExternalBlob;
    mobile: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAppointment(patientName: string, mobile: string, appointmentTime: bigint, notes: string): Promise<string>;
    addLead(leadName: string, mobile: string, treatmentWanted: string, area: string, followUpDate: bigint, expectedTreatmentDate: bigint, rating: number, doctorRemark: string, addToAppointment: boolean, leadStatus: string): Promise<string>;
    addPatient(image: ExternalBlob | null, name: string, mobile: string, area: string, notes: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAppointment(id: bigint): Promise<string>;
    deleteLead(mobile: string): Promise<string>;
    deletePatient(mobile: string): Promise<string>;
    getAppointments(): Promise<Array<Appointment>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLastModified(): Promise<Time | null>;
    getLastModifiedAppointments(): Promise<Time | null>;
    getLastModifiedLeads(): Promise<Time | null>;
    getLastModifiedPatients(): Promise<Time | null>;
    getLastModifiedProfile(): Promise<Time | null>;
    getLastModifiedTimes(): Promise<{
        leads?: Time;
        appointments?: Time;
        patients?: Time;
        profile?: Time;
    }>;
    getLastSyncTime(): Promise<Time | null>;
    getLeads(): Promise<Array<Lead>>;
    getPatients(): Promise<Array<Patient>>;
    getTodaysAppointmentsSorted(): Promise<Array<Appointment>>;
    getTomorrowAppointmentsSorted(): Promise<Array<Appointment>>;
    getUpcomingAppointmentsSorted(): Promise<Array<Appointment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, hashedPassword: Uint8Array): Promise<string>;
    register(username: string, hashedPassword: Uint8Array): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleFollowUpAppointment(id: bigint): Promise<string>;
    updateAppointment(id: bigint, updatedAppointment: Appointment): Promise<string>;
    updateLastSyncTime(): Promise<void>;
    updateLead(mobile: string, leadName: string, newMobile: string, treatmentWanted: string, area: string, followUpDate: bigint, expectedTreatmentDate: bigint, rating: number, doctorRemark: string, addToAppointment: boolean, leadStatus: string): Promise<string>;
    updatePatient(mobile: string, image: ExternalBlob | null, name: string, newMobile: string, area: string, notes: string): Promise<string>;
}
