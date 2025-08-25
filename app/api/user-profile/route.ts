// app/api/user-profile/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type TeacherSubjectRow = { subject: { name: string } };
type StudentClassRow  = { class: { name: string } };

export async function GET() {
  // อย่า await cookies() — ใน Next 13/14/15 มันคืน ReadonlyRequestCookies ตรงๆ
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ดึงชื่อ–บทบาทจาก profiles
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // ดึง assignment แยกตามบทบาท (หลีกเลี่ยง nested array หลายชั้น)
  let teacherSubjectName: string | null = null;
  let studentClassName: string | null = null;

  if (profile.role === 'teacher') {
    const { data } = await supabase
      .from('teacher_subjects')
      .select('subject:subjects(name)')
      .eq('teacher_id', user.id)
      .limit(1)
      .maybeSingle(); // ได้ null ถ้าไม่มีแถว

    // ป้องกันกรณี RLS ทำให้ data เป็น undefined/null
    teacherSubjectName = (data as TeacherSubjectRow | null)?.subject?.name ?? null;
  }

  if (profile.role === 'student') {
    const { data } = await supabase
      .from('student_classes')
      .select('class:classes(name)')
      .eq('student_id', user.id)
      .limit(1)
      .maybeSingle();

    studentClassName = (data as StudentClassRow | null)?.class?.name ?? null;
  }

  const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
  let detail = 'No assignment';

  if (profile.role === 'teacher' && teacherSubjectName) {
    detail = teacherSubjectName;               // หรือ `วิชา: ${teacherSubjectName}`
  } else if (profile.role === 'student' && studentClassName) {
    detail = studentClassName;                 // หรือ `ห้อง: ${studentClassName}`
  }

  return NextResponse.json({ name, detail });
}
