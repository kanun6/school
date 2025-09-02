// app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { createClient, type AdminUserAttributes, type User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/* ======================= Admin client (Service Role) ======================= */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

/* ================================= Types ================================== */
type Role = 'admin' | 'teacher' | 'student';

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  profile_image_url: string | null;
  bio: string | null;
  birthday: string | null; // YYYY-MM-DD
  phone: string | null;
  address: string | null;
  student_id: string | null;
  department: string | null;
  position: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

interface TeacherSubjectRow {
  teacher_id: string;
  subject_id: string;
}

interface StudentClassRow {
  student_id: string;
  class_id: string;
}

/** โครงที่ API คืน (ManagedUser + ฟิลด์เสริม) */
interface AdminUserOut {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  banned_until: string | null;
  subject_id: string | null;
  class_id: string | null;

  profile_image_url: string | null;
  bio: string | null;
  birthday: string | null;
  phone: string | null;
  address: string | null;
  student_id: string | null;
  department: string | null;
  position: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
}

type UpdatesIn = Partial<{
  // assignments
  subject_id: string | null;
  class_id: string | null;

  // role & ชื่อ
  role: Role;
  first_name: string | null;
  last_name: string | null;

  // profile fields
  profile_image_url: string | null;
  bio: string | null;
  birthday: string | null;
  phone: string | null;
  address: string | null;
  department: string | null;
  position: string | null;
  student_id: string | null;

  // auth ban
  ban_duration: '24h' | 'none';
}>;

