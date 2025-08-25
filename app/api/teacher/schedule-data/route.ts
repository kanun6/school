// app/api/teacher/schedule-data/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ---------- Domain Types ----------
type ClassRef = { id: string; name: string } | null;
type SubjectRef = { name: string } | null;
type TeacherRef = { id: string; first_name: string; last_name: string } | null;

type ScheduleRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  class_id: string;
  teacher_id: string;
  class: ClassRef;
  subject: SubjectRef;
  teacher: TeacherRef;
};

type ClassData = { id: string; name: string };

type UIScheduleSlot = {
  id: string;               // ใช้ id จริงจากตาราง schedule_slots
  day_of_week: number;
  start_time: string;
  class_id: string;
  class_name: string;
  subject_name: string;
  teacher_id: string;
};

// ---------- Type Guards / Safe Helpers ----------
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const readString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : fallback;

const readNumber = (v: unknown, fallback = 0): number =>
  typeof v === 'number' ? v : Number.isFinite(Number(v)) ? Number(v) : fallback;

const toClassRef = (v: unknown): ClassRef => {
  if (!isRecord(v)) return null;
  const id = readString(v.id);
  const name = readString(v.name);
  return id || name ? { id, name } : null;
};

const toSubjectRef = (v: unknown): SubjectRef => {
  if (!isRecord(v)) return null;
  const name = readString(v.name);
  return name ? { name } : null;
};

const toTeacherRef = (v: unknown): TeacherRef => {
  if (!isRecord(v)) return null;
  const id = readString(v.id);
  const first_name = readString(v.first_name);
  const last_name = readString(v.last_name);
  return id || first_name || last_name ? { id, first_name, last_name } : null;
};

const toScheduleRow = (v: unknown): ScheduleRow | null => {
  if (!isRecord(v)) return null;
  return {
    id: readString(v.id),
    day_of_week: readNumber(v.day_of_week),
    start_time: readString(v.start_time),
    class_id: readString(v.class_id),
    teacher_id: readString(v.teacher_id),
    class: toClassRef(v.class),
    subject: toSubjectRef(v.subject),
    teacher: toTeacherRef(v.teacher),
  };
};

const toClassData = (v: unknown): ClassData | null => {
  if (!isRecord(v)) return null;
  const id = readString(v.id);
  const name = readString(v.name);
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

  try {
    // 1) วิชาที่ครูสอน
    const teacherSubjectRes = await supabase
      .from('teacher_subjects')
      .select('subject_id, subject:subjects(name)')
      .eq('teacher_id', user.id)
      .single();

    if (teacherSubjectRes.error || !teacherSubjectRes.data) {
      return NextResponse.json(
        { error: 'คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด' },
        { status: 400 }
      );
    }

    const subjectName =
      isRecord(teacherSubjectRes.data.subject) &&
      typeof teacherSubjectRes.data.subject.name === 'string'
        ? teacherSubjectRes.data.subject.name
        : '';

    // 2) ตารางสอนทั้งหมด (รวมข้อมูลอ้างอิง)
    const allSchedulesRes = await supabase
      .from('schedule_slots')
      .select(`
        id,
        day_of_week,
        start_time,
        class_id,
        teacher_id,
        class:classes(id, name),
        subject:subjects(name),
        teacher:profiles(id, first_name, last_name)
      `);

    if (allSchedulesRes.error) throw allSchedulesRes.error;

    const scheduleRows: ScheduleRow[] = Array.isArray(allSchedulesRes.data)
      ? allSchedulesRes.data
          .map(toScheduleRow)
          .filter((r): r is ScheduleRow => r !== null)
      : [];

    // 3) ห้องทั้งหมด
    const allClassesRes = await supabase.from('classes').select('id, name').order('name');
    if (allClassesRes.error) throw allClassesRes.error;

    const allClasses: ClassData[] = Array.isArray(allClassesRes.data)
      ? allClassesRes.data
          .map(toClassData)
          .filter((c): c is ClassData => c !== null)
      : [];

    // สร้างข้อมูลสำหรับ UI
    const mapUi = (s: ScheduleRow): UIScheduleSlot => ({
      id: s.id, // id จริงของ schedule_slots
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      class_id: s.class_id,
      class_name: s.class?.name ?? '',
      subject_name: s.subject?.name ?? '',
      teacher_id: s.teacher_id,
    });

    const allSchedulesForUi = scheduleRows.map(mapUi);
    const mySchedule = scheduleRows.filter(s => s.teacher_id === user.id).map(mapUi);

    return NextResponse.json({
      mySchedule,
      allSchedules: allSchedulesForUi,
      allClasses,
      mySubjectName: subjectName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
