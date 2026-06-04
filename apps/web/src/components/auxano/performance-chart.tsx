"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityPoint } from "@auxano/shared";

export function PerformanceChart({ data }: { data: EquityPoint[] }) {
  if (!data.length) return null;

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00C853" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#00C853" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "#B0B0B0", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.slice(5)}
          />
          <YAxis
            tick={{ fill: "#B0B0B0", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              color: "#F5F5F5",
            }}
            formatter={(value: number) => [
              `$${value.toLocaleString()}`,
              "Portfolio",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00C853"
            strokeWidth={2}
            fill="url(#equityGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
