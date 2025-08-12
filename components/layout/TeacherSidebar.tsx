'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, GraduationCap, HomeIcon, LogOut, MessageSquareWarning } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import UserProfile from './UserProfile'; // Import the new component

const navItems = [
  { href: '/teacher/schedule', label: 'ตารางสอน', icon: Calendar },
  { href: '/teacher/grades', label: 'บันทึกผลการเรียน', icon: GraduationCap },
  { href: '/teacher/report-issue', label: 'แจ้งปัญหา', icon: MessageSquareWarning },
  { href: '/', label: 'หน้าหลัก', icon: HomeIcon },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-100 dark:bg-gray-900 h-screen sticky top-0">
      <div className="flex h-full flex-col">
        <div className="flex-1">
          <UserProfile role="teacher" /> {/* <-- UPDATED: Use the UserProfile component */}
          <nav className="grid items-start px-4 text-sm font-medium mt-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50', isActive && 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50')}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t dark:border-gray-800">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}