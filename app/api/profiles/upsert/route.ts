// app/api/profiles/upsert/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  first_name?: string | null;
  last_name?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  birthday?: string | null;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  position?: string | null;
  class_id?: string | null;
  student_id?: string | null;
  role?: string | null; // ✅ เพิ่ม role
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;

  // ✅ อัปเดต profiles
  const updates: Record<string, unknown> = {
    first_name: body.first_name ?? null,
    last_name: body.last_name ?? null,
    profile_image_url: body.profile_image_url ?? null,
    bio: body.bio ?? null,
    birthday: body.birthday ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    department: body.department ?? null,
    position: body.position ?? null,
    student_id: body.student_id ?? null,
    role: body.role ?? "student", // ✅ fallback ถ้าไม่ได้ส่งมา
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...updates }, { onConflict: "id" });

  if (profileError) {
    console.error("❌ Profile upsert error:", profileError.message);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // ✅ ถ้าเป็น student + มี class_id → บันทึก student_classes
  if ((body.role ?? "student") === "student" && body.class_id) {
    const { error: scError } = await supabase
      .from("student_classes")
      .upsert(
        {
          student_id: user.id,
          class_id: body.class_id,
        },
        { onConflict: "student_id" }
      );

    if (scError) {
      console.error("❌ Student_classes upsert error:", scError.message);
      return NextResponse.json({ error: scError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
