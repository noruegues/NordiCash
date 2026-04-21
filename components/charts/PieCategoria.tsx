"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { brl } from "@/lib/format";

const COLORS = [
  "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#6366F1",
  "#14B8A6", "#E11D48",
];

export default function PieCategoria({
  data,
  showPercent = false,
}: {
  data: { name: string; value: number }[];
  showPercent?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={sorted}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            stroke="none"
          >
            {sorted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
              return [`${brl(v)} (${pct}%)`, name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda organizada */}
      {showPercent && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {sorted.map((d, i) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={d.name} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate text-zinc-400 flex-1">{d.name}</span>
                <span className="font-medium text-zinc-200 whitespace-nowrap" data-money>{brl(d.value)}</span>
                <span className="text-zinc-500 w-12 text-right" data-money>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
