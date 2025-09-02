// components/layout/SiteHeader.tsx
import Link from 'next/link';
import Image from 'next/image';
import UserMenu from '@/components/auth/UserMenu';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ชนิดข้อมูลโปรไฟล์ที่ต้องใช้ใน Header
type Role = 'admin' | 'teacher' | 'student';
type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: Role | null;
};

export default async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ดึงข้อมูลโปรไฟล์เมื่อมี user
  let profile: ProfileRow | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('first_name,last_name,profile_image_url,role')
      .eq('id', user.id)
      .maybeSingle<ProfileRow>(); // 👈 ใส่ generic ให้ type ชัดเจน
    profile = data ?? null;
  }

  const displayName =
    (profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : '') ||
    user?.email ||
    'User';

  return (
    <header
      className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur
                 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="SchoolSys" width={28} height={28} />
          <span className="font-semibold text-slate-900 dark:text-slate-100">SchoolSys</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700 dark:text-slate-300">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
            หน้าแรก
          </Link>
          <Link href="/#features" className="hover:text-slate-900 dark:hover:text-white">
            บริการ
          </Link>
          <Link href="/#about" className="hover:text-slate-900 dark:hover:text-white">
            เกี่ยวกับ
          </Link>
          <Link href="/#contact" className="hover:text-slate-900 dark:hover:text-white">
            ติดต่อเรา
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/signup"
                className="hidden sm:inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                เริ่มต้นใช้งาน
              </Link>
              <Link
                href="/signin"
                className="inline-flex rounded-md border border-slate-300 dark:border-slate-600
                           px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200
                           hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                เข้าสู่ระบบ
              </Link>
            </>
          ) : (
            <UserMenu
              name={displayName}
              avatarUrl={profile?.profile_image_url ?? null}
              role={profile?.role ?? null}
            />
          )}
        </div>
      </div>
    </header>
  );
}
