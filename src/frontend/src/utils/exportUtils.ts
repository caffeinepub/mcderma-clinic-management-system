import type { Appointment, PatientView, Lead, Attendance } from '../backend';
import { formatTimestamp12Hour, formatDateDDMMYY } from '../lib/utils';

// Simple JSON export functions that work without external dependencies
export function exportAppointmentsToPDF(appointments: Appointment[]) {
  // For now, export as JSON since PDF libraries are not available
  exportAppointmentsToJSON(appointments);
}

export function exportPatientsToPDF(patients: PatientView[]) {
  // For now, export as JSON since PDF libraries are not available
  exportPatientsToJSON(patients);
}

export function exportLeadsToPDF(leads: Lead[]) {
  // For now, export as JSON since PDF libraries are not available
  exportLeadsToJSON(leads);
}

export function exportAttendanceToPDF(attendance: Attendance[], monthlyData: any) {
  // For now, export as JSON since PDF libraries are not available
  exportAttendanceToJSON(attendance, monthlyData);
}

export function exportAppointmentsToExcel(appointments: Appointment[]) {
  // For now, export as CSV since Excel libraries are not available
  exportAppointmentsToCSV(appointments);
}

export function exportPatientsToExcel(patients: PatientView[]) {
  // For now, export as CSV since Excel libraries are not available
  exportPatientsToCSV(patients);
}

export function exportLeadsToExcel(leads: Lead[]) {
  // For now, export as CSV since Excel libraries are not available
  exportLeadsToCSV(leads);
}

export function exportAttendanceToExcel(attendance: Attendance[], monthlyData: any) {
  // For now, export as CSV since Excel libraries are not available
  exportAttendanceToCSV(attendance, monthlyData);
}

// JSON Export Functions
function exportAppointmentsToJSON(appointments: Appointment[]) {
  const exportData = {
    appointments: appointments.map(apt => ({
      id: apt.id.toString(),
      patientName: apt.patientName,
      mobile: apt.mobile,
      time: formatTimestamp12Hour(apt.appointmentTime),
      date: formatDateDDMMYY(new Date(Number(apt.appointmentTime) / 1000000)),
      notes: apt.notes,
      isFollowUp: apt.isFollowUp,
    })),
    exportedAt: new Date().toISOString(),
  };

  downloadJSON(exportData, `appointments-${new Date().toISOString().split('T')[0]}.json`);
}

function exportPatientsToJSON(patients: PatientView[]) {
  const exportData = {
    patients: patients.map(patient => ({
      name: patient.name,
      mobile: patient.mobile,
      area: patient.area,
      notes: patient.notes,
      prescriptionCount: patient.prescriptionHistory.length,
    })),
    exportedAt: new Date().toISOString(),
  };

  downloadJSON(exportData, `patients-${new Date().toISOString().split('T')[0]}.json`);
}

function exportLeadsToJSON(leads: Lead[]) {
  const exportData = {
    leads: leads.map(lead => ({
      leadName: lead.leadName,
      mobile: lead.mobile,
      treatmentWanted: lead.treatmentWanted,
      area: lead.area,
      leadStatus: lead.leadStatus,
      followUpDate: formatDateDDMMYY(new Date(Number(lead.followUpDate) / 1000000)),
      expectedTreatmentDate: formatDateDDMMYY(new Date(Number(lead.expectedTreatmentDate) / 1000000)),
      rating: lead.rating,
      doctorRemark: lead.doctorRemark,
    })),
    exportedAt: new Date().toISOString(),
  };

  downloadJSON(exportData, `leads-${new Date().toISOString().split('T')[0]}.json`);
}

function exportAttendanceToJSON(attendance: Attendance[], monthlyData: any) {
  const exportData = {
    attendance: attendance.map(record => ({
      name: record.name,
      role: record.role,
      time: formatTimestamp12Hour(record.timestamp),
      date: formatDateDDMMYY(new Date(Number(record.timestamp) / 1000000)),
    })),
    monthlyAttendanceSummary: Object.entries(monthlyData).map(([staffName, yearData]: [string, any]) => ({
      staffName,
      months: Object.entries(yearData.months).map(([month, data]: [string, any]) => ({
        month: parseInt(month) + 1,
        monthName: new Date(2024, parseInt(month), 1).toLocaleString('default', { month: 'long' }),
        presentDays: data.presentDays,
        absentDays: data.absentDays,
        absentDates: data.absentDates.join(', '),
      })),
    })),
    exportedAt: new Date().toISOString(),
  };

  downloadJSON(exportData, `attendance-${new Date().toISOString().split('T')[0]}.json`);
}

// CSV Export Functions
function exportAppointmentsToCSV(appointments: Appointment[]) {
  const headers = ['ID', 'Patient Name', 'Mobile', 'Time', 'Date', 'Notes', 'Follow Up'];
  const rows = appointments.map(apt => [
    apt.id.toString(),
    apt.patientName,
    apt.mobile,
    formatTimestamp12Hour(apt.appointmentTime),
    formatDateDDMMYY(new Date(Number(apt.appointmentTime) / 1000000)),
    apt.notes,
    apt.isFollowUp ? 'Yes' : 'No',
  ]);

  downloadCSV(headers, rows, `appointments-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportPatientsToCSV(patients: PatientView[]) {
  const headers = ['Name', 'Mobile', 'Area', 'Notes', 'Prescriptions Count'];
  const rows = patients.map(patient => [
    patient.name,
    patient.mobile,
    patient.area,
    patient.notes,
    patient.prescriptionHistory.length.toString(),
  ]);

  downloadCSV(headers, rows, `patients-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportLeadsToCSV(leads: Lead[]) {
  const headers = ['Name', 'Mobile', 'Treatment Wanted', 'Area', 'Status', 'Follow Up Date', 'Expected Treatment Date', 'Rating', 'Doctor Remark'];
  const rows = leads.map(lead => [
    lead.leadName,
    lead.mobile,
    lead.treatmentWanted,
    lead.area,
    lead.leadStatus,
    formatDateDDMMYY(new Date(Number(lead.followUpDate) / 1000000)),
    formatDateDDMMYY(new Date(Number(lead.expectedTreatmentDate) / 1000000)),
    lead.rating.toString(),
    lead.doctorRemark,
  ]);

  downloadCSV(headers, rows, `leads-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportAttendanceToCSV(attendance: Attendance[], monthlyData: any) {
  const headers = ['Name', 'Role', 'Time', 'Date'];
  const rows = attendance.map(record => [
    record.name,
    record.role,
    formatTimestamp12Hour(record.timestamp),
    formatDateDDMMYY(new Date(Number(record.timestamp) / 1000000)),
  ]);

  downloadCSV(headers, rows, `attendance-${new Date().toISOString().split('T')[0]}.csv`);
}

// Helper functions
function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
