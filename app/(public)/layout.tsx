// app/(public)/layout.tsx
import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import NavServicesDropdown from "@/components/layout/NavServicesDropdown";
import UserMenu from "@/components/auth/UserMenu";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: Role | null;
};

export default async function PublicLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: ProfileRow | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("first_name,last_name,profile_image_url,role")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();
    profile = data ?? null;
  }

  const displayName =
    (profile
      ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
      : "") || user?.email || "User";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b dark:border-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white"
          >
            <BookOpenCheck className="h-6 w-6 text-blue-600" />
            <span>SchoolSys</span>
          </Link>

          {/* Nav (desktop) */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              หน้าแรก
            </Link>
            <NavServicesDropdown />
            <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              เกี่ยวกับ
            </Link>
            <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              ติดต่อเรา
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center space-x-2">
            {!user ? (
              <>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  เริ่มต้นใช้งาน
                </Link>
                <Link
                  href="/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

      <main className="flex-grow">{children}</main>
    </div>
  );
}
