"use client";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { brl, mesRefBR } from "@/lib/format";
import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Line, LineChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const MESES_NOME = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
function mesLongo(ref: string): string {
  if (!ref) return "";
  const [y, m] = ref.split("-");
  return `${MESES_NOME[parseInt(m, 10) - 1]} ${y}`;
}

type Item = { id: string; descricao?: string; fonte?: string; categoria: string; valor: number; mesRef: string; groupId?: string };

export default function MacroView({
  items,
  groupBy = "descricao",
  colorTotal = "text-zinc-100",
  mode = "despesa",
  onEditGroup,
}: {
  items: Item[];
  groupBy?: "descricao" | "categoria" | "fonte";
  colorTotal?: string;
  mode?: "despesa" | "receita";
  onEditGroup?: (groupKey: string, groupMode: "descricao" | "categoria" | "fonte") => void;
}) {
  // Para despesas: subir = ruim (red), descer = bom (green)
  // Para receitas: subir = bom (green), descer = ruim (red)
  const upColor = mode === "receita" ? "text-success" : "text-danger";
  const downColor = mode === "receita" ? "text-danger" : "text-success";
  const upBg = mode === "receita" ? "bg-success/5 text-success" : "bg-danger/5 text-danger";
  const downBg = mode === "receita" ? "bg-danger/5 text-danger" : "bg-success/5 text-success";
  const lineColor = mode === "receita" ? "#22C55E" : "#EF4444";
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

  // Normaliza nome removendo sufixo de parcela "(1/12)" etc
  function stripSuffix(raw: string): string {
    return raw.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim() || raw;
  }

  // Agrupar valores: { [grupo]: { [mes]: total } }
  // Usa groupId para distinguir compras diferentes com mesmo nome
  const pivot = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};

    if (groupMode === "descricao") {
      // Agrupa por groupId quando disponível, senão por nome normalizado
      // Mapeia groupId → label para exibição
      const groupLabels: Record<string, string> = {};
      const nameCount: Record<string, number> = {};

      // Primeira passagem: conta quantos grupos distintos por nome base
      const groupsByName: Record<string, Set<string>> = {};
      for (const i of filtered) {
        const label = stripSuffix(String(i.descricao ?? "—"));
        const gKey = i.groupId || i.id;
        (groupsByName[label] ||= new Set()).add(gKey);
      }

      // Segunda passagem: agrupa com label diferenciado quando há múltiplos grupos
      for (const i of filtered) {
        const label = stripSuffix(String(i.descricao ?? "—"));
        const gKey = i.groupId || i.id;

        if (!groupLabels[gKey]) {
          const groups = groupsByName[label];
          if (groups && groups.size > 1) {
            // Múltiplos grupos com mesmo nome — numera
            nameCount[label] = (nameCount[label] || 0) + 1;
            groupLabels[gKey] = `${label} (#${nameCount[label]})`;
          } else {
            groupLabels[gKey] = label;
          }
        }

        const key = groupLabels[gKey];
        (map[key] ||= {});
        map[key][i.mesRef] = (map[key][i.mesRef] || 0) + i.valor;
      }
    } else {
      for (const i of filtered) {
        const key = String(i[groupMode] ?? "—");
        (map[key] ||= {});
        map[key][i.mesRef] = (map[key][i.mesRef] || 0) + i.valor;
      }
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

  // Período anterior equivalente (mesma duração, meses imediatamente antes)
  function shiftMes(mes: string, offset: number): string {
    const [y, m] = mes.split("-").map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const { varPeriodoAnt, varAnoAnt, labelPeriodoAnt, labelAnoAnt, totalPeriodoAnt, totalAnoAnt, varMesAMes, mesUltimo, mesPenultimo } = useMemo(() => {
    if (meses.length === 0) return { varPeriodoAnt: 0, varAnoAnt: 0, labelPeriodoAnt: "", labelAnoAnt: "", totalPeriodoAnt: 0, totalAnoAnt: 0, varMesAMes: 0, mesUltimo: "", mesPenultimo: "" };

    const n = meses.length;
    const primeiro = meses[0];
    const ultimo = meses[meses.length - 1];

    // Período anterior: N meses antes do primeiro mês
    const antInicio = shiftMes(primeiro, -n);
    const antFim = shiftMes(primeiro, -1);
    const totalAnt = items
      .filter((i) => i.mesRef >= antInicio && i.mesRef <= antFim)
      .reduce((s, i) => s + i.valor, 0);

    // Mesmo período do ano anterior
    const anoAntInicio = shiftMes(primeiro, -12);
    const anoAntFim = shiftMes(ultimo, -12);
    const totalAno = items
      .filter((i) => i.mesRef >= anoAntInicio && i.mesRef <= anoAntFim)
      .reduce((s, i) => s + i.valor, 0);

    const calcVar = (atual: number, anterior: number) => {
      if (anterior === 0 && atual === 0) return 0;
      if (anterior === 0) return 100;
      return ((atual - anterior) / anterior) * 100;
    };

    // Variação mês a mês (último vs penúltimo)
    let varMesAMes = 0;
    let mesUltimo = "";
    let mesPenultimo = "";
    if (n >= 2) {
      mesUltimo = meses[n - 1];
      mesPenultimo = meses[n - 2];
      const tUlt = items.filter((i) => i.mesRef === mesUltimo).reduce((s, i) => s + i.valor, 0);
      const tPen = items.filter((i) => i.mesRef === mesPenultimo).reduce((s, i) => s + i.valor, 0);
      varMesAMes = calcVar(tUlt, tPen);
    }

    return {
      varPeriodoAnt: calcVar(totalGeral, totalAnt),
      varAnoAnt: calcVar(totalGeral, totalAno),
      labelPeriodoAnt: n === 1
        ? `${mesLongo(antInicio)} x ${mesLongo(primeiro)}`
        : `${mesLongo(antInicio)} a ${mesLongo(antFim)} x ${mesLongo(primeiro)} a ${mesLongo(ultimo)}`,
      labelAnoAnt: n === 1
        ? `${mesLongo(anoAntInicio)} x ${mesLongo(primeiro)}`
        : `${mesLongo(anoAntInicio)} a ${mesLongo(anoAntFim)} x ${mesLongo(primeiro)} a ${mesLongo(ultimo)}`,
      totalPeriodoAnt: totalAnt,
      totalAnoAnt: totalAno,
      varMesAMes,
      mesUltimo,
      mesPenultimo,
    };
  }, [meses, items, totalGeral]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Total no período</div><div className={`text-2xl font-semibold mt-1 ${colorTotal}`}>{brl(totalGeral)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Média mensal</div><div className="text-2xl font-semibold mt-1">{brl(mediaMensal)}</div></Card>
        <Card>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Evolução no período</div>
          {meses.length >= 2 ? (
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={meses.map((m) => ({ mes: mesRefBR(m), valor: totaisMes[m] || 0 }))} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                <XAxis dataKey="mes" stroke="var(--chart-axis)" fontSize={9} tickLine={false} axisLine={false} interval={meses.length > 6 ? Math.floor(meses.length / 4) : 0} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 6, fontSize: 11, color: "var(--chart-tooltip-text)" }}
                  itemStyle={{ color: "var(--chart-tooltip-text)" }}
                  labelStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 600 }}
                  formatter={(v: number) => brl(v)}
                />
                <Line type="linear" dataKey="valor" stroke={lineColor} strokeWidth={2} dot={{ r: 3, fill: lineColor }} name={mode === "receita" ? "Receitas" : "Despesas"} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-zinc-500 py-4 text-center">Selecione 2+ meses</div>
          )}
        </Card>
        <Card>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Top 5 categorias</div>
          {(() => {
            const catData = Object.entries(
              filtered.reduce<Record<string, number>>((acc, i) => { acc[i.categoria] = (acc[i.categoria] || 0) + i.valor; return acc; }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, valor]) => ({ name, valor }));
            const cores = ["#3B82F6","#22C55E","#F59E0B","#8B5CF6","#EF4444"];
            if (catData.length === 0) return <div className="text-sm text-zinc-500 py-4 text-center">Sem dados</div>;
            const h = Math.max(80, catData.length * 22);
            return (
              <ResponsiveContainer width="100%" height={h}>
                <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" stroke="var(--chart-axis)" fontSize={10} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 6, fontSize: 11, color: "var(--chart-tooltip-text)" }}
                    itemStyle={{ color: "var(--chart-tooltip-text)" }}
                    labelStyle={{ color: "var(--chart-tooltip-text)", fontWeight: 600 }}
                    formatter={(v: number) => brl(v)}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} name="Total">
                    {catData.map((_, i) => <Cell key={i} fill={cores[i % cores.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </Card>
      </div>

      {/* Informativo mês a mês — só com exatamente 2 meses consecutivos */}
      {meses.length === 2 && mesUltimo && mesPenultimo && (() => {
        const [y1, m1] = mesPenultimo.split("-").map(Number);
        const [y2, m2] = mesUltimo.split("-").map(Number);
        const consecutivo = (y2 * 12 + m2) - (y1 * 12 + m1) === 1;
        if (!consecutivo) return null;
        return (
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
            varMesAMes > 0 ? upBg : varMesAMes < 0 ? downBg : "bg-surface2 text-zinc-400"
          }`}>
            {varMesAMes > 0 ? <TrendingUp size={16} /> : varMesAMes < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
            <span>
              <span className="font-medium">{mesRefBR(mesUltimo)}</span>
              {varMesAMes > 0
                ? ` ${mode === "receita" ? "recebeu" : "gastou"} ${Math.abs(varMesAMes).toFixed(1)}% a mais que `
                : varMesAMes < 0
                  ? ` ${mode === "receita" ? "recebeu" : "gastou"} ${Math.abs(varMesAMes).toFixed(1)}% a menos que `
                  : ` manteve o mesmo ${mode === "receita" ? "valor" : "gasto"} que `}
              <span className="font-medium">{mesRefBR(mesPenultimo)}</span>
            </span>
          </div>
        );
      })()}

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
                        <td className={`text-right text-xs ${delta > 0 ? upColor : delta < 0 ? downColor : "text-zinc-500"}`}>
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
