// app/api/SignUpClasses/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("classes")
    .select("id, name")
    .order("grade", { ascending: true })
    .order("room", { ascending: true });

  if (error) {
    console.error("Error fetching classes:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
