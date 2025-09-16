// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './lib/supabase/middleware';
import { Role } from './lib/types';

const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|webmanifest|map|mp4|webm|avif|heic|woff2?|ttf|otf)$/i;

function isPublicPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '/about' || pathname === '/contact') return true;
  if (pathname.startsWith('/services')) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // ⛳ ข้าม static ของ Next และไฟล์สาธารณะทั้งหมด รวม /news/*
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname.startsWith('/news/') ||         // รูปใน /public/news/*
    PUBLIC_FILE.test(pathname)
  ) {
    return response;
  }

  // อ่าน session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // ✦ หน้าลงชื่อเข้าใช้/สมัครใช้งาน: ถ้า "ล็อกอินแล้ว" → เด้งไป home ตาม role, ถ้ายัง → ปล่อยผ่าน
  if (pathname === '/signin' || pathname === '/signup') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single<{ role: Role }>();

      const role = profile?.role;
      const roleHome = role === 'admin' ? '/admin/dashboard' : role ? `/${role}` : '/';
      return NextResponse.redirect(new URL(roleHome, request.url));
    }
    return response;
  }

  // ✦ เพจสาธารณะอื่นๆ
  if (isPublicPath(pathname)) return response;

  // ✦ ต้องล็อกอิน
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('callbackUrl', pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // ✦ ตรวจ role และป้องกันเข้าหน้าของ role อื่น
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: Role }>();

  if (!profile) return response;

  const userRole = profile.role;
  const roleHomePage = userRole === 'admin' ? '/admin/dashboard' : `/${userRole}`;

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

export const config = {
  // ตัดเส้นทางที่ middleware ไม่ต้องทำงาน รวม /news/*
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|auth/callback|auth/auth-code-error|api/|news/).*)',
  ],
};
