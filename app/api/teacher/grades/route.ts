// app/api/teacher/grades/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

const pickOne = <T,>(v: MaybeArray<T>): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

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
