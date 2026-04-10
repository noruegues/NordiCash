"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6"];

export default function BarComparativo({ data }: { data: { name: string; valor: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
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
          formatter={(v: number) => `R$ ${Number(v).toLocaleString("pt-BR")}`}
        />
        <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
