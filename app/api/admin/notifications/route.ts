import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// ระบุชนิดคืนค่าเป็น Promise<boolean>
async function isAdmin(): Promise<boolean> {
  const cookieStore = cookies(); // ReadonlyRequestCookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ดึงค่าคุกกี้จาก cookieStore แล้วคืนค่า string หรือ undefined
        get: (name: string) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

export async function GET() {
  // ตรวจสอบสิทธิ์แอดมินก่อน
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // สร้าง supabase client ด้วย cookieStore ที่ได้จาก cookies()
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
      },
    },
  );

  try {
    const { count, error } = await supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ใหม่');
    if (error) throw error;
    return NextResponse.json({ count: count ?? 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
