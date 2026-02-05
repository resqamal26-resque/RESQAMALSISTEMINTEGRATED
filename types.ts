
export enum UserRole {
  RESPONDER = 'Responder',
  MECC = 'MECC',
  AJK = 'AJK',
  PIC = 'PIC',
  SUPERADMIN = 'SuperAdmin'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  state: string;
  password?: string;
  createdAt: string;
  spreadsheetId?: string; // ID of the personal Google Spreadsheet
}

export interface CheckpointDetail {
  id: string;
  callsign: string;
  location: string;
  pic: string;
  staff: string[];
}

export interface AmbulanceDetail {
  id: string;
  callsign: string;
  noPlate: string;
  location: string;
  pic: string;
  crew: string[];
}

export interface Program {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  state: string;
  status: 'Active' | 'Inactive' | 'Completed';
  checkpoints: CheckpointDetail[];
  ambulances: AmbulanceDetail[];
}

export interface Case {
  id: string;
  programId: string;
  programName?: string;
  responderName: string;
  checkpoint: string;
  patientName: string;
  age: string;
  gender: string;
  complaint: string;
  consciousness: string;
  bp: string;
  pr: string;
  temp: string;
  dxt: string;
  treatment: string;
  medicName: string;
  startTime: string;
  endTime: string;
  status: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface Attendance {
  id: string;
  programId: string;
  responderId: string;
  responderName: string;
  checkpoint: string;
  entryTime: string;
  exitTime?: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface Notification {
  id: string;
  programId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'case' | 'attendance' | 'alert';
}

export interface Hospital {
  name: string;
  address: string;
  distance?: string;
  type: 'Hospital' | 'Clinic';
}
