'use client';

import UserProfile from "@/components/layout/UserProfile";



export default function StudentProfilePage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">โปรไฟล์ของคุณ</h1>

      {/* แสดงโปรไฟล์ (ไม่ลิงก์ซ้ำเพราะอยู่ในหน้าโปรไฟล์แล้ว) */}
      <UserProfile role="student" asLink={false} className="bg-gray-100 dark:bg-gray-900 rounded-xl" />

      {/* ส่วนอื่น ๆ เช่น รายละเอียดเพิ่มเติม */}
      <div className="mt-6">
        <p className="text-gray-700 dark:text-gray-300">คุณสามารถอัปเดตข้อมูลได้เร็ว ๆ นี้...</p>
      </div>
    </div>
  );
}
