import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface UserRow {
  id: string;
  updated_at: string | null;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) return NextResponse.json([]);

  const logins: Record<string, number> = {};

  (data as UserRow[]).forEach((user) => {
    if (user.updated_at) {
      const date = new Date(user.updated_at).toISOString().split("T")[0]; // yyyy-mm-dd
      logins[date] = (logins[date] || 0) + 1;
    }
  });

  const result = Object.entries(logins)
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json(result);
}
