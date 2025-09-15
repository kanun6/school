import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IssueStatus = "ใหม่" | "กำลังดำเนินการ" | "แก้ไขแล้ว";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("issues")
    .select("status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats: Record<IssueStatus, number> = {
    ใหม่: 0,
    กำลังดำเนินการ: 0,
    แก้ไขแล้ว: 0,
  };

  data?.forEach((row: { status: IssueStatus }) => {
    stats[row.status] = (stats[row.status] ?? 0) + 1;
  });

  return NextResponse.json(stats);
}
