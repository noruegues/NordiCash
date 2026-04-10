"use client";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { brl, mesRefBR } from "@/lib/format";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

type Item = { id: string; descricao?: string; fonte?: string; categoria: string; valor: number; mesRef: string };

export default function MacroView({
  items,
  groupBy = "descricao",
  colorTotal = "text-zinc-100",
  onEditGroup,
}: {
  items: Item[];
  groupBy?: "descricao" | "categoria" | "fonte";
  colorTotal?: string;
  onEditGroup?: (groupKey: string, groupMode: "descricao" | "categoria" | "fonte") => void;
}) {
  // Filtros
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupMode, setGroupMode] = useState<"descricao" | "categoria" | "fonte">(groupBy);

  const filtered = items.filter((i) => {
    if (from && i.mesRef < from) return false;
    if (to && i.mesRef > to) return false;
    return true;
  });

  // Coletar todos os meses únicos ordenados
  const meses = useMemo(() => Array.from(new Set(filtered.map((i) => i.mesRef))).sort(), [filtered]);

  // Normaliza nome removendo sufixo de parcela "(1/12)" etc para agrupar
  function normalizeKey(raw: string): string {
    if (groupMode !== "descricao") return raw;
    return raw.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim() || raw;
  }

  // Agrupar valores: { [grupo]: { [mes]: total } }
  const pivot = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const i of filtered) {
      const key = normalizeKey(String(i[groupMode] ?? "—"));
      (map[key] ||= {});
      map[key][i.mesRef] = (map[key][i.mesRef] || 0) + i.valor;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, groupMode]);

  const totaisMes: Record<string, number> = {};
  meses.forEach((m) => {
    totaisMes[m] = filtered.filter((i) => i.mesRef === m).reduce((s, i) => s + i.valor, 0);
  });

  const totalGeral = filtered.reduce((s, i) => s + i.valor, 0);
  const mediaMensal = meses.length > 0 ? totalGeral / meses.length : 0;

  // Calcular variação total entre primeiro e último mês
  const variacao =
    meses.length >= 2 && totaisMes[meses[0]] > 0
      ? ((totaisMes[meses[meses.length - 1]] - totaisMes[meses[0]]) / totaisMes[meses[0]]) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Filtro */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">De (mês)</label>
            <input type="month" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Até (mês)</label>
            <input type="month" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="label">Agrupar por</label>
            <select className="select" value={groupMode} onChange={(e) => setGroupMode(e.target.value as typeof groupMode)}>
              {items[0]?.fonte !== undefined && <option value="fonte">Fonte</option>}
              {items[0]?.descricao !== undefined && <option value="descricao">Descrição</option>}
              <option value="categoria">Categoria</option>
            </select>
          </div>
          {(from || to) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFrom(""); setTo(""); }}>Limpar</button>
          )}
          <div className="flex-1" />
          <div className="text-sm text-zinc-500">
            {meses.length} {meses.length === 1 ? "mês" : "meses"} · {Object.keys(pivot).length} grupos
          </div>
        </div>
      </Card>

      {/* KPIs macro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Total no período</div><div className={`text-2xl font-semibold mt-1 ${colorTotal}`}>{brl(totalGeral)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Média mensal</div><div className="text-2xl font-semibold mt-1">{brl(mediaMensal)}</div></Card>
        <Card>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Variação 1º → último mês</div>
          <div className={`text-2xl font-semibold mt-1 inline-flex items-center gap-1 ${
            variacao > 0 ? "text-danger" : variacao < 0 ? "text-success" : "text-zinc-300"
          }`}>
            {variacao > 0 ? <ArrowUp size={18} /> : variacao < 0 ? <ArrowDown size={18} /> : <Minus size={18} />}
            {Math.abs(variacao).toFixed(1)}%
          </div>
        </Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Lançamentos</div><div className="text-2xl font-semibold mt-1">{filtered.length}</div></Card>
      </div>

      {/* Pivot table */}
      <Card title="Comparativo mês a mês">
        {meses.length === 0 ? (
          <div className="text-sm text-zinc-500 py-6 text-center">Sem dados no período</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="t">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-surface z-10">{groupMode === "descricao" ? "Descrição" : groupMode === "fonte" ? "Fonte" : "Categoria"}</th>
                  {meses.map((m) => <th key={m} className="text-right">{mesRefBR(m)}</th>)}
                  <th className="text-right">Total</th>
                  <th className="text-right">Δ%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(pivot)
                  .sort((a, b) => {
                    const ta = Object.values(a[1]).reduce((s, v) => s + v, 0);
                    const tb = Object.values(b[1]).reduce((s, v) => s + v, 0);
                    return tb - ta;
                  })
                  .map(([grupo, byMes]) => {
                    const total = Object.values(byMes).reduce((s, v) => s + v, 0);
                    const first = byMes[meses[0]] || 0;
                    const last = byMes[meses[meses.length - 1]] || 0;
                    const delta = first > 0 ? ((last - first) / first) * 100 : 0;
                    return (
                      <tr key={grupo}>
                        <td className="font-medium sticky left-0 bg-surface z-10">
                          {onEditGroup ? (
                            <button
                              className="text-left hover:text-primary transition underline-offset-2 hover:underline"
                              onClick={() => onEditGroup(grupo, groupMode)}
                              title="Clique para editar"
                            >
                              {grupo}
                            </button>
                          ) : grupo}
                        </td>
                        {meses.map((m) => {
                          const v = byMes[m];
                          const content = v ? brl(v) : <span className="text-zinc-600">—</span>;
                          return (
                            <td key={m} className="text-right text-zinc-300">
                              {onEditGroup && v ? (
                                <button
                                  className="hover:text-primary transition"
                                  onClick={() => onEditGroup(grupo, groupMode)}
                                  title="Clique para editar"
                                >{content}</button>
                              ) : content}
                            </td>
                          );
                        })}
                        <td className="text-right font-semibold">{brl(total)}</td>
                        <td className={`text-right text-xs ${delta > 0 ? "text-danger" : delta < 0 ? "text-success" : "text-zinc-500"}`}>
                          {meses.length >= 2 && first > 0 ? `${delta > 0 ? "+" : ""}${delta.toFixed(0)}%` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                <tr className="bg-surface2/40 font-semibold">
                  <td className="sticky left-0 bg-surface2 z-10">TOTAL</td>
                  {meses.map((m) => (
                    <td key={m} className={`text-right ${colorTotal}`}>{brl(totaisMes[m])}</td>
                  ))}
                  <td className={`text-right ${colorTotal}`}>{brl(totalGeral)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
