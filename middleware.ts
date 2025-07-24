import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Role } from './lib/types';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ** THE FIX **
  // Explicitly skip any paths that are for API routes, static files, or images.
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => request.cookies.get(name)?.value, set: (name: string, value: string, options) => { request.cookies.set({ name, value, ...options }); }, remove: (name: string, options) => { request.cookies.set({ name, value: '', ...options }); }, }, }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const publicRoutes = ['/', '/signin', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If not logged in and trying to access a protected route, redirect to signin
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // If logged in, handle redirects
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: Role }>();
    if (!profile) {
      // This can happen briefly after signup before the trigger runs.
      // Let's allow access but the page might show an error until profile is created.
      return NextResponse.next();
    }

    const userRole = profile.role;
    const roleHomePage = `/${userRole}`;

    // If on a public route, redirect to their role's homepage
    if (isPublicRoute) {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }

    // If trying to access a page for another role, redirect to their own homepage
    if (pathname.startsWith('/admin') && userRole !== 'admin') return NextResponse.redirect(new URL(roleHomePage, request.url));
    if (pathname.startsWith('/teacher') && userRole !== 'teacher') return NextResponse.redirect(new URL(roleHomePage, request.url));
    if (pathname.startsWith('/student') && userRole !== 'student') return NextResponse.redirect(new URL(roleHomePage, request.url));
  }

  return NextResponse.next();
}

// We can remove the matcher config as the logic is now handled inside the middleware itself.
// export const config = {
//   matcher: [ ... ],
// };
