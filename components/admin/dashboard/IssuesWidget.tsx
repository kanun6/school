"use client";

import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

type IssueStats = {
  ใหม่: number;
  กำลังดำเนินการ: number;
  แก้ไขแล้ว: number;
};

export default function IssuesWidget({ stats }: { stats: IssueStats }) {
  const items = [
    {
      label: "ปัญหาใหม่",
      value: stats.ใหม่,
      color: "bg-blue-100 text-blue-700",
      icon: AlertTriangle,
    },
    {
      label: "กำลังดำเนินการ",
      value: stats.กำลังดำเนินการ,
      color: "bg-yellow-100 text-yellow-700",
      icon: Clock,
    },
    {
      label: "แก้ไขแล้ว",
      value: stats.แก้ไขแล้ว,
      color: "bg-green-100 text-green-700",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">เรื่องร้องเรียน</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map(({ label, value, color, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
            </div>
            <div
              className={`p-3 rounded-full flex items-center justify-center ${color}`}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
