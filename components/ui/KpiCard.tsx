import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

export default function KpiCard({
  label,
  value,
  delta,
  icon,
  accent,
}: {
  label: string;
  value: string;
  delta?: number;
  icon?: ReactNode;
  accent?: boolean;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="card">
      <div className="card-body flex items-start justify-between">
        <div>
          <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{label}</div>
          <div className="text-2xl font-semibold mt-2 tracking-tight text-zinc-100">{value}</div>
          {delta !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-success" : "text-danger"}`}>
              {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(delta).toFixed(1)}% vs mês anterior
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 grid place-items-center rounded-md ${accent ? "bg-primary/15 text-primary" : "bg-surface2 text-zinc-400"}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
