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
export type Time = bigint;
export interface Attendance {
    name: string;
    role: string;
    timestamp: bigint;
}
export interface PatientView {
    area: string;
    name: string;
    notes: string;
    prescriptionHistory: Array<Prescription>;
    image?: ExternalBlob;
    mobile: string;
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
export interface StaffPermissions {
    hasFullControl: boolean;
    canAccessSettings: boolean;
    canAccessAppointments: boolean;
    canAccessPatients: boolean;
    canAccessLeads: boolean;
}
export interface Staff {
    name: string;
    role: string;
}
export interface Appointment {
    id: bigint;
    appointmentTime: bigint;
    notes: string;
    patientName: string;
    mobile: string;
    isFollowUp: boolean;
}
export interface Prescription {
    doctorNotes: string;
    prescriptionData: {
        __kind__: "typed";
        typed: string;
    } | {
        __kind__: "freehand";
        freehand: ExternalBlob;
    } | {
        __kind__: "camera";
        camera: ExternalBlob;
    };
    followUp?: string;
    prescriptionType: Variant_typed_freehand_camera;
    medicalHistory?: string;
    timestamp: bigint;
    patientName: string;
    symptoms?: string;
    mobile: string;
    clinicName: string;
    allergies?: string;
    appointmentId?: bigint;
    consultationType: Variant_telemedicine_inPerson;
}
export interface AdminConfig {
    hashedSecurityAnswer?: Uint8Array;
    securityQuestion: string;
    hashedPassword?: Uint8Array;
}
export interface UserProfile {
    username: string;
    clinicName: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_telemedicine_inPerson {
    telemedicine = "telemedicine",
    inPerson = "inPerson"
}
export enum Variant_typed_freehand_camera {
    typed = "typed",
    freehand = "freehand",
    camera = "camera"
}
export interface backendInterface {
    addAppointment(patientName: string, mobile: string, appointmentTime: bigint, notes: string): Promise<string>;
    addLead(leadName: string, mobile: string, treatmentWanted: string, area: string, followUpDate: bigint, expectedTreatmentDate: bigint, rating: number, doctorRemark: string, addToAppointment: boolean, leadStatus: string): Promise<string>;
    addPatient(image: ExternalBlob | null, name: string, mobile: string, area: string, notes: string): Promise<string>;
    addStaff(name: string, role: string, permissions: StaffPermissions): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAttendance(name: string, role: string): Promise<boolean>;
    deleteAppointment(id: bigint): Promise<string>;
    deleteLead(mobile: string): Promise<string>;
    deletePatient(mobile: string): Promise<string>;
    deletePrescription(patientMobile: string, id: bigint): Promise<string>;
    deleteStaff(staffName: string): Promise<string>;
    getAdminConfig(): Promise<AdminConfig | null>;
    getAppointments(): Promise<Array<Appointment>>;
    getAttendance(): Promise<Array<Attendance>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLeads(): Promise<Array<Lead>>;
    getPatients(): Promise<Array<PatientView>>;
    getPrescriptionById(patientMobile: string, id: bigint): Promise<Prescription | null>;
    getPrescriptions(patientMobile: string): Promise<Array<Prescription>>;
    getPrescriptionsLastModified(): Promise<Time | null>;
    getStaff(): Promise<Array<Staff>>;
    getStaffPermissions(staffName: string): Promise<StaffPermissions | null>;
    getTodaysAppointmentsSorted(): Promise<Array<Appointment>>;
    getTomorrowAppointmentsSorted(): Promise<Array<Appointment>>;
    getUpcomingAppointmentsSorted(): Promise<Array<Appointment>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, hashedPassword: Uint8Array): Promise<string>;
    register(username: string, hashedPassword: Uint8Array): Promise<string>;
    resetAdminPassword(hashedSecurityAnswer: Uint8Array, newHashedPassword: Uint8Array): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePrescription(prescription: Prescription): Promise<string>;
    setAdminPassword(hashedPassword: Uint8Array, securityQuestion: string, hashedSecurityAnswer: Uint8Array): Promise<string>;
    toggleFollowUpAppointment(id: bigint): Promise<string>;
    unlockAdmin(hashedSecurityAnswer: Uint8Array): Promise<boolean>;
    updateAppointment(id: bigint, updatedAppointment: Appointment): Promise<string>;
    updateAttendance(_timestamp: string, name: string, role: string): Promise<boolean>;
    updateLead(mobile: string, leadName: string, newMobile: string, treatmentWanted: string, area: string, followUpDate: bigint, expectedTreatmentDate: bigint, rating: number, doctorRemark: string, addToAppointment: boolean, leadStatus: string): Promise<string>;
    updatePatient(mobile: string, image: ExternalBlob | null, name: string, newMobile: string, area: string, notes: string): Promise<string>;
    updateStaffPermissions(staffName: string, permissions: StaffPermissions): Promise<string>;
    verifyAdminPassword(hashedPassword: Uint8Array): Promise<boolean>;
}
