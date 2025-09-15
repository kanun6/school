"use client";

interface Activity {
  id: string;
  name: string;
  role: "admin" | "teacher" | "student";
  created_at: string;
}

export default function RecentActivity({ users }: { users: Activity[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">ผู้ใช้ที่เพิ่มล่าสุด</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200 dark:border-gray-700">
            <th className="py-2">ชื่อ</th>
            <th className="py-2">บทบาท</th>
            <th className="py-2">วันที่สมัคร</th>
          </tr>
        </thead>
        <tbody>
          {users.slice(0, 5).map((u) => (
            <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700">
              <td className="py-2">{u.name}</td>
              <td className="py-2 capitalize">{u.role}</td>
              <td className="py-2">{new Date(u.created_at).toLocaleDateString("th-TH")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
