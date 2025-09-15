"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UsageData {
  date: string;
  count: number;
}

export default function SystemUsageChart({ data }: { data: UsageData[] }) {
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#6366f1" name="จำนวน Login" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
