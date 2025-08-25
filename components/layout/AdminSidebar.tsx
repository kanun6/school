"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  FileText,
  ShieldCheck,
  LogOut,
  Calendar,
  BookCopy,
  HomeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin/users", label: "จัดการผู้ใช้", icon: Users },
  { href: "/admin/teacher-schedules", label: "ตารางสอนรวม", icon: Calendar },
  {
    href: "/admin/class-schedules",
    label: "ตารางเรียนตามห้อง",
    icon: BookCopy,
  },
  { href: "/admin/report", label: "เรื่องร้องเรียน", icon: FileText },
  { href: "/", label: "หน้าหลัก", icon: HomeIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [newIssueCount, setNewIssueCount] = useState(0);

  const fetchNewIssueCount = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNewIssueCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  useEffect(() => {
    fetchNewIssueCount();

    const supabase = createClient();
    const channel = supabase
      .channel("admin-issue-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => {
          fetchNewIssueCount();
        }
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/admin/report") {
      setNewIssueCount(0);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-100 dark:bg-gray-900 h-screen sticky top-0">
      <div className="flex h-full flex-col">
        <div className="flex-1">
          <div className="flex h-16 items-center border-b px-6 dark:border-gray-800">
            <Link
              href="/admin/users"
              className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"
            >
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <span className="">Admin Panel</span>
            </Link>
          </div>
          <nav className="grid items-start px-4 text-sm font-medium mt-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              // ** THE FIX **
              // For the home link, check for an exact match. For others, use startsWith.
              const isActive =
                href === "/" ? pathname === href : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-gray-50",
                    isActive &&
                      "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                  {label === "เรื่องร้องเรียน" && newIssueCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {newIssueCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t dark:border-gray-800">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
