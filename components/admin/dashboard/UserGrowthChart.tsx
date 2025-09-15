"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type GrowthData = {
  month: string;
  admin: number;
  teacher: number;
  student: number;
};

export default function UserGrowthChart({ data }: { data: GrowthData[] }) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="admin" stroke="#ef4444" name="Admin" />
          <Line type="monotone" dataKey="teacher" stroke="#22c55e" name="Teacher" />
          <Line type="monotone" dataKey="student" stroke="#3b82f6" name="Student" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
