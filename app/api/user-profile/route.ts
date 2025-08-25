import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// โครงสร้างของข้อมูล profile ที่ดึงมาจาก Supabase
interface ProfileRow {
  first_name: string;
  last_name: string;
  role: string;
  teacher_subject: {
    subject: { name: string }[];
  }[] | null;
  student_class: {
    class: { name: string }[];
  }[] | null;
}

export async function GET() {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ดึงข้อมูล profile พร้อมข้อมูลวิชาที่สอนและห้องของนักเรียน
    const { data: profileRaw, error } = await supabase
      .from('profiles')
      .select(`
        first_name,
        last_name,
        role,
        teacher_subject:teacher_subjects(subject:subjects(name)),
        student_class:student_classes(class:classes(name))
      `)
      .eq('id', user.id)
      .single();

    if (error || !profileRaw) throw error;

    // cast ผลลัพธ์เป็น ProfileRow เพื่อให้ TypeScript เข้าใจว่า teacher_subject และ student_class เป็น array
    const profile = profileRaw as ProfileRow;

    const response = {
      name: `${profile.first_name} ${profile.last_name}`,
      detail: 'No assignment',
    };

    // ถ้าเป็นครูและมี teacher_subject ให้เลือกตัวแรก
    if (profile.role === 'teacher' && profile.teacher_subject && profile.teacher_subject.length > 0) {
      const subjectName = profile.teacher_subject[0]?.subject[0]?.name ?? '';
      response.detail = `วิชา: ${subjectName}`;
    }
    // ถ้าเป็นนักเรียนและมี student_class ให้เลือกตัวแรก
    else if (profile.role === 'student' && profile.student_class && profile.student_class.length > 0) {
      const className = profile.student_class[0]?.class[0]?.name ?? '';
      response.detail = `ห้อง: ${className}`;
    }

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
