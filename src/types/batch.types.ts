export interface BatchSchedule {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  startTime: string;
  endTime: string;
}

export interface Batch {
  _id: string;
  name: string;
  subject?: { _id: string; name: string };
  teacher: { _id: string; name: string; phone?: string };
  classroom: string;
  schedule: BatchSchedule[];
  capacity: number;
  children: any[];
  isActive: boolean;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}
