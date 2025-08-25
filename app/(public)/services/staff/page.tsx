// app/(public)/services/staff/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, BookOpen } from "lucide-react";

export const revalidate = 0;

/** แถวจาก view (อาจมี subject เป็น null ถ้าครูยังไม่ได้มอบหมายวิชา) */
type Row = {
  teacher_id: string;
  first_name: string | null;
  last_name: string | null;
  subject_id: string | null;
  subject_name: string | null;
};

export default async function StaffPage() {
  const supabase = await createSupabaseServerClient();

  // อ่านจาก view เดียว ครอบคลุมครูทุกคน + วิชาที่สอน (ถ้ามี)
  const { data, error } = await supabase
    .from("teacher_subjects_public")
    .select("teacher_id, first_name, last_name, subject_id, subject_name")
    .order("first_name", { ascending: true });

  if (error) {
    return (
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-red-600">
          ไม่สามารถดึงข้อมูลอาจารย์ได้: {error.message}
        </h1>
      </div>
    );
  }

  const rows: Row[] = data ?? [];

  // group ตามครู
  const byTeacher = new Map<
    string,
    { firstName: string; lastName: string; subjects: { id: string; name: string }[] }
  >();

  for (const r of rows) {
    const key = r.teacher_id;
    if (!byTeacher.has(key)) {
      byTeacher.set(key, {
        firstName: r.first_name ?? "",
        lastName: r.last_name ?? "",
        subjects: [],
      });
    }
    if (r.subject_id && r.subject_name) {
      byTeacher.get(key)!.subjects.push({ id: r.subject_id, name: r.subject_name });
    }
  }

  const teachers = Array.from(byTeacher.entries()).map(([id, v]) => ({
    id,
    fullName: `${v.firstName} ${v.lastName}`.trim() || "ไม่ระบุชื่อ",
    subjects: v.subjects,
  }));

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
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {teachers.map((t) => (
            <article
              key={t.id}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.fullName}
                </h3>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="h-4 w-4" />
                    <span>วิชาที่สอน</span>
                    <span className="text-gray-400">({t.subjects.length})</span>
                  </div>

                  {t.subjects.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      ยังไม่ระบุรายวิชา
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {t.subjects.map((s) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}
