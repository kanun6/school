// app/api/student/schedule/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ---------- Types ----------
type MaybeArray<T> = T | T[] | null | undefined;

type ClassRef = { id: string; name: string } | null;

type SubjectRef = { name: string };
type TeacherRef = { first_name: string; last_name: string };

type ScheduleRow = {
  day_of_week: number;
  start_time: string;
  subject: MaybeArray<SubjectRef>;
  teacher: MaybeArray<TeacherRef>;
};

// ---------- Helpers ----------
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const pickOne = <T,>(val: MaybeArray<T>): T | null =>
  Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

const toClassRef = (v: unknown): ClassRef => {
  if (!v) return null;
  const obj = Array.isArray(v) ? v[0] : v;
  if (!isRecord(obj)) return null;
  const id = typeof obj.id === 'string' ? obj.id : '';
  const name = typeof obj.name === 'string' ? obj.name : '';
  return id || name ? { id, name } : null;
};

// ---------- Route ----------
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ห้องของนักเรียน
  const { data: studentClassRow, error: scError } = await supabase
    .from('student_classes')
    .select('class:classes(id, name)')
    .eq('student_id', user.id)
    .single();

  if (scError) return NextResponse.json({ error: scError.message }, { status: 500 });

  const clazz = toClassRef(isRecord(studentClassRow) ? studentClassRow.class : null);
  if (!clazz) {
    return NextResponse.json({ error: 'คุณยังไม่ถูกกำหนดห้องเรียน' }, { status: 404 });
  }

  // ตารางสอนของอาจารย์ที่สอนห้องนี้เท่านั้น
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('schedule_slots')
    .select(`
      day_of_week,
      start_time,
      subject:subjects(name),
      teacher:profiles(first_name, last_name)
    `)
    .eq('class_id', clazz.id)
    .not('teacher_id', 'is', null)  // ต้องมีครูจริง
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (scheduleError) return NextResponse.json({ error: scheduleError.message }, { status: 500 });

  const rows: ScheduleRow[] = Array.isArray(scheduleData)
    ? scheduleData.map((r) => ({
        day_of_week: Number((r as ScheduleRow).day_of_week) || 0,
        start_time: String((r as ScheduleRow).start_time ?? ''),
        subject: (r as ScheduleRow).subject,
        teacher: (r as ScheduleRow).teacher,
      }))
    : [];

  const schedule = rows.map((row) => {
    const subj = pickOne<SubjectRef>(row.subject);
    const teach = pickOne<TeacherRef>(row.teacher);
    return {
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      subject_name: subj?.name ?? '-',
      teacher_name: teach ? `${teach.first_name} ${teach.last_name}` : '-',
    };
  });

  return NextResponse.json({ className: clazz.name, schedule });
}
