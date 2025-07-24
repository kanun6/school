export type Role = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: Role;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Class {
    id: string;
    name: string;
}

export interface ManagedUser extends Profile {
  email: string;
  banned_until?: string;
  subject_id?: string | null;
  class_id?: string | null; // ID ของห้องเรียนที่สังกัด
}