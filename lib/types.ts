import { User } from '@supabase/supabase-js';

export type Role = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: Role;
}

// Type สำหรับข้อมูลที่รวมโปรไฟล์และอีเมลเพื่อใช้ในหน้า Admin
export interface ManagedUser extends Profile {
  email: string;
  banned_until?: string; // เพิ่มสถานะการแบน
}