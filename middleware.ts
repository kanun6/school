import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Role } from './lib/types';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options) => {
          request.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options) => {
          request.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const publicRoutes = ['/', '/signin', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If user is not logged in and trying to access a protected route, redirect to signin
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // If user is logged in, handle redirects and protection
  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single<{ role: Role }>();

    // If profile is not found yet, let them pass for now. The trigger should create it.
    if (!profile) {
      return NextResponse.next();
    }

    const userRole = profile.role;
    const roleHomePage = `/${userRole}`;

    // If user is on a public route (like /, /signin), redirect them to their role's home page
    if (isPublicRoute) {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }

    // Role-based access control for protected pages
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }

    if (pathname.startsWith('/teacher') && !['teacher', 'admin'].includes(userRole)) {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }

    // No need to check for /student as all roles can access it in this logic.
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/auth-code-error).*)',
  ],
};
