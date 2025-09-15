import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './lib/supabase/middleware';
import { Role } from './lib/types';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  const { pathname } = request.nextUrl;
  const publicRoutes = [
    '/', '/signin', '/signup', '/about', '/contact',
    '/services', '/services/courses', '/services/staff', '/services/class-students'
  ];
  const isPublicRoute = publicRoutes.includes(pathname);

  // ไม่ login และพยายามเข้า protected → redirect ไป signin
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // ถ้า login แล้ว → ตรวจ role
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<{ role: Role }>();

    if (!profile) return response;

    const userRole = profile.role;

    // กำหนดหน้าแรกตาม role
    let roleHomePage = `/${userRole}`;
    if (userRole === 'admin') {
      roleHomePage = '/admin/dashboard';
    }

    // ถ้า login แล้วแต่เข้า /signin หรือ /signup → redirect ไป home ของ role
    if (pathname === '/signin' || pathname === '/signup') {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }

    // ป้องกันเข้า role อื่นที่ไม่ใช่ของตัวเอง
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }
    if (pathname.startsWith('/teacher') && userRole !== 'teacher') {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }
    if (pathname.startsWith('/student') && userRole !== 'student') {
      return NextResponse.redirect(new URL(roleHomePage, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/auth-code-error|api/).*)',
  ],
};
