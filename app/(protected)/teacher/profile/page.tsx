// app/teacher/profile/page.tsx
'use client';

import UserProfile from "@/components/layout/UserProfile";


export default function TeacherProfilePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">โปรไฟล์ของฉัน</h1>
      <UserProfile role="teacher" asLink={false} className="border rounded-lg" />
      {/* เนื้อหาโปรไฟล์อื่น ๆ */}
    </div>
  );
}
