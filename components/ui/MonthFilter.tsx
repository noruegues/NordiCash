"use client";
import { useState } from "react";

export type MonthFilterValue =
  | { mode: "current" }
  | { mode: "month"; mes: string }
  | { mode: "range"; from: string; to: string }
  | { mode: "all" };

export function applyMonthFilter<T extends { mesRef: string }>(items: T[], v: MonthFilterValue): T[] {
  if (v.mode === "all") return items;
  if (v.mode === "current") {
    const now = new Date().toISOString().slice(0, 7);
    return items.filter((i) => i.mesRef === now);
  }
  if (v.mode === "month") return items.filter((i) => i.mesRef === v.mes);
  return items.filter((i) => i.mesRef >= v.from && i.mesRef <= v.to);
}

export default function MonthFilter({
  value,
  onChange,
}: {
  value: MonthFilterValue;
  onChange: (v: MonthFilterValue) => void;
}) {
  const now = new Date().toISOString().slice(0, 7);
  const [openCustom, setOpenCustom] = useState(value.mode === "range" || value.mode === "month");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded border border-border overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => { onChange({ mode: "current" }); setOpenCustom(false); }}
          className={`px-3 py-1.5 ${value.mode === "current" ? "bg-primary text-white" : "text-zinc-400 hover:bg-surface2"}`}
        >Mês atual</button>
        <button
          type="button"
          onClick={() => { onChange({ mode: "all" }); setOpenCustom(false); }}
          className={`px-3 py-1.5 border-l border-border ${value.mode === "all" ? "bg-primary text-white" : "text-zinc-400 hover:bg-surface2"}`}
        >Todos</button>
        <button
          type="button"
          onClick={() => { setOpenCustom(true); if (value.mode !== "month" && value.mode !== "range") onChange({ mode: "month", mes: now }); }}
          className={`px-3 py-1.5 border-l border-border ${value.mode === "month" || value.mode === "range" ? "bg-primary text-white" : "text-zinc-400 hover:bg-surface2"}`}
        >Personalizado</button>
      </div>
      {openCustom && (
        <div className="flex items-center gap-2">
          <select
            className="select !h-8 !text-xs !py-1"
            value={value.mode}
            onChange={(e) => {
              if (e.target.value === "month") onChange({ mode: "month", mes: now });
              else onChange({ mode: "range", from: now, to: now });
            }}
          >
            <option value="month">Mês específico</option>
            <option value="range">Período</option>
          </select>
          {value.mode === "month" && (
            <input
              type="month"
              className="input !h-8 !text-xs !py-1"
              value={value.mes}
              onChange={(e) => onChange({ mode: "month", mes: e.target.value })}
            />
          )}
          {value.mode === "range" && (
            <>
              <input
                type="month"
                className="input !h-8 !text-xs !py-1"
                value={value.from}
                onChange={(e) => onChange({ ...value, from: e.target.value })}
              />
              <span className="text-xs text-zinc-500">até</span>
              <input
                type="month"
                className="input !h-8 !text-xs !py-1"
                value={value.to}
                onChange={(e) => onChange({ ...value, to: e.target.value })}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
