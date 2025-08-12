import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Role } from "@/lib/types";
import { BookOpenCheck } from "lucide-react";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let roleHomePage = '/';
  if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<{ role: Role }>();
      if (profile) {
          roleHomePage = `/${profile.role}`;
      }
  }

  const navLinks = [
      { href: '/', label: 'หน้าแรก' },
      { href: '/services', label: 'บริการ' },
      { href: '/about', label: 'เกี่ยวกับ' },
      { href: '/contact', label: 'ติดต่อเรา' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b dark:border-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
            <BookOpenCheck className="h-6 w-6 text-blue-600" />
            <span>SchoolSys</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {link.label}
                </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-2">
            {user ? (
                <>
                    <Link href={roleHomePage} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Dashboard
                    </Link>
                    <form action="/auth/signout" method="post">
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">
                            Sign Out
                        </button>
                    </form>
                </>
            ) : (
                <>
                    <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                        เริ่มต้นใช้งาน
                    </Link>
                    <Link href="/signin" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        เข้าสู่ระบบ
                    </Link>
                </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow">{children}</main>
    </div>
  );
}
