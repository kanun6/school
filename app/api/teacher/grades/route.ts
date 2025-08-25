import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ข้อมูลของห้องเรียนที่ครูสอน (จากตาราง classes)
interface ClassInfo {
  id: string;
  name: string;
  grade: number;
  room: number;
}

// โครงสร้างของนักเรียนที่คืนจาก student_classes (student เป็น array)
interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
}
interface StudentClassRow {
  student: StudentProfile[];
}

// โครงสร้างข้อมูลวิชาที่ครูสอน (subject เป็น array)
interface TeacherSubjectRow {
  subject_id: string;
  subject: { name: string }[];
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const getClasses = searchParams.get('getClasses');
  const classId = searchParams.get('classId');

  try {
    // ตรวจสอบว่าครูสอนวิชาอะไร
    const { data: teacherSubjectRaw, error: tsError } = await supabase
      .from('teacher_subjects')
      .select('subject_id, subject:subjects(name)')
      .eq('teacher_id', user.id)
      .single();

    if (tsError || !teacherSubjectRaw) {
      throw new Error('คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด');
    }

    // cast เพื่อใช้ subject[0]
    const teacherSubject = teacherSubjectRaw as TeacherSubjectRow;

    // กรณีต้องการดึงรายชื่อห้องที่ครูสอน
    if (getClasses) {
      const { data: taughtClasses, error: tcError } = await supabase
        .from('schedule_slots')
        .select('class:classes(id, name, grade, room)')
        .eq('teacher_id', user.id);
      if (tcError) throw tcError;

      // แปลงผลลัพธ์ให้เหลือ class เดียวต่อ id โดยเลือก element แรกของ array
      const uniqueClassesMap = new Map<string, ClassInfo>(
        (taughtClasses ?? []).map((item) => {
          const classInfo = item.class[0] as ClassInfo;
          return [classInfo.id, classInfo];
        })
      );

      // จัดเรียงตาม grade แล้วตาม room
      const uniqueClasses = Array.from(uniqueClassesMap.values());
      uniqueClasses.sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.room - b.room;
      });

      return NextResponse.json({
        classes: uniqueClasses,
        subjectName: teacherSubject.subject[0]?.name ?? '',
      });
    }

    // กรณีต้องการดึงนักเรียนในห้องนั้น พร้อมคะแนนในวิชาที่ครูสอน
    if (classId) {
      // ดึงรายชื่อนักเรียนในห้อง
      const { data: studentsInClassRaw, error: scError } = await supabase
        .from('student_classes')
        .select('student:profiles(id, first_name, last_name)')
        .eq('class_id', classId);
      if (scError) throw scError;

      const studentsInClass = (studentsInClassRaw ?? []) as StudentClassRow[];
      const studentIds = studentsInClass.map((sc) => sc.student[0].id);
      if (studentIds.length === 0) {
        return NextResponse.json({ students: [] });
      }

      // ดึงคะแนนของนักเรียนในวิชาที่ครูสอน
      const { data: grades, error: gError } = await supabase
        .from('grades')
        .select('student_id, score')
        .in('student_id', studentIds)
        .eq('subject_id', teacherSubject.subject_id);
      if (gError) throw gError;

      // รวมรายชื่อนักเรียนกับคะแนน
      const studentsWithScores = studentsInClass.map((sc) => {
        const student = sc.student[0];
        const gradeRecord = grades.find((g) => g.student_id === student.id);
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          score: gradeRecord?.score ?? null,
        };
      });

      return NextResponse.json({ students: studentsWithScores });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    // ตรวจสอบวิชาที่ครูสอน
    const { data: teacherSubject, error: tsError } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', user.id)
      .single();
    if (tsError || !teacherSubject) {
      throw new Error('คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด');
    }

    const { classId, grades } = await request.json();
    if (!classId || !grades) {
      return NextResponse.json(
        { error: 'Class ID and grades are required' },
        { status: 400 }
      );
    }

    // สร้างข้อมูลสำหรับ upsert คะแนน
    const recordsToUpsert = grades.map(
      (g: { studentId: string; score: number; grade: string }) => ({
        student_id: g.studentId,
        class_id: classId,
        teacher_id: user.id,
        subject_id: teacherSubject.subject_id,
        score: g.score,
        grade: g.grade,
        updated_at: new Date().toISOString(),
      })
    );

    const { error } = await supabase
      .from('grades')
      .upsert(recordsToUpsert, { onConflict: 'student_id, subject_id' });
    if (error) throw error;

    return NextResponse.json({ message: 'Grades saved successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
