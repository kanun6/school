import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './lib/supabase/middleware';
import { Role } from './lib/types';

// ให้ผ่านไฟล์สาธารณะ (จาก public/) ทุกรูปแบบ
const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|webmanifest|map|mp4|webm|avif|heic|woff2?|ttf|otf)$/i;

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // ⛳ ข้าม static ภายใน Next และไฟล์สาธารณะ + โฟลเดอร์ /news/*
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname.startsWith('/news/') ||        // รูปจาก /public/news/*
    PUBLIC_FILE.test(pathname)              // *.jpg *.png *.svg ฯลฯ
  ) {
    return response;
  }

  // เพจสาธารณะ
  const publicRoutes = [
    '/', '/signin', '/signup', '/about', '/contact',
    '/services', '/services/courses', '/services/staff', '/services/class-students'
  ];
  if (publicRoutes.includes(pathname)) {
    return response;
  }

  // ตรวจ session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // ยังไม่ล็อกอิน → ส่งไปหน้า signin
  if (!user) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // ล็อกอินแล้ว ตรวจ role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: Role }>();

  if (!profile) return response;

  const userRole = profile.role;
  const roleHomePage = userRole === 'admin' ? '/admin/dashboard' : `/${userRole}`;

  // กันเข้า /signin /signup หลังล็อกอิน
  if (pathname === '/signin' || pathname === '/signup') {
    return NextResponse.redirect(new URL(roleHomePage, request.url));
  }

  // กันข้ามบทบาท
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL(roleHomePage, request.url));
  }
  if (pathname.startsWith('/teacher') && userRole !== 'teacher') {
    return NextResponse.redirect(new URL(roleHomePage, request.url));
  }
  if (pathname.startsWith('/student') && userRole !== 'student') {
    return NextResponse.redirect(new URL(roleHomePage, request.url));
  }

  return response;
}

// ตัดเส้นทางที่ไม่ควรให้ middleware ทำงานตั้งแต่ต้น (รวม /news/*)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|auth/callback|auth/auth-code-error|api/|news/).*)',
  ],
};
