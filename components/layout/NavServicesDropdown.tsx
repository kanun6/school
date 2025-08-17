"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function NavServicesDropdown() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // ปิดเมื่อคลิกนอก
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        btnRef.current &&
        !btnRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
      >
        บริการ
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* เมนูย่อย */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute left-0 top-full mt-2 w-64 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg"
        >
          <div className="py-2">
            <Link
              href="/services/courses"
              role="menuitem"
              className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              onClick={() => setOpen(false)}
            >
              รายวิชาที่สอน
            </Link>
            <Link
              href="/services/staff"
              role="menuitem"
              className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              onClick={() => setOpen(false)}
            >
              บุคลากรทางการสอน
            </Link>
            <Link
              href="/services/class-students"
              role="menuitem"
              className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              onClick={() => setOpen(false)}
            >
              จำนวนนักเรียนแต่ละห้อง
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
