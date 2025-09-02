// app/api/user-profile/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type Role = 'admin' | 'teacher' | 'student';

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  role: Role;
  profile_image_url: string | null;
  bio: string | null;
  birthday: string | null;
  phone: string | null;
  address: string | null;
  student_id: string | null;
  department: string | null;
  position: string | null;
};

type TeacherSubjectRow = { subject: { name: string } | null } | null;
type StudentClassRow  = { class: { name: string } | null } | null;

export async function GET() {
  // ใช้ helper ฝั่งเซิร์ฟเวอร์ของโปรเจกต์ (ดูแล cookies ให้แล้ว)
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ดึงโปรไฟล์หลัก
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select(
      'first_name,last_name,role,profile_image_url,bio,birthday,phone,address,student_id,department,position'
    )
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // ถ้ายังไม่มีแถวใน profiles — ส่งค่าเริ่มต้นให้ UI ใช้งานได้
  if (!profile) {
    const displayName = user.email ?? 'User';
    return NextResponse.json({
      id: user.id,
      email: user.email,
      first_name: null,
      last_name: null,
      role: 'student' as Role, // fallback ปลอดภัย
      profile_image_url: null,
      bio: null,
      birthday: null,
      phone: null,
      address: null,
      student_id: null,
      department: null,
      position: null,
      subject_name: null,
      class_name: null,
      display_name: displayName,
      detail: 'No assignment',
    });
  }

  // ดึง assignment ตามบทบาท
  let subjectName: string | null = null;
  let className: string | null = null;

  if (profile.role === 'teacher') {
    const { data } = await supabase
      .from('teacher_subjects')
      .select('subject:subjects(name)')
      .eq('teacher_id', user.id)
      .limit(1)
      .maybeSingle<TeacherSubjectRow>();
    subjectName = data?.subject?.name ?? null;
  } else if (profile.role === 'student') {
    const { data } = await supabase
      .from('student_classes')
      .select('class:classes(name)')
      .eq('student_id', user.id)
      .limit(1)
      .maybeSingle<StudentClassRow>();
    className = data?.class?.name ?? null;
  }

  const displayName =
    `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() ||
    user.email ||
    'User';

  const detail =
    profile.role === 'teacher'
      ? subjectName ?? 'No assignment'
      : profile.role === 'student'
      ? className ?? 'No assignment'
      : 'No assignment';

  return NextResponse.json({
    id: user.id,
    email: user.email,
    ...profile,
    subject_name: subjectName,
    class_name: className,
    display_name: displayName,
    detail,
  });
}
