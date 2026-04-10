"use client";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16"];

export default function PieCategoria({
  data,
  showPercent = false,
}: {
  data: { name: string; value: number }[];
  showPercent?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={showPercent ? 340 : 280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          stroke="none"
          label={showPercent ? (p: any) => `${((p.value / total) * 100).toFixed(1)}%` : false}
          labelLine={showPercent}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
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
          formatter={(v: number, name: string) => {
            const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
            return [`R$ ${Number(v).toLocaleString("pt-BR")} (${pct}%)`, name];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--chart-axis)" }}
          iconType="circle"
          formatter={(value: string, entry: any) => {
            if (!showPercent) return value;
            const v = entry?.payload?.value ?? 0;
            const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
            return `${value} · R$ ${Number(v).toLocaleString("pt-BR")} (${pct}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
