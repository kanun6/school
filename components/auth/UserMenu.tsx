// components/auth/UserMenu.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';

export default function UserMenu({
  name,
  avatarUrl,
  role,
}: {
  name: string;
  avatarUrl?: string | null;
  role?: 'admin' | 'teacher' | 'student' | null;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const initials =
    name?.trim()?.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  };

  const dashboardHref =
    role === 'teacher' ? '/teacher' : role === 'student' ? '/student' : '/admin/dashboard';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-blue-300/60
                   bg-white/80 dark:bg-slate-800/80 px-2 py-1.5
                   shadow-sm hover:shadow-md ring-2 ring-blue-400/30 dark:ring-blue-500/30
                   transition-all focus:outline-none focus:ring-4 focus:ring-blue-300/40"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        ) : (
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-full
                       bg-gradient-to-br from-blue-500 to-indigo-500 text-white
                       text-sm font-semibold shadow-inner"
          >
            {initials}
          </span>
        )}
        <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-200" />
      </button>

      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-3 w-64 origin-top-right rounded-xl border
                    bg-white/95 dark:bg-slate-900/95 backdrop-blur
                    border-slate-200 dark:border-slate-700 shadow-xl
                    transition transform ${
                      open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                    }`}
        role="menu"
      >
        {/* Header inside dropdown */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {name}
              </div>
              {role && (
                <span
                  className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium
                             bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 capitalize"
                >
                  {role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="py-2">
          <Link
            href={dashboardHref}
            onClick={() => setOpen(false)}
            className="group flex items-center gap-3 px-4 py-3 text-[15px]
                       text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40
                       transition-colors"
            role="menuitem"
          >
            <LayoutDashboard className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Dashboard</span>
          </Link>

          <button
            onClick={onSignOut}
            className="group flex w-full items-center gap-3 px-4 py-3 text-[15px] text-left
                       text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40
                       transition-colors"
            role="menuitem"
          >
            <LogOut className="h-5 w-5 text-red-600 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-red-700 dark:text-red-300">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
