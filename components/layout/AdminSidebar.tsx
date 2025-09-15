"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  ShieldCheck,
  LogOut,
  Calendar,
  BookCopy,
  HomeIcon,
  Menu,
  X,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import SignOutButton from "@/components/auth/SignOutButton"; // ✅ เพิ่มบรรทัดนี้

const navItems = [
  { href: "/admin/dashboard", label: "ภาพรวมระบบ", icon: BarChart2 },
  { href: "/admin/users", label: "จัดการผู้ใช้", icon: Users },
  { href: "/admin/teacher-schedules", label: "ตารางสอนรวม", icon: Calendar },
  { href: "/admin/class-schedules", label: "ตารางเรียนตามห้อง", icon: BookCopy },
  { href: "/admin/report", label: "เรื่องร้องเรียน", icon: FileText },
  { href: "/", label: "หน้าหลัก", icon: HomeIcon },
];

export default function AdminSidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();
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
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => {
        fetchNewIssueCount();
      })
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

  return (
    <aside
      className={cn(
        "h-full border-r bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4 dark:border-gray-800">
        {isOpen && (
          <Link
            href="/admin/users"
            className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"
          >
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span>Admin Panel</span>
          </Link>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-4 space-y-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
                "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                isActive &&
                  "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {isOpen && <span>{label}</span>}
              {label === "เรื่องร้องเรียน" && newIssueCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {newIssueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 border-t dark:border-gray-800">
        <SignOutButton
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50"
          // redirectTo="/signin" // (ถ้าต้องการเปลี่ยนปลายทาง ออกจากคอมเมนต์ได้)
        >
          {/* ✅ ไอคอนเดิมยังอยู่ */}
          <LogOut className="h-4 w-4" />
          {isOpen && "ออกจากระบบ"}
        </SignOutButton>
      </div>
    </aside>
  );
}
