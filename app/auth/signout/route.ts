import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  
  // This will invalidate the user's session
  await supabase.auth.signOut();
  
  // Redirect to the home page after signing out
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  });
}