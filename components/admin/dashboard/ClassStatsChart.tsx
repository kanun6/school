"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ClassStats {
  className: string;
  studentCount: number;
}

export default function ClassStatsChart({ data }: { data: ClassStats[] }) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="className" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="studentCount" fill="#3b82f6" name="นักเรียน" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
