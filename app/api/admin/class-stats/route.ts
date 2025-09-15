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
    const className = row.classes?.name || "ไม่ระบุ";
    stats[className] = (stats[className] || 0) + 1;
  });

  // ✅ sort className เช่น "ม.1/1", "ม.1/2", ..., "ม.3/3"
  const result = Object.entries(stats)
    .map(([name, count]) => ({
      className: name,
      studentCount: count,
    }))
    .sort((a, b) => {
      const regex = /ม\.(\d+)\/(\d+)/; // จับ "ม.x/y"
      const aMatch = a.className.match(regex);
      const bMatch = b.className.match(regex);

      if (aMatch && bMatch) {
        const aGrade = parseInt(aMatch[1], 10);
        const aRoom = parseInt(aMatch[2], 10);
        const bGrade = parseInt(bMatch[1], 10);
        const bRoom = parseInt(bMatch[2], 10);

        if (aGrade === bGrade) return aRoom - bRoom;
        return aGrade - bGrade;
      }

      return a.className.localeCompare(b.className, "th");
    });

  return NextResponse.json(result);
}
