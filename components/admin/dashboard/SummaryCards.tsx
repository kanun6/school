// components/admin/dashboard/SummaryCards.tsx
import { Users, ShieldCheck, GraduationCap, User } from "lucide-react";

export default function SummaryCards({
  total,
  admin,
  teacher,
  student,
}: {
  total: number;
  admin: number;
  teacher: number;
  student: number;
}) {
  const cards = [
    {
      label: "ผู้ใช้ทั้งหมด",
      value: total,
      icon: Users,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "แอดมิน",
      value: admin,
      icon: ShieldCheck,
      color: "bg-red-100 text-red-700",
    },
    {
      label: "อาจารย์",
      value: teacher,
      icon: GraduationCap,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "นักเรียน",
      value: student,
      icon: User,
      color: "bg-yellow-100 text-yellow-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="flex items-center justify-between p-4 rounded-lg shadow bg-white dark:bg-gray-800"
        >
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
          <div
            className={`p-3 rounded-full ${color} flex items-center justify-center`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      ))}
    </div>
  );
}
