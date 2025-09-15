'use client';

import type { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  rightSlot?: ReactNode; // ✅ เพิ่มช่องฝั่งขวาของหัวข้อ
};

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  rightSlot,
}: AuthShellProps) {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-slate-100
                 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900
                 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* แผงข้อมูลแบรนด์ */}
        <div className="hidden md:flex">
          <div
            className="relative flex-1 overflow-hidden rounded-2xl
                       bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500
                       text-white shadow-xl"
          >
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white to-transparent" />
            <div className="relative p-8 lg:p-10 h-full flex flex-col">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8" aria-hidden />
                <span className="text-2xl font-extrabold tracking-tight">school-sys</span>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold">ระบบจัดการโรงเรียนออนไลน์</h3>
                <p className="mt-2 text-white/90">
                  จัดการตารางเรียน คะแนน และข้อมูลนักเรียนได้ในที่เดียว
                </p>
              </div>

              <ul className="mt-8 space-y-3 text-white/95">
                <li>• ดู/พิมพ์ตารางเรียนรายห้อง</li>
                <li>• บันทึกคะแนนและคำนวณเกรดอัตโนมัติ</li>
                <li>• แจ้งปัญหาและติดตามงาน</li>
                <li>• กระดานข่าวสารของโรงเรียน</li>
              </ul>

              <div className="mt-auto pt-8 text-sm text-white/80">
                © {new Date().getFullYear()} school-sys
              </div>
            </div>
          </div>
        </div>

        {/* การ์ดฟอร์ม */}
        <div
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-2xl
                     ring-1 ring-slate-200 dark:ring-slate-800 shadow-lg p-6 sm:p-8"
        >
          {/* หัวข้อ + ปุ่มขวาบน (rightSlot) */}
          <div className="mb-6 relative">
            <div className="md:hidden mb-3 flex items-center justify-center gap-2">
              <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" aria-hidden />
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                school-sys
              </span>
            </div>

            {/* ปุ่ม/แอคชันฝั่งขวา ระดับเดียวกับหัวข้อ */}
            {rightSlot && <div className="absolute top-0 right-0">{rightSlot}</div>}

            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
              )}
            </div>
          </div>

          {children}

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
