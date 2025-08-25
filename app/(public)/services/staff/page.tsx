import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, BookOpen } from "lucide-react";

export const revalidate = 0;

/** ---------- Strict types ---------- */
type Teacher = {
  id: string;
  first_name: string;
  last_name: string;
};

type TeacherSubject = {
  teacher_id: string;
  subject_id: string;
};

type Subject = {
  id: string;
  name: string;
  // code ไม่มีใน schema ปัจจุบัน จึงไม่ใช้
};

export default async function StaffPage() {
  const supabase = await createSupabaseServerClient();

  // 1) ดึงอาจารย์ทั้งหมด
  const { data: teacherRows, error: teacherErr } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("role", "teacher")
    .order("first_name", { ascending: true });

  if (teacherErr) {
    return (
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-red-600">
          ไม่สามารถดึงข้อมูลอาจารย์ได้: {teacherErr.message}
        </h1>
      </div>
    );
  }

  const teachers: Teacher[] = (teacherRows ?? []) as Teacher[];
  if (teachers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <section className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              บุคลากร (อาจารย์) และวิชาที่สอน
            </h1>
          </div>
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500 dark:text-gray-400">
            ยังไม่มีข้อมูลอาจารย์ในระบบ
          </div>
        </section>
      </div>
    );
  }

  // 2) ดึง mapping teacher_subjects
  const teacherIds = teachers.map((t) => t.id);
  const { data: linkRows, error: linkErr } = await supabase
    .from("teacher_subjects")
    .select("teacher_id, subject_id")
    .in("teacher_id", teacherIds);

  const links: TeacherSubject[] = (linkRows ?? []) as TeacherSubject[];

  // 3) ดึง subjects เฉพาะที่เกี่ยวข้อง (เลือกเฉพาะ id, name)
  const subjectIds = Array.from(new Set(links.map((l) => l.subject_id)));
  let subjects: Subject[] = [];
  let subjectsErrMsg: string | null = null;

  if (subjectIds.length > 0) {
    const { data: subjectRows, error: subjectsErr } = await supabase
      .from("subjects")
      .select("id, name")
      .in("id", subjectIds)
      .order("name", { ascending: true });

    if (subjectsErr) subjectsErrMsg = subjectsErr.message;
    else subjects = (subjectRows ?? []) as Subject[];
  }

  // 4) ประกอบข้อมูล: teacherId -> Subject[]
  const subjectById = new Map<string, Subject>(subjects.map((s) => [s.id, s]));
  const subjectsOfTeacher = new Map<string, Subject[]>();
  for (const l of links) {
    const sub = subjectById.get(l.subject_id);
    if (!sub) continue;
    const arr = subjectsOfTeacher.get(l.teacher_id) ?? [];
    arr.push(sub);
    subjectsOfTeacher.set(l.teacher_id, arr);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="container mx-auto px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              บุคลากร (อาจารย์) และวิชาที่สอน
            </h1>
          </div>
          {linkErr && (
            <p className="mt-2 text-sm text-amber-600">
              * หมายเหตุ: อ่านตารางการมอบหมายวิชาไม่ได้ ({linkErr.message})
            </p>
          )}
          {subjectsErrMsg && (
            <p className="mt-1 text-sm text-amber-600">
              * หมายเหตุ: อ่านตารางวิชาไม่ได้ ({subjectsErrMsg})
            </p>
          )}
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((t) => {
            const fullName = `${t.first_name} ${t.last_name}`.trim();
            const subs = subjectsOfTeacher.get(t.id) ?? [];

            return (
              <article
                key={t.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {fullName}
                  </h3>

                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <BookOpen className="h-4 w-4" />
                      <span>วิชาที่สอน</span>
                      <span className="text-gray-400">({subs.length})</span>
                    </div>

                    {subs.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        ยังไม่ระบุรายวิชา
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {subs.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1"
                          >
                            {s.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
