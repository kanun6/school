"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  GraduationCap,
  HomeIcon,
  LogOut,
  MessageSquareWarning,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UserProfile from "./UserProfile";
import SignOutButton from "../auth/SignOutButton";

const navItems = [
  { href: "/teacher/schedule", label: "ตารางสอน", icon: Calendar },
  { href: "/teacher/grades", label: "บันทึกผลการเรียน", icon: GraduationCap },
  { href: "/teacher/report-issue", label: "แจ้งปัญหา", icon: MessageSquareWarning },
  { href: "/", label: "หน้าหลัก", icon: HomeIcon },
];

export default function TeacherSidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) {
  const pathname = usePathname();

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
          <span className="font-semibold text-gray-900 dark:text-white">
            แผงสำหรับครู
          </span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800"
          aria-label={isOpen ? "ย่อลง" : "ขยายเมนู"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* User Profile */}
      <div className="px-2 py-4">{isOpen && <UserProfile role="teacher" asLink />}</div>

      {/* Navigation */}
      <nav className="mt-2 space-y-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
                "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
                isActive && "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              {isOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 border-t dark:border-gray-800">
        <SignOutButton className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50">
          <LogOut className="h-4 w-4" />
          {isOpen && "ออกจากระบบ"}
        </SignOutButton>
      </div>
    </aside>
  );
}
