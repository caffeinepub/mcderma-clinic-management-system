import type { Appointment, PatientView, Lead, Attendance } from '../hooks/useQueries';

function formatDate(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) : ts;
  return new Date(ms).toLocaleDateString('en-IN');
}

function formatTime(ts: bigint | number): string {
  const ms = typeof ts === 'bigint' ? Number(ts) : ts;
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── JSON Export ──────────────────────────────────────────────────────────────

export function exportAppointmentsJSON(appointments: Appointment[]): void {
  const data = appointments.map((a) => ({
    id: String(a.id),
    patientName: a.patientName,
    mobile: a.mobile,
    date: formatDate(a.appointmentTime),
    time: formatTime(a.appointmentTime),
    notes: a.notes,
    isFollowUp: a.isFollowUp,
    assignedDoctor: a.assignedDoctor ?? '',
  }));
  downloadJSON(data, 'appointments.json');
}

export function exportPatientsJSON(patients: PatientView[]): void {
  const data = patients.map((p) => ({
    name: p.name,
    mobile: p.mobile,
    area: p.area,
    notes: p.notes,
  }));
  downloadJSON(data, 'patients.json');
}

export function exportLeadsJSON(leads: Lead[]): void {
  const data = leads.map((l) => ({
    leadName: l.leadName,
    mobile: l.mobile,
    treatmentWanted: l.treatmentWanted,
    area: l.area,
    followUpDate: formatDate(l.followUpDate),
    expectedTreatmentDate: formatDate(l.expectedTreatmentDate),
    rating: l.rating,
    doctorRemark: l.doctorRemark,
    leadStatus: l.leadStatus,
  }));
  downloadJSON(data, 'leads.json');
}

export function exportAttendanceJSON(attendance: Attendance[]): void {
  const data = attendance.map((a) => ({
    name: a.name,
    role: a.role,
    date: formatDate(a.timestamp),
    time: formatTime(a.timestamp),
  }));
  downloadJSON(data, 'attendance.json');
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportAppointmentsCSV(appointments: Appointment[]): void {
  const headers = ['ID', 'Patient Name', 'Mobile', 'Date', 'Time', 'Notes', 'Follow Up', 'Assigned Doctor'];
  const rows = appointments.map((a) => [
    String(a.id), a.patientName, a.mobile,
    formatDate(a.appointmentTime), formatTime(a.appointmentTime),
    a.notes, a.isFollowUp ? 'Yes' : 'No', a.assignedDoctor ?? '',
  ]);
  downloadCSV([headers, ...rows], 'appointments.csv');
}

export function exportPatientsCSV(patients: PatientView[]): void {
  const headers = ['Name', 'Mobile', 'Area', 'Notes'];
  const rows = patients.map((p) => [p.name, p.mobile, p.area, p.notes]);
  downloadCSV([headers, ...rows], 'patients.csv');
}

export function exportLeadsCSV(leads: Lead[]): void {
  const headers = ['Lead Name', 'Mobile', 'Treatment Wanted', 'Area', 'Follow Up Date', 'Expected Treatment Date', 'Rating', 'Doctor Remark', 'Status'];
  const rows = leads.map((l) => [
    l.leadName, l.mobile, l.treatmentWanted, l.area,
    formatDate(l.followUpDate), formatDate(l.expectedTreatmentDate),
    String(l.rating), l.doctorRemark, l.leadStatus,
  ]);
  downloadCSV([headers, ...rows], 'leads.csv');
}

export function exportAttendanceCSV(attendance: Attendance[]): void {
  const headers = ['Name', 'Role', 'Date', 'Time'];
  const rows = attendance.map((a) => [a.name, a.role, formatDate(a.timestamp), formatTime(a.timestamp)]);
  downloadCSV([headers, ...rows], 'attendance.csv');
}

// ─── Backward-compatible aliases used by SettingsTab ─────────────────────────

export const exportAppointmentsToPDF = exportAppointmentsJSON;
export const exportPatientsToPDF = exportPatientsJSON;
export const exportLeadsToPDF = exportLeadsJSON;
export function exportAttendanceToPDF(attendance: Attendance[], _monthlyData?: unknown): void {
  exportAttendanceJSON(attendance);
}

export const exportAppointmentsToExcel = exportAppointmentsCSV;
export const exportPatientsToExcel = exportPatientsCSV;
export const exportLeadsToExcel = exportLeadsCSV;
export function exportAttendanceToExcel(attendance: Attendance[], _monthlyData?: unknown): void {
  exportAttendanceCSV(attendance);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

function downloadCSV(rows: string[][], filename: string): void {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
