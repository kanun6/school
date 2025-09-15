import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface StudentClassRow {
  class_id: string | null;
  classes: {
    name: string | null;
  } | null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("student_classes")
    .select("class_id, classes(name)");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json([]);
  }

  const stats: Record<string, number> = {};

  (data as unknown as StudentClassRow[]).forEach((row) => {
    const className = row.classes?.name || "ไม่ระบุ"; // เช่น ม.1/1
    const match = className.match(/ม\.(\d+)/); // ✅ ตัดเอาแค่เลขชั้น
    const gradeName = match ? `ม.${match[1]}` : "ไม่ระบุ";

    stats[gradeName] = (stats[gradeName] || 0) + 1;
  });

  const result = Object.entries(stats)
    .map(([name, count]) => ({
      gradeName: name,
      studentCount: count,
    }))
    .sort((a, b) => {
      const aGrade = parseInt(a.gradeName.replace("ม.", ""), 10);
      const bGrade = parseInt(b.gradeName.replace("ม.", ""), 10);
      return aGrade - bGrade;
    });

  return NextResponse.json(result);
}
