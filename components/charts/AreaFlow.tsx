"use client";
import { useState, useEffect } from "react";
import {
  Bar, BarChart, Area, AreaChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { brl } from "@/lib/format";
import { BarChart3, LineChart } from "lucide-react";

type FluxoItem = {
  mes: string;
  receitaRecebida: number;
  receitaEmprestimo: number;
  receitaProv: number;
  despesaPaga: number;
  despesaProv: number;
};

type ChartType = "bar" | "line";
const STORAGE_KEY = "nordicash-fluxo-chart-type";

const COLORS = {
  receitaRecebida: "#22C55E",
  receitaEmprestimo: "#86EFAC",
  receitaProv: "#3B82F6",
  despesaPaga: "#EF4444",
  despesaProv: "#F59E0B",
};

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

const legendStyle = { fontSize: 11, color: "var(--chart-axis)", paddingTop: 8 };

export default function AreaFlow({ data }: { data: FluxoItem[] }) {
  const [type, setType] = useState<ChartType>("bar");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ChartType | null;
    if (saved === "bar" || saved === "line") setType(saved);
  }, []);

  function toggle(t: ChartType) {
    setType(t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  return (
    <div>
      <div className="flex justify-end gap-1 mb-2">
        <button
          className={`btn btn-sm btn-icon ${type === "bar" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => toggle("bar")}
          title="Gráfico de barras"
        >
          <BarChart3 size={14} />
        </button>
        <button
          className={`btn btn-sm btn-icon ${type === "line" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => toggle("line")}
          title="Gráfico de linhas"
        >
          <LineChart size={14} />
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {type === "bar" ? (
          <BarChart data={data} barGap={0} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => brl(v)} />
            <Legend wrapperStyle={legendStyle} iconType="square" />
            <Bar dataKey="receitaRecebida" name="Receita recebida" stackId="receita" fill={COLORS.receitaRecebida} radius={[0, 0, 0, 0]} />
            <Bar dataKey="receitaEmprestimo" name="Recebimento empréstimo" stackId="receita" fill={COLORS.receitaEmprestimo} radius={[0, 0, 0, 0]} />
            <Bar dataKey="receitaProv" name="Receita provisionada" stackId="receita" fill={COLORS.receitaProv} radius={[3, 3, 0, 0]} />
            <Bar dataKey="despesaPaga" name="Despesa paga" stackId="despesa" fill={COLORS.despesaPaga} radius={[0, 0, 0, 0]} />
            <Bar dataKey="despesaProv" name="Despesa provisionada" stackId="despesa" fill={COLORS.despesaProv} radius={[3, 3, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={data}>
            <defs>
              {Object.entries(COLORS).map(([key, color]) => (
                <linearGradient key={key} id={`g-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => brl(v)} />
            <Legend wrapperStyle={legendStyle} iconType="circle" />
            <Area type="monotone" dataKey="receitaRecebida" name="Receita recebida" stroke={COLORS.receitaRecebida} strokeWidth={2.5} fill={`url(#g-receitaRecebida)`} />
            <Area type="monotone" dataKey="receitaEmprestimo" name="Recebimento empréstimo" stroke={COLORS.receitaEmprestimo} strokeWidth={2.5} fill={`url(#g-receitaEmprestimo)`} />
            <Area type="monotone" dataKey="receitaProv" name="Receita provisionada" stroke={COLORS.receitaProv} strokeWidth={2.5} fill={`url(#g-receitaProv)`} />
            <Area type="monotone" dataKey="despesaPaga" name="Despesa paga" stroke={COLORS.despesaPaga} strokeWidth={2.5} fill={`url(#g-despesaPaga)`} />
            <Area type="monotone" dataKey="despesaProv" name="Despesa provisionada" stroke={COLORS.despesaProv} strokeWidth={2.5} fill={`url(#g-despesaProv)`} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
