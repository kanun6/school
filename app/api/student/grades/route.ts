import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface GradeInfo {
  score: number | null;
  grade: string | null;
}

interface SubjectWithGrades {
  name: string;
  grades: GradeInfo[]; // grades เป็น array ของ GradeInfo
}

export async function GET(_request: Request) {
  // ต้อง await cookies() เพื่อให้ได้ ReadonlyRequestCookies
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get student's profile and class
    const { data: studentInfoRaw, error: studentInfoError } = await supabase
      .from('profiles')
      .select(
        `
        first_name,
        last_name,
        student_class:student_classes(
          class:classes(name)
        )
      `
      )
      .eq('id', user.id)
      .single();

    if (studentInfoError) throw studentInfoError;

    // กำหนดชนิดข้อมูลให้ตรงกับโครงสร้างที่ได้ (หรือ cast เป็น any หากต้องการข้าม type-check)
    const studentInfo = studentInfoRaw as {
      first_name: string;
      last_name: string;
      student_class: {
        class: { name: string }[];
      }[];
    };

    // ตรวจสอบว่ามีห้องเรียนกำหนดหรือไม่
    if (!studentInfo.student_class || studentInfo.student_class.length === 0) {
      return NextResponse.json({ error: 'คุณยังไม่ถูกกำหนดห้องเรียน' }, { status: 404 });
    }

    const studentName = `${studentInfo.first_name} ${studentInfo.last_name}`;

    // เนื่องจาก student_class เป็นอาร์เรย์ และ class เป็นอาร์เรย์ ให้เลือก element แรก
    const className =
      studentInfo.student_class[0]?.class[0]?.name ?? '';

    // 2. Get all subjects and the student's grades for them
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select(
        `
        name,
        grades (
          score,
          grade
        )
      `
      )
      .eq('grades.student_id', user.id);

    if (subjectsError) throw subjectsError;

    // 3. Combine the data
    const grades = subjects.map((subject: SubjectWithGrades) => {
      // สมมุติว่า grades เป็นอาร์เรย์ เลือกตัวแรก
      const gradeInfo = subject.grades?.[0];
      return {
        subject_name: subject.name,
        score: gradeInfo?.score ?? null,
        grade: gradeInfo?.grade ?? null,
      };
    });

    // 4. Calculate GPA
    const gradedSubjects = grades.filter((g) => g.grade !== null);
    let gpa = 'N/A';
    if (gradedSubjects.length > 0) {
      const totalGradePoints = gradedSubjects.reduce(
        (sum, g) => sum + parseFloat(g.grade!), 0
      );
      gpa = (totalGradePoints / gradedSubjects.length).toFixed(2);
    }

    return NextResponse.json({
      studentName,
      className,
      grades,
      gpa,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
