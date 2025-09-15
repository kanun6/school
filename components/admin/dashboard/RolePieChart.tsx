// components/admin/dashboard/RolePieChart.tsx
"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function RolePieChart({
  admin,
  teacher,
  student,
}: {
  admin: number;
  teacher: number;
  student: number;
}) {
  const data = [
    { name: "Admin", value: admin },
    { name: "Teacher", value: teacher },
    { name: "Student", value: student },
  ];

  const COLORS = ["#ef4444", "#22c55e", "#eab308"];

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
