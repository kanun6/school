// app/api/profiles/upsert/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as Body;

  // อนุญาตเฉพาะฟิลด์ที่ผู้ใช้แก้เองได้
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
    updated_at: new Date().toISOString(),
  };

  // upsert แถวของตัวเอง (ไม่ต้องส่ง userId)
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...updates }, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
