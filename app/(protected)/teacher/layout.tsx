"use client";

import { useState } from "react";
import TeacherSidebar from "@/components/layout/TeacherSidebar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen">
      <TeacherSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className="flex-1 p-6 overflow-y-auto transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
