import { brl } from "@/lib/format";

export default function ProgressBar({
  value,
  max,
  highlight,
}: {
  value: number;
  max: number;
  highlight?: number; // valor "destacado" (ex: fatura do mês selecionado)
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warn" : "bg-accent";
  const hl = highlight ?? 0;
  const pctHl = Math.min(100, (hl / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
        <span>{brl(value)}</span>
        <span>{brl(max)}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-surface2 overflow-hidden">
        <div className={`absolute inset-y-0 left-0 ${color} transition-all`} style={{ width: `${pct}%` }} />
        {hl > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-primary/80 transition-all"
            style={{ width: `${pctHl}%` }}
            title={`Mês selecionado: ${brl(hl)}`}
          />
        )}
      </div>
      <div className="text-xs text-zinc-500 mt-1.5 flex justify-between">
        <span>{pct.toFixed(0)}% utilizado</span>
        {hl > 0 && <span className="text-primary">Mês: {brl(hl)} ({pctHl.toFixed(0)}%)</span>}
      </div>
    </div>
  );
}
