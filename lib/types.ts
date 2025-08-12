export type Role = "admin" | "teacher" | "student";
export type IssueStatus = "ใหม่" | "กำลังดำเนินการ" | "แก้ไขแล้ว";
export type IssueCategory =
  | "การเรียนการสอน"
  | "อาคารสถานที่"
  | "IT/อุปกรณ์"
  | "อื่นๆ";

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
  class_id?: string | null;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  created_at: string;
  reported_by: {
    first_name: string;
    last_name: string;
    role: Role;
  } | null;
}

export interface AcademicTerm {
    id: string;
    name: string;
    year: number;
    term: number;
}