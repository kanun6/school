// app/api/student/grades/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type MaybeArray<T> = T | T[] | null | undefined;
const pickOne = <T,>(v: MaybeArray<T>): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

function supabaseFromReqRes(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options?: CookieOptions) {
          res.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}

/* ---------- Select mapping types ---------- */
interface ClassRow { id: string; name: string; grade: number | null; room: number | null; }
interface StudentClassRow { class: MaybeArray<ClassRow>; }
interface ProfileRow { first_name: string; last_name: string; }

interface GradeRow {
  subject_id: string;
  total: number | null;
  final_grade: string | null;
  subject: MaybeArray<{ name: string }>;
}

interface SchemeRow { id: string; subject_id: string; }
interface ComponentRow { id: string; scheme_id: string; name: string; max_score: number; position: number; }
interface ScoreRow { student_id: string; component_id: string; score: number | null; }

export async function GET(request: NextRequest) {
  const response = new NextResponse();
  const supabase = supabaseFromReqRes(request, response);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: response.headers });
  }

  try {
    // 1) ห้องของนักเรียน (เอา class_id มาใช้ด้วย)
    const { data: scRaw, error: scErr } = await supabase
      .from('student_classes')
      .select('class:classes(id, name, grade, room)')
      .eq('student_id', user.id)
      .limit(1)
      .single();
    if (scErr) throw scErr;

    const cls = pickOne((scRaw as StudentClassRow).class);
    const classId = cls?.id ?? '';
    const className =
      cls?.name ?? (cls?.grade && cls?.room ? `ม.${cls.grade}/${cls.room}` : '');

    if (!classId) {
      return NextResponse.json(
        { error: 'คุณยังไม่ถูกกำหนดห้องเรียน' },
        { status: 404, headers: response.headers }
      );
    }

    // 2) ชื่อ-สกุล
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();
    if (pErr) throw pErr;
    const studentName = `${(profile as ProfileRow).first_name} ${(profile as ProfileRow).last_name}`;

    // 3) ดึงผลจากตาราง grades + ชื่อวิชา (รวม subject_id ด้วย)
    const { data: gradeRows, error: gErr } = await supabase
      .from('grades')
      .select('subject_id, total, final_grade, subject:subjects(name)')
      .eq('student_id', user.id)
      .order('subject_id', { ascending: true });
    if (gErr) throw gErr;

    const gradesBase = (gradeRows ?? []) as GradeRow[];
    const subjectIds = Array.from(new Set(gradesBase.map(r => r.subject_id))).filter(Boolean);

    // 4) หารายการ active scheme ทั้งหมดของห้องนี้สำหรับ subjectIds
    const schemeMap = new Map<string, string>(); // subject_id -> scheme_id
    if (subjectIds.length > 0) {
      const { data: schemes, error: sErr } = await supabase
        .from('grading_scheme')
        .select('id, subject_id')
        .eq('class_id', classId)
        .eq('is_active', true)
        .in('subject_id', subjectIds);
      if (sErr) throw sErr;

      for (const s of (schemes ?? []) as SchemeRow[]) {
        schemeMap.set(s.subject_id, s.id);
      }
    }

    // 5) ดึง components ทั้งหมดของทุก scheme ที่เจอ
    const schemeIds = Array.from(new Set(Array.from(schemeMap.values())));
    const allComponents: ComponentRow[] = [];
    if (schemeIds.length > 0) {
      const { data: comps, error: cErr } = await supabase
        .from('grading_component')
        .select('id, scheme_id, name, max_score, position')
        .in('scheme_id', schemeIds)
        .order('position', { ascending: true });
      if (cErr) throw cErr;
      allComponents.push(...((comps ?? []) as ComponentRow[]));
    }

    // 6) ดึงคะแนนราย component ของนักเรียนสำหรับ component_ids ทั้งหมด
    const componentIds = allComponents.map(c => c.id);
    const allScores: ScoreRow[] = [];
    if (componentIds.length > 0) {
      const { data: scs, error: scsErr } = await supabase
        .from('student_component_scores')
        .select('student_id, component_id, score')
        .eq('student_id', user.id)
        .in('component_id', componentIds);
      if (scsErr) throw scsErr;
      allScores.push(...((scs ?? []) as ScoreRow[]));
    }

    // index score โดย component_id
    const scoreByComponent = new Map<string, number | null>();
    for (const r of allScores) {
      scoreByComponent.set(r.component_id, r.score);
    }

    // 7) ประกอบข้อมูลผลลัพธ์ต่อวิชา พร้อมรายละเอียดช่อง
    const grades = gradesBase.map((row) => {
      const subjectName = pickOne(row.subject)?.name ?? 'ไม่ทราบชื่อวิชา';
      const schemeId = schemeMap.get(row.subject_id);
      const comps = !schemeId
        ? []
        : allComponents
            .filter(c => c.scheme_id === schemeId)
            .sort((a, b) => a.position - b.position)
            .map(c => ({
              id: c.id,
              name: c.name,
              max: c.max_score,
              score: scoreByComponent.get(c.id) ?? null,
            }));

      return {
        subject_id: row.subject_id,
        subject_name: subjectName,
        score: row.total ?? null,           // รวม ≤ 100
        grade: row.final_grade ?? null,     // เช่น "3.5"
        components: comps,                  // รายละเอียดช่อง
      };
    });

    // 8) คำนวณ GPA
    const graded = grades.filter(g => g.grade !== null);
    const gpa =
      graded.length > 0
        ? (
            graded.reduce((sum, g) => sum + Number(g.grade), 0) / graded.length
          ).toFixed(2)
        : 'N/A';

    return NextResponse.json(
      { studentName, className, grades, gpa },
      { headers: response.headers }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500, headers: response.headers });
  }
}
