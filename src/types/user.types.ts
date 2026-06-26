export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher' | 'parent';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Teacher {
  _id: string;
  user: User;
  subjects: string[];
  batches: string[];
  qualification: string;
  experience: number;
}

export interface Parent {
  _id: string;
  user: User;
  occupation?: string;
  address?: string;
  children: string[];
}
