"use client";

import { useState } from "react";
import StudentSidebar from "@/components/layout/StudentSidebar";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen">
      <StudentSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className="flex-1 p-6 overflow-y-auto transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
