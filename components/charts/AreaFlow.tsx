"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function AreaFlow({ data }: { data: { mes: string; receita: number; despesa: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
        <Tooltip
          contentStyle={{
            background: "var(--chart-tooltip-bg)",
            border: "1px solid var(--chart-tooltip-border)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--chart-tooltip-text)",
          }}
          itemStyle={{ color: "var(--chart-tooltip-text)" }}
          labelStyle={{ color: "var(--chart-tooltip-text)" }}
        />
        <Area type="monotone" dataKey="receita" stroke="#3B82F6" strokeWidth={2.5} fill="url(#g1)" />
        <Area type="monotone" dataKey="despesa" stroke="#EF4444" strokeWidth={2.5} fill="url(#g2)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
