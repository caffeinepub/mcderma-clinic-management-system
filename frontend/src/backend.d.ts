import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Staff {
    name: string;
    role: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignDoctorToAppointment(appointmentId: bigint, doctorName: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getStaffByRole(role: string): Promise<Array<Staff>>;
    isCallerAdmin(): Promise<boolean>;
}
