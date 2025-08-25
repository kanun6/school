import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { Role } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (name) => cookieStore.get(name)?.value } });
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single<{ role: Role }>();
      const userRole = profile?.role || 'student';
      return NextResponse.redirect(`${origin}/${userRole}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}