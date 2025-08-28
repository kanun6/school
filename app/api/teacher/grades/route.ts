// app/api/teacher/grades/route.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* ---------- Utility ---------- */
function calculateGradeServer(total: number | null | undefined): string | null {
  if (total == null) return null;
  const t = Number(total);
  if (Number.isNaN(t)) return null;
  if (t >= 80) return "4";
  if (t >= 75) return "3.5";
  if (t >= 70) return "3";
  if (t >= 65) return "2.5";
  if (t >= 60) return "2";
  if (t >= 55) return "1.5";
  if (t >= 50) return "1";
  return "0";
}

type MaybeArray<T> = T | T[] | null | undefined;
const pickOne = <T,>(v: MaybeArray<T>): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

/** สร้าง Supabase client จาก NextRequest/NextResponse (อ่าน/เขียนคุกกี้ทาง response) */
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
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}

/* ---------- Types (select mapping) ---------- */
interface ClassInfo { id: string; name: string; grade: number; room: number; }
interface TeacherSubjectRow { subject_id: string; subject: MaybeArray<{ name: string }>; }
interface StudentProfile { id: string; first_name: string; last_name: string; }
interface StudentClassRow { student: MaybeArray<StudentProfile>; }
interface ComponentRow { id: string; name: string; max_score: number; position: number; }

/* =======================================================================
 * GET
 * ======================================================================= */
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  const supabase = supabaseFromReqRes(request, response);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: response.headers });
  }

  const params = request.nextUrl.searchParams;
  const getClasses = params.get("getClasses");
  const classId = params.get("classId");

  // หา subject ที่ครูสอน
  const { data: teacherSubjectRaw, error: tsError } = await supabase
    .from("teacher_subjects")
    .select("subject_id, subject:subjects(name)")
    .eq("teacher_id", user.id)
    .single();
  if (tsError || !teacherSubjectRaw) {
    return NextResponse.json({ error: "คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด" }, { status: 400, headers: response.headers });
  }
  const subjectId = (teacherSubjectRaw as TeacherSubjectRow).subject_id;
  const subjectName = pickOne((teacherSubjectRaw as TeacherSubjectRow).subject)?.name ?? "";

  /* ---------- รายชื่อห้อง ---------- */
  if (getClasses) {
    const { data: taughtClassesRaw, error: tcError } = await supabase
      .from("schedule_slots")
      .select("class:classes(id, name, grade, room)")
      .eq("teacher_id", user.id);
    if (tcError) throw tcError;

    const classes: ClassInfo[] = (taughtClassesRaw ?? [])
      .map((row) => pickOne<ClassInfo>((row as { class: MaybeArray<ClassInfo> }).class))
      .filter((c): c is ClassInfo => !!c);

    const unique = Array.from(new Map(classes.map((c) => [c.id, c])).values()).sort(
      (a, b) => (a.grade === b.grade ? a.room - b.room : a.grade - b.grade)
    );

    return NextResponse.json({ classes: unique, subjectName }, { headers: response.headers });
  }

  /* ---------- นักเรียน + scheme + คะแนน ---------- */
  if (classId) {
    const { data: studentsInClassRaw, error: scError } = await supabase
      .from("student_classes")
      .select("student:profiles(id, first_name, last_name)")
      .eq("class_id", classId);
    if (scError) throw scError;

    const students: StudentProfile[] = (studentsInClassRaw ?? [])
      .map((row) => pickOne<StudentProfile>((row as StudentClassRow).student))
      .filter((s): s is StudentProfile => !!s);

    const { data: schemeRow, error: schemeErr } = await supabase
      .from("grading_scheme")
      .select("id")
      .eq("class_id", classId)
      .eq("subject_id", subjectId)
      .eq("is_active", true)
      .maybeSingle();
    if (schemeErr) throw schemeErr;

    const schemeId: string | null = schemeRow?.id ?? null;

    let components: ComponentRow[] = [];
    if (schemeId) {
      const { data: comps, error: compErr } = await supabase
        .from("grading_component")
        .select("id, name, max_score, position")
        .eq("scheme_id", schemeId)
        .order("position", { ascending: true });
      if (compErr) throw compErr;
      components = comps ?? [];
    }

    const scoresMap: Record<string, Record<string, number | null>> = {};
    if (schemeId && students.length > 0 && components.length > 0) {
      const { data: scs, error: scsErr } = await supabase
        .from("student_component_scores")
        .select("student_id, component_id, score")
        .in("student_id", students.map((s) => s.id))
        .in("component_id", components.map((c) => c.id));
      if (scsErr) throw scsErr;

      for (const r of scs ?? []) {
        if (!scoresMap[r.student_id]) scoresMap[r.student_id] = {};
        scoresMap[r.student_id][r.component_id] = r.score;
      }
    }

    const studentsWithScores = students.map((s) => {
      const cs = scoresMap[s.id] || {};
      const total = (components ?? []).reduce((sum, c) => sum + (cs[c.id] ?? 0), 0);
      return {
        id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        componentScores: cs,
        total,
        grade: calculateGradeServer(total),
      };
    });

    return NextResponse.json(
      {
        scheme: schemeId
          ? {
              id: schemeId,
              components: components.map((c) => ({
                id: c.id,
                name: c.name,
                max: c.max_score,
                position: c.position,
              })),
            }
          : null,
        students: studentsWithScores,
        subjectName,
      },
      { headers: response.headers }
    );
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: response.headers });
}

