"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PerformanceChart({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  if (!data.length) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="auxFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bc8a5f" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#bc8a5f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-lg)",
              color: "var(--foreground)",
              fontFamily: "var(--font-sans)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#d4a276"
            strokeWidth={2}
            fill="url(#auxFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
