import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, GraduationCap } from "lucide-react";

export const revalidate = 0;

/** ---------- Strict types ---------- */
type ClassRow = {
  id: string;
  name: string;
};

type StudentClassRow = {
  class_id: string;
  student_id: string;
};

export default async function ClassStudentsPage() {
  const supabase = createSupabaseServerClient();

  /** 1) ดึงรายการห้องทั้งหมด */
  const { data: classesData, error: classesErr } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", { ascending: true });

  if (classesErr) {
    return (
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-red-600">
          ไม่สามารถดึงข้อมูลห้องเรียนได้: {classesErr.message}
        </h1>
      </div>
    );
  }

  const classes: ClassRow[] = (classesData ?? []) as ClassRow[];

  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <section className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              จำนวนนักเรียนแต่ละห้อง
            </h1>
          </div>
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500 dark:text-gray-400">
            ยังไม่มีข้อมูลห้องเรียนในระบบ
          </div>
        </section>
      </div>
    );
  }

  /** 2) ดึง mapping นักเรียน↔ห้อง เฉพาะห้องที่มีในระบบ */
  const classIds = classes.map((c) => c.id);
  const { data: mapData, error: mapsErr } = await supabase
    .from("student_classes")
    .select("class_id, student_id")
    .in("class_id", classIds);

  const mappings: StudentClassRow[] = (mapData ?? []) as StudentClassRow[];

  /** 3) สรุปจำนวนต่อห้อง */
  const countByClass = new Map<string, number>();
  for (const id of classIds) countByClass.set(id, 0);
  for (const m of mappings) {
    countByClass.set(m.class_id, (countByClass.get(m.class_id) ?? 0) + 1);
  }

  const totalStudents = Array.from(countByClass.values()).reduce(
    (acc, n) => acc + n,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <section className="container mx-auto px-6 py-10">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              จำนวนนักเรียนแต่ละห้อง
            </h1>
          </div>
          {mapsErr && (
            <p className="mt-2 text-sm text-amber-600">
              * หมายเหตุ: อ่านตารางการจัดนักเรียนเข้าห้องไม่ได้ (
              {mapsErr.message})
            </p>
          )}
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            ยอดนักเรียนทั้งโรงเรียน:{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {totalStudents} คน
            </span>
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classes.map((c) => {
            const count = countByClass.get(c.id) ?? 0;
            return (
              <article
                key={c.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {c.name}
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>จำนวนนักเรียน</span>
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {count} คน
                    </span>
                  </div>
                  {/* ถ้าภายหลังอยากลิงก์ไปดูรายชื่อนักเรียนของห้องนี้
                      สามารถเพิ่มปุ่ม/ลิงก์ไปหน้า /classes/[id] ได้ */}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
