"use client";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  mes: number;
  saldo?: number;
  aporteAcum?: number;
  rendimentoAcum?: number;
  valor?: number;
};

export default function LineProjecao({ data }: { data: Point[] }) {
  const isMulti = data.length > 0 && data[0].saldo !== undefined;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
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
          labelStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 600 }}
          formatter={(v: number, name: string) => [`R$ ${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`, name]}
          labelFormatter={(l) => `Mês ${l}`}
        />
        {isMulti && <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "var(--chart-axis)" }} iconType="circle" />}

        {isMulti ? (
          <>
            <Line type="monotone" dataKey="saldo" name="Saldo projetado" stroke="#22C55E" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="aporteAcum" name="Aporte acumulado" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="rendimentoAcum" name="Rendimento acumulado" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
          </>
        ) : (
          <Line type="monotone" dataKey="valor" name="Valor" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
