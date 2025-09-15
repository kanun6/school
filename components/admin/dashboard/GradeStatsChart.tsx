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

interface GradeStats {
  gradeName: string;
  studentCount: number;
}

export default function GradeStatsChart({ data }: { data: GradeStats[] }) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="gradeName" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="studentCount" fill="#10b981" name="นักเรียน" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
