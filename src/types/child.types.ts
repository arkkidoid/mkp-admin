export interface Child {
  _id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  photo?: string;
  class: string;
  section: string;
  parent: string;
  batch?: string;
  teacher?: string;
  admissionDate: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  isActive: boolean;
}