/* =============================== AuthZ check =============================== */
async function isAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/* ================================== GET =================================== */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { data, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (usersError) throw usersError;

    const users: User[] = data?.users ?? [];
    if (users.length === 0) {
      return NextResponse.json<AdminUserOut[]>([]);
    }

    const ids: string[] = users.map((u) => u.id);

    const [profilesRes, teacherSubjectsRes, studentClassesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').in('id', ids),
      supabaseAdmin.from('teacher_subjects').select('*').in('teacher_id', ids),
      supabaseAdmin.from('student_classes').select('*').in('student_id', ids),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (teacherSubjectsRes.error) throw teacherSubjectsRes.error;
    if (studentClassesRes.error) throw studentClassesRes.error;

    const profiles: ProfileRow[] = (profilesRes.data ?? []) as ProfileRow[];
    const teacherSubjects: TeacherSubjectRow[] = (teacherSubjectsRes.data ?? []) as TeacherSubjectRow[];
    const studentClasses: StudentClassRow[] = (studentClassesRes.data ?? []) as StudentClassRow[];

    // Maps แบบ type-safe
    const profileById: Map<string, ProfileRow> = new Map(profiles.map((p) => [p.id, p]));
    const teacherById: Map<string, TeacherSubjectRow[]> = teacherSubjects.reduce(
      (acc, row) => {
        const list = acc.get(row.teacher_id);
        if (list) list.push(row);
        else acc.set(row.teacher_id, [row]);
        return acc;
      },
      new Map<string, TeacherSubjectRow[]>(),
    );
    const studentById: Map<string, StudentClassRow[]> = studentClasses.reduce(
      (acc, row) => {
        const list = acc.get(row.student_id);
        if (list) list.push(row);
        else acc.set(row.student_id, [row]);
        return acc;
      },
      new Map<string, StudentClassRow[]>(),
    );

    const result: AdminUserOut[] = users.map((u) => {
      const p: ProfileRow | undefined = profileById.get(u.id);
      const tAssign = (teacherById.get(u.id) ?? [])[0] ?? null;
      const sAssign = (studentById.get(u.id) ?? [])[0] ?? null;

      return {
        id: u.id,
        email: u.email ?? '',
        first_name: p?.first_name ?? '',
        last_name: p?.last_name ?? '',
        role: (p?.role ?? 'student') as Role,
        banned_until: (u as unknown as { banned_until?: string | null }).banned_until ?? null, // บางเวอร์ชันของ type ไม่มี field นี้ แต่ API ส่งคืนจริง
        subject_id: tAssign?.subject_id ?? null,
        class_id: sAssign?.class_id ?? null,

        profile_image_url: p?.profile_image_url ?? null,
        bio: p?.bio ?? null,
        birthday: p?.birthday ?? null,
        phone: p?.phone ?? null,
        address: p?.address ?? null,
        student_id: p?.student_id ?? null,
        department: p?.department ?? null,
        position: p?.position ?? null,
        updated_at: p?.updated_at ?? null,

        created_at: u.created_at ?? null,
        last_sign_in_at: (u as unknown as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ================================== PUT =================================== */
export async function PUT(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId, updates } = (await request.json()) as {
      userId: string;
      updates: UpdatesIn;
    };

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates are required.' },
        { status: 400 },
      );
    }

    /* ---------- Assignments ---------- */
    if ('subject_id' in updates) {
      if (updates.subject_id) {
        const { error } = await supabaseAdmin
          .from('teacher_subjects')
          .upsert({ teacher_id: userId, subject_id: updates.subject_id });
        if (error) throw new Error(`Failed to assign subject: ${error.message}`);
      } else {
        const { error } = await supabaseAdmin
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', userId);
        if (error) throw new Error(`Failed to unassign subject: ${error.message}`);
      }
    }

    if ('class_id' in updates) {
      if (updates.class_id) {
        const { error } = await supabaseAdmin
          .from('student_classes')
          .upsert({ student_id: userId, class_id: updates.class_id });
        if (error) throw new Error(`Failed to assign class: ${error.message}`);
      } else {
        const { error } = await supabaseAdmin
          .from('student_classes')
          .delete()
          .eq('student_id', userId);
        if (error) throw new Error(`Failed to unassign class: ${error.message}`);
      }
    }

    /* ---------- บันทึกโปรไฟล์ (รองรับทุกฟิลด์ รวม null) ---------- */
    const profileUpdates: Partial<ProfileRow> = { updated_at: new Date().toISOString() };

    if ('first_name' in updates) profileUpdates.first_name = updates.first_name ?? null;
    if ('last_name' in updates) profileUpdates.last_name = updates.last_name ?? null;
    if ('role' in updates && updates.role) profileUpdates.role = updates.role;

    if ('profile_image_url' in updates) profileUpdates.profile_image_url = updates.profile_image_url ?? null;
    if ('bio' in updates) profileUpdates.bio = updates.bio ?? null;
    if ('birthday' in updates) profileUpdates.birthday = updates.birthday ?? null;
    if ('phone' in updates) profileUpdates.phone = updates.phone ?? null;
    if ('address' in updates) profileUpdates.address = updates.address ?? null;
    if ('department' in updates) profileUpdates.department = updates.department ?? null;
    if ('position' in updates) profileUpdates.position = updates.position ?? null;
    if ('student_id' in updates) profileUpdates.student_id = updates.student_id ?? null;

    // มีฟิลด์อย่างน้อย 1 อย่าง (นอกเหนือจาก updated_at)
    if (Object.keys(profileUpdates).length > 1) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: userId, ...profileUpdates }, { onConflict: 'id' });
      if (error) throw error;
    }

    /* ---------- ถ้าเปลี่ยน role เคลียร์ assignment ข้ามบทบาทเพื่อความปลอดภัย ---------- */
    if ('role' in updates && updates.role) {
      if (updates.role === 'admin') {
        await supabaseAdmin.from('teacher_subjects').delete().eq('teacher_id', userId);
        await supabaseAdmin.from('student_classes').delete().eq('student_id', userId);
      } else if (updates.role === 'teacher') {
        await supabaseAdmin.from('student_classes').delete().eq('student_id', userId);
      } else if (updates.role === 'student') {
        await supabaseAdmin.from('teacher_subjects').delete().eq('teacher_id', userId);
      }
    }

    /* ---------- Ban / Unban (Auth Admin API) ---------- */
    if ('ban_duration' in updates && updates.ban_duration) {
      const attrs: AdminUserAttributes = { ban_duration: updates.ban_duration };
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, attrs);
      if (error) throw error;
    }

    return NextResponse.json({ message: 'User updated successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ================================= DELETE ================================= */
export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { userId } = (await request.json()) as { userId: string };
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ message: 'User deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
