import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Users, GraduationCap } from "lucide-react";

export const revalidate = 0;

type Row = { id: string; name: string; total_students: number };

export default async function ClassStudentsPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("class_student_counts")
    .select("id, name, total_students")
    .order("name");

  if (error) {
    return (
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-red-600">
          ไม่สามารถดึงข้อมูลห้องเรียนได้: {error.message}
        </h1>
      </div>
    );
  }

  const rows: Row[] = data ?? [];
  const totalStudents = rows.reduce((acc, r) => acc + (r.total_students ?? 0), 0);

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
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            ยอดนักเรียนทั้งโรงเรียน:{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {totalStudents} คน
            </span>
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-gray-500 dark:text-gray-400">
            ยังไม่มีข้อมูลห้องเรียนในระบบ
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((c) => (
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
                      {c.total_students} คน
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
