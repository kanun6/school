// app/api/student/grades/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type MaybeArray<T> = T | T[] | null | undefined;
const pickOne = <T,>(v: MaybeArray<T>): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

interface SubjectRow {
  name: string;
  grades: { score: number | null; grade: string | null }[];
}
interface StudentClassRow {
  class: MaybeArray<{ name: string }>;
}

export async function GET(_request: Request) {
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

  try {
    // 1) ห้องของนักเรียน (เอาแค่ 1 แถวให้แน่นอน)
    const { data: scRaw, error: scErr } = await supabase
      .from('student_classes')
      .select('class:classes(name)')
      .eq('student_id', user.id)
      .limit(1)
      .single();

    if (scErr) throw scErr;

    const className =
      pickOne((scRaw as StudentClassRow).class)?.name ?? '';
    if (!className) {
      return NextResponse.json({ error: 'คุณยังไม่ถูกกำหนดห้องเรียน' }, { status: 404 });
    }

    // 2) ชื่อ-สกุลนักเรียน
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();
    if (pErr) throw pErr;
    const studentName = `${profile.first_name} ${profile.last_name}`;

    // 3) รายวิชา + เกรดของนักเรียนคนนี้
    const { data: subjects, error: subErr } = await supabase
      .from('subjects')
      .select(`
        name,
        grades ( score, grade )
      `)
      .eq('grades.student_id', user.id);
    if (subErr) throw subErr;

    const grades = (subjects as SubjectRow[]).map((s) => {
      const g = s.grades?.[0];
      return {
        subject_name: s.name,
        score: g?.score ?? null,
        grade: g?.grade ?? null,
      };
    });

    // 4) คำนวณ GPA
    const graded = grades.filter((g) => g.grade !== null);
    const gpa =
      graded.length > 0
        ? (
            graded.reduce((sum, g) => sum + Number(g.grade), 0) / graded.length
          ).toFixed(2)
        : 'N/A';

    return NextResponse.json({ studentName, className, grades, gpa });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
