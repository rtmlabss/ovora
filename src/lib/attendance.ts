export interface AttendanceRecord {
  id: number;
  userId: number;
  userName: string;
  branchId: number;
  branchName: string;
  type: "masuk" | "pulang";
  photoUrl: string | null;
  selfiePhoto: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  locationAddress: string | null;
  timestamp: string;
  deviceInfo: string | null;
  status: "tepat" | "telat" | "dini";
  note: string | null;
  createdAt: string;
}

export interface EmployeeShift {
  id: number;
  userId: number;
  userName: string;
  branchId: number;
  branchName: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workDays: string[];
  status: "aktif" | "nonaktif";
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendance {
  userId: number;
  branchId: number;
  type: "masuk" | "pulang";
  selfiePhoto?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationAddress?: string;
  note?: string;
  deviceInfo?: string;
}

export interface CreateEmployeeShift {
  userId: number;
  branchId: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  workDays: string[]; // Array of day names like ["senin", "selasa", ...]
}

export const DAY_NAMES = [
  "minggu",
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
];