"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl } from "@/lib/format";

type Ponto = { mes: string; patrimonio: number };

const tooltipStyle = {
  contentStyle: {
    background: "var(--chart-tooltip-bg)",
    border: "1px solid var(--chart-tooltip-border)",
    borderRadius: 6,
    fontSize: 12,
    color: "var(--chart-tooltip-text)",
  },
  itemStyle: { color: "var(--chart-tooltip-text)" },
  labelStyle: { color: "var(--chart-tooltip-text)", fontWeight: 600 as const },
};

export default function PatrimonioEvolucao({ data }: { data: Ponto[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gPatrimonio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => brl(v)} />
        <Area type="monotone" dataKey="patrimonio" name="Patrimônio" stroke="#3B82F6" strokeWidth={2.5} fill="url(#gPatrimonio)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
