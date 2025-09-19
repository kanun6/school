// app/api/student_classes/assign/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const { userId, classId } = body;
  if (!userId || !classId) {
    return NextResponse.json(
      { error: "userId และ classId ต้องไม่ว่าง" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("student_classes").insert({
    student_id: userId, // ใช้ userId จาก profiles.id
    class_id: classId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