/* =======================================================================
 * POST  (บันทึก scheme + คะแนน)
 * ======================================================================= */
export async function POST(request: NextRequest) {
  const response = new NextResponse();
  const supabase = supabaseFromReqRes(request, response);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: response.headers });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: response.headers });
  }

  const {
    classId,
    scheme,
    grades,
  }: {
    classId?: string;
    scheme?: { id?: string; components: { id?: string; name: string; max: number; position?: number }[] };
    grades?: { studentId: string; components: { itemId: string; score: number | null }[] }[];
  } = body;

  if (!classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400, headers: response.headers });
  }

  // subject ของครู
  const { data: tsub, error: tsErr } = await supabase
    .from("teacher_subjects")
    .select("subject_id")
    .eq("teacher_id", user.id)
    .single();
  if (tsErr || !tsub) {
    return NextResponse.json({ error: "คุณยังไม่ได้รับมอบหมายให้สอนวิชาใด" }, { status: 400, headers: response.headers });
  }
  const subjectId: string = (tsub as { subject_id: string }).subject_id;

  // ตรวจว่านักเรียนอยู่ในห้องจริง
  const { data: studsRaw, error: scError } = await supabase
    .from("student_classes")
    .select("student_id")
    .eq("class_id", classId);
  if (scError) {
    return NextResponse.json({ error: scError.message }, { status: 500, headers: response.headers });
  }
  const allowed = new Set((studsRaw ?? []).map((r: { student_id: string }) => r.student_id));
  const invalid = (grades ?? []).find((g) => !allowed.has(g.studentId));
  if (invalid) {
    return NextResponse.json({ error: "พบรหัสนักเรียนที่ไม่ได้อยู่ในห้องนี้" }, { status: 400, headers: response.headers });
  }

  /* 1) หา/สร้าง active scheme */
  let schemeId: string;
  const { data: existingScheme, error: exErr } = await supabase
    .from("grading_scheme")
    .select("id")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("is_active", true)
    .maybeSingle();
  if (exErr) {
    return NextResponse.json({ error: exErr.message }, { status: 400, headers: response.headers });
  }

  if (!existingScheme?.id) {
    const { data: newScheme, error: crErr } = await supabase
      .from("grading_scheme")
      .insert({ class_id: classId, subject_id: subjectId, teacher_id: user.id, is_active: true })
      .select("id")
      .single();
    if (crErr) {
      return NextResponse.json({ error: crErr.message }, { status: 400, headers: response.headers });
    }
    schemeId = newScheme.id;
  } else {
    schemeId = existingScheme.id;
  }

  /* 2) ซิงก์ components */
  if (!scheme?.components || scheme.components.length === 0) {
    return NextResponse.json({ error: "scheme.components is required" }, { status: 400, headers: response.headers });
  }

  // เก็บ id เดิมก่อนซิงก์ (ไว้หาว่าอะไรคือของใหม่จริง ๆ)
  const { data: beforeComps, error: beforeErr } = await supabase
    .from("grading_component")
    .select("id, name, max_score, position")
    .eq("scheme_id", schemeId);
  if (beforeErr) {
    return NextResponse.json({ error: beforeErr.message }, { status: 400, headers: response.headers });
  }
  const beforeIds = new Set((beforeComps ?? []).map((c) => c.id));

  // ลบของที่ถูกเอาออก
  const incoming = scheme.components;
  const incomingIds = new Set(incoming.filter((c) => c.id).map((c) => c.id as string));
  const toDelete = (beforeComps ?? [])
    .map((c) => c.id)
    .filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    const { error: delErr } = await supabase.from("grading_component").delete().in("id", toDelete);
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400, headers: response.headers });
    }
  }

  // เตรียม insert/update
  const toInsert = incoming
    .filter((c) => !c.id)
    .map((c, idx) => ({
      scheme_id: schemeId,
      name: c.name,
      max_score: Math.max(1, Math.floor(c.max)),
      position: c.position ?? idx,
    }));
  const toUpdate = incoming
    .filter((c) => !!c.id)
    .map((c, idx) => ({
      id: c.id as string,
      name: c.name,
      max_score: Math.max(1, Math.floor(c.max)),
      position: c.position ?? idx,
    }));

  // เก็บ temp-id ที่โผล่ใน grades (เรียงตามลำดับที่พบ)
  const tempIdsEncountered: string[] = [];
  const tempSeen = new Set<string>();
  for (const g of grades ?? []) {
    for (const comp of g.components ?? []) {
      if (comp.itemId.startsWith("temp-") && !tempSeen.has(comp.itemId)) {
        tempSeen.add(comp.itemId);
        tempIdsEncountered.push(comp.itemId);
      }
    }
  }

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase.from("grading_component").insert(toInsert);
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400, headers: response.headers });
    }
  }
  for (const r of toUpdate) {
    const { error: updErr } = await supabase
      .from("grading_component")
      .update({ name: r.name, max_score: r.max_score, position: r.position })
      .eq("id", r.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 400, headers: response.headers });
    }
  }

  // ดึงรายการหลังซิงก์
  const { data: compsAfter, error: afterErr } = await supabase
    .from("grading_component")
    .select("id, name, max_score, position")
    .eq("scheme_id", schemeId)
    .order("position", { ascending: true });
  if (afterErr) {
    return NextResponse.json({ error: afterErr.message }, { status: 400, headers: response.headers });
  }

  // newRealIds = id ที่ก่อนหน้าไม่มี (อันที่เพิ่งสร้างจริง ๆ)
  const newRealIds = (compsAfter ?? [])
    .filter((c) => !beforeIds.has(c.id))
    .map((c) => c.id);

  // mapping ชั้นที่ 1: tempIdsEncountered[i] -> newRealIds[i]
  const idMap: Record<string, string> = {};
  const pairCount = Math.min(tempIdsEncountered.length, newRealIds.length);
  for (let i = 0; i < pairCount; i += 1) {
    idMap[tempIdsEncountered[i]] = newRealIds[i];
  }

  // mapping ของเดิม
  for (const inc of incoming) {
    if (inc.id) idMap[inc.id] = inc.id;
  }

  // mapping ชั้นที่ 2 (สำรอง): เทียบ triple (name, position, max)
  const tripleIndex = new Map<string, string[]>();
  for (const c of compsAfter ?? []) {
    const key = `${c.name}__${c.position}__${c.max_score}`;
    const arr = tripleIndex.get(key) ?? [];
    arr.push(c.id);
    tripleIndex.set(key, arr);
  }
  incoming.forEach((inc, idx) => {
    if (inc.id) return;
    const key = `${inc.name}__${inc.position ?? idx}__${Math.max(1, Math.floor(inc.max))}`;
    if (!tempIdsEncountered[idx]) return; // ไม่มี temp สำหรับตำแหน่งนี้
    if (!idMap[tempIdsEncountered[idx]]) {
      const arr = tripleIndex.get(key);
      if (arr && arr.length > 0) {
        idMap[tempIdsEncountered[idx]] = arr.shift() as string;
        tripleIndex.set(key, arr);
      }
    }
  });

  /* 3) บันทึกคะแนนรายช่อง (ป้องกัน temp- หลุด) */
  for (const g of grades ?? []) {
    for (const comp of g.components ?? []) {
      const mapped = idMap[comp.itemId];
      const realId = mapped ?? comp.itemId;

      if (realId.startsWith("temp-")) {
        return NextResponse.json(
          {
            error:
              "ไม่สามารถจับคู่ช่องคะแนนใหม่กับรหัสจริงได้ กรุณากดบันทึกอีกครั้งหรือรีเฟรชหน้า (temp-id ค้างอยู่)",
          },
          { status: 400, headers: response.headers }
        );
      }

      const score = comp.score == null ? null : Math.max(0, Math.floor(Number(comp.score)));
      const { error: scoreErr } = await supabase
        .from("student_component_scores")
        .upsert(
          { student_id: g.studentId, component_id: realId, score },
          { onConflict: "student_id,component_id" }
        );
      if (scoreErr) {
        return NextResponse.json({ error: scoreErr.message }, { status: 400, headers: response.headers });
      }
    }
  }

  /* 4) รวมคะแนนและ upsert grades */
  const studentIds = (grades ?? []).map((g) => g.studentId);
  if (studentIds.length > 0 && (compsAfter ?? []).length > 0) {
    const { data: scsAll, error: scsAllErr } = await supabase
      .from("student_component_scores")
      .select("student_id, component_id, score")
      .in("student_id", studentIds)
      .in("component_id", (compsAfter ?? []).map((c) => c.id));
    if (scsAllErr) {
      return NextResponse.json({ error: scsAllErr.message }, { status: 400, headers: response.headers });
    }

    const sumByStu: Record<string, number> = {};
    for (const r of scsAll ?? []) {
      sumByStu[r.student_id] = (sumByStu[r.student_id] ?? 0) + (r.score ?? 0);
    }

    const rows = Object.entries(sumByStu).map(([stuId, tot]) => ({
      student_id: stuId,
      subject_id: subjectId,
      class_id: classId,
      total: Math.min(100, tot),
      final_grade: calculateGradeServer(Math.min(100, tot)),
      teacher_id: user.id,
    }));

    if (rows.length > 0) {
      const { error: grdErr } = await supabase
        .from("grades")
        .upsert(rows, { onConflict: "student_id,subject_id,class_id" });
      if (grdErr) {
        return NextResponse.json({ error: grdErr.message }, { status: 400, headers: response.headers });
      }
    }
  }

  return NextResponse.json({ ok: true, schemeId }, { headers: response.headers });
}
