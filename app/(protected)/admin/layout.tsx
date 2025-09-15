"use client";

import { useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen">
      <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <main className="flex-1 p-6 overflow-y-auto transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
