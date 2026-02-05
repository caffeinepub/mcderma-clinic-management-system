export interface Appointment {
  id: string;
  patientName: string;
  mobile: string;
  date: string;
  time: string;
  notes: string;
}

export interface Patient {
  id: string;
  name: string;
  mobile: string;
  area: string;
  notes: string;
  image: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  treatmentWanted: string;
  area: string;
  followUpDate: string;
  expectedTreatmentDate: string;
  rating: number;
  doctorRemark: string;
}
