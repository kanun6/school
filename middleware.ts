import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './lib/supabase/middleware';
import { Role } from './lib/types';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const publicRoutes = ['/', '/signin', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If not logged in and trying to access a protected route, redirect to signin
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // If logged in, handle redirects
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: Role }>();
    if (!profile) return response;

    const userRole = profile.role;
    const roleHomePage = `/${userRole}`;

    // ** THE FIX **
    // If user is on signin or signup page, redirect them to their role's home page.
    // They are allowed to visit the home page ('/').
    if (pathname === '/signin' || pathname === '/signup') {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }

    // If trying to access a page for another role, redirect to their own homepage
    if (pathname.startsWith('/admin') && userRole !== 'admin') return NextResponse.redirect(new URL(roleHomePage, request.url));
    if (pathname.startsWith('/teacher') && userRole !== 'teacher') return NextResponse.redirect(new URL(roleHomePage, request.url));
    if (pathname.startsWith('/student') && userRole !== 'student') return NextResponse.redirect(new URL(roleHomePage, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/auth-code-error|api/).*)',
  ],
};
