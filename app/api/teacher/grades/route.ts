// app/api/teacher/grades/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/* ---------- Types ---------- */
type MaybeArray<T> = T | T[] | null | undefined;

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  room: number;
}

interface TeacherSubjectRow {
  subject_id: string;
  subject: MaybeArray<{ name: string }>;
}

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
}

interface StudentClassRow {
  student: MaybeArray<StudentProfile>;
}

interface GradeRow {
  student_id: string;
  score: number | null;
}

/* ---------- Helpers ---------- */
const pickOne = <T,>(v: MaybeArray<T>): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

/* =======================================================================
 * GET
 * -----------------------------------------------------------------------
 * - /api/teacher/grades?getClasses=true  → รายชื่อห้องที่ครูสอน + ชื่อวิชา
 * - /api/teacher/grades?classId=...      → รายชื่อนักเรียน + คะแนนของวิชานั้น
 * =======================================================================
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const getClasses = searchParams.get('getClasses');
  const classId = searchParams.get('classId');

  // 1) วิชาที่ครูสอน
  const { data: teacherSubjectRaw, error: tsError } = await supabase
    .from('teacher_subjects')
    .select('subject_id, subject:subjects(name)')
    .eq('teacher_id', user.id)
    .single();

  if (tsError || !teacherSubjectRaw) {
    return NextResponse.json(
      { error: 'คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด' },
      { status: 400 }
    );
  }
  const teacherSubject = teacherSubjectRaw as TeacherSubjectRow;

  // 2) ขอรายชื่อห้องที่ครูสอน
  if (getClasses) {
    const { data: taughtClassesRaw, error: tcError } = await supabase
      .from('schedule_slots')
      .select('class:classes(id, name, grade, room)')
      .eq('teacher_id', user.id);

    if (tcError) throw tcError;

    const classes: ClassInfo[] = (taughtClassesRaw ?? [])
      .map((row) => pickOne<ClassInfo>((row as { class: MaybeArray<ClassInfo> }).class))
      .filter((c): c is ClassInfo => !!c);

    // unique + sort
    const unique = Array.from(new Map(classes.map((c) => [c.id, c])).values()).sort(
      (a, b) => (a.grade === b.grade ? a.room - b.room : a.grade - b.grade)
    );

    return NextResponse.json({
      classes: unique,
      subjectName: pickOne(teacherSubject.subject)?.name ?? '',
    });
  }

  // 3) ดึงนักเรียนในห้อง + คะแนน
  if (classId) {
    const { data: studentsInClassRaw, error: scError } = await supabase
      .from('student_classes')
      .select('student:profiles(id, first_name, last_name)')
      .eq('class_id', classId);

    if (scError) throw scError;

    const students: StudentProfile[] = (studentsInClassRaw ?? [])
      .map((row) => pickOne<StudentProfile>((row as StudentClassRow).student))
      .filter((s): s is StudentProfile => !!s);

    if (students.length === 0) return NextResponse.json({ students: [] });

    const { data: gradesRaw, error: gError } = await supabase
      .from('grades')
      .select('student_id, score')
      .in('student_id', students.map((s) => s.id))
      .eq('subject_id', teacherSubject.subject_id);

    if (gError) throw gError;
    const grades = (gradesRaw ?? []) as GradeRow[];

    const studentsWithScores = students.map((s) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      score: grades.find((g) => g.student_id === s.id)?.score ?? null,
    }));

    return NextResponse.json({ students: studentsWithScores });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}


export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.grades)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { classId, grades } = body as {
    classId?: string;
    grades: { studentId: string; score: number | null; grade: number | string | null }[];
  };

  // ✅ ต้องมี classId เสมอ เพราะ grades.class_id = NOT NULL
  if (!classId) {
    return NextResponse.json({ error: 'classId is required' }, { status: 400 });
  }

  // หา subject ที่ครูสอน
  const { data: teacherSubjectRaw, error: tsError } = await supabase
    .from('teacher_subjects')
    .select('subject_id')
    .eq('teacher_id', user.id)
    .single();

  if (tsError || !teacherSubjectRaw) {
    return NextResponse.json(
      { error: 'คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด' },
      { status: 400 }
    );
  }
  const subjectId: string = (teacherSubjectRaw as { subject_id: string }).subject_id;

  // (ออปชันแนะนำ) ตรวจว่านักเรียนทั้งหมดอยู่ในห้อง classId จริง
  const { data: studsRaw, error: scError } = await supabase
    .from('student_classes')
    .select('student_id')
    .eq('class_id', classId);

  if (scError) {
    return NextResponse.json({ error: scError.message }, { status: 500 });
  }
  const allowed = new Set((studsRaw ?? []).map((r: { student_id: string }) => r.student_id));
  const invalid = grades.find((g) => !allowed.has(g.studentId));
  if (invalid) {
    return NextResponse.json({ error: 'พบรหัสนักเรียนที่ไม่ได้อยู่ในห้องนี้' }, { status: 400 });
  }

  // ✅ ใส่ class_id และ teacher_id ให้ครบเพื่อเลี่ยง NOT NULL
  const rows = grades.map((g) => ({
    student_id: g.studentId,
    subject_id: subjectId,
    class_id: classId,
    score: g.score,
    grade: g.grade == null ? null : Number(g.grade),
    teacher_id: user.id,
  }));

  // ถ้าคีย์ unique เป็น (student_id, subject_id, class_id) ให้ระบุแบบนี้
  const { error } = await supabase
    .from('grades')
    .upsert(rows, { onConflict: 'student_id,subject_id,class_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
