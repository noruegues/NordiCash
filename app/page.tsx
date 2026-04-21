"use client";
import KpiCard from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import AreaFlow from "@/components/charts/AreaFlow";
import PieCategoria from "@/components/charts/PieCategoria";
import PatrimonioEvolucao from "@/components/charts/PatrimonioEvolucao";
import { brl, dataBR } from "@/lib/format";
import { useStore } from "@/lib/store";
import { TrendingUp, TrendingDown, Wallet, LineChart } from "lucide-react";
import { useMemo, useState } from "react";

type Periodo = "todos" | "mes" | "3m" | "6m" | "ano" | "custom";

function inPeriodo(mesRef: string, periodo: Periodo, custom?: { from: string; to: string }) {
  if (periodo === "todos") return true;
  const hoje = new Date();
  const hojeRef = hoje.toISOString().slice(0, 7);
  if (periodo === "mes") return mesRef === hojeRef;
  if (periodo === "3m" || periodo === "6m") {
    const meses = periodo === "3m" ? 3 : 6;
    const limite = new Date(hoje.getFullYear(), hoje.getMonth() - meses + 1, 1);
    const limiteRef = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, "0")}`;
    return mesRef >= limiteRef && mesRef <= hojeRef;
  }
  if (periodo === "ano") return mesRef.slice(0, 4) === String(hoje.getFullYear());
  if (periodo === "custom" && custom?.from && custom?.to) {
    return mesRef >= custom.from && mesRef <= custom.to;
  }
  return true;
}

export default function Dashboard() {
  const { receitas, despesas, investimentos, contas, bens, consorcios } = useStore();
  const [periodo, setPeriodo] = useState<Periodo>("ano");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [incluirEmprestados, setIncluirEmprestados] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<"tudo" | "pago" | "provisionado">("tudo");

  // Até o mês atual (inclusive). Valores projetados em meses futuros não entram no realizado:
  // - Receitas: só as já recebidas (mesRef <= mês atual)
  // - Despesas não-cartão: só as já pagas (mesRef <= mês atual)
  // - Despesas de cartão: todas (o gasto já foi efetivado no cartão, mesmo que a fatura seja futura)
  const mesAtual = new Date().toISOString().slice(0, 7);

  const recF = useMemo(
    () => receitas.filter((r) => {
      if (!incluirEmprestados && r.emprestado) return false;
      return r.mesRef <= mesAtual && inPeriodo(r.mesRef, periodo, custom);
    }),
    [receitas, periodo, custom, mesAtual, incluirEmprestados]
  );
  const desF = useMemo(
    () => despesas.filter((d) => {
      if (!incluirEmprestados && d.emprestado) return false;
      const dentroPeriodo = inPeriodo(d.mesRef, periodo, custom);
      if (!dentroPeriodo) return false;
      if (d.cartaoId) return true;
      return d.mesRef <= mesAtual;
    }),
    [despesas, periodo, custom, mesAtual, incluirEmprestados]
  );

  const totalReceita = recF.reduce((s, r) => s + r.valor, 0);
  const totalDespesa = desF.reduce((s, d) => s + d.valor, 0);
  const saldo = totalReceita - totalDespesa;
  const totalInv = investimentos.reduce((s, i) => s + i.saldoAtual, 0);

  // Calcular deltas: compara período atual com período anterior de mesma duração
  const { deltaReceita, deltaDespesa, deltaSaldo, deltaInv, deltaLabel } = useMemo(() => {
    function calcDelta(atual: number, anterior: number): number | undefined {
      if (anterior === 0 && atual === 0) return undefined;
      if (anterior === 0) return atual > 0 ? 100 : -100;
      return ((atual - anterior) / Math.abs(anterior)) * 100;
    }

    // Coleta meses únicos do período filtrado, ordenados
    const mesesRec = recF.map((r) => r.mesRef);
    const mesesDes = desF.map((d) => d.mesRef);
    const mesesPeriodo = [...new Set([...mesesRec, ...mesesDes])].sort();

    if (mesesPeriodo.length === 0) return { deltaReceita: undefined, deltaDespesa: undefined, deltaSaldo: undefined, deltaInv: undefined, deltaLabel: "" };

    // Se período = 1 mês, compara com mês anterior
    // Se período = N meses, divide ao meio e compara primeira metade vs segunda metade
    if (mesesPeriodo.length === 1) {
      const mes = mesesPeriodo[0];
      const d = new Date(mes + "-01");
      d.setMonth(d.getMonth() - 1);
      const mesAnt = d.toISOString().slice(0, 7);
      const recAtual = receitas.filter((r) => r.mesRef === mes).reduce((s, r) => s + r.valor, 0);
      const recAnterior = receitas.filter((r) => r.mesRef === mesAnt).reduce((s, r) => s + r.valor, 0);
      const desAtual = despesas.filter((dd) => dd.mesRef === mes).reduce((s, dd) => s + dd.valor, 0);
      const desAnterior = despesas.filter((dd) => dd.mesRef === mesAnt).reduce((s, dd) => s + dd.valor, 0);
      return {
        deltaReceita: calcDelta(recAtual, recAnterior),
        deltaDespesa: calcDelta(desAtual, desAnterior),
        deltaSaldo: calcDelta(recAtual - desAtual, recAnterior - desAnterior),
        deltaInv: undefined,
        deltaLabel: "vs mês anterior",
      };
    }

    // Múltiplos meses: segunda metade vs primeira metade
    const mid = Math.floor(mesesPeriodo.length / 2);
    const firstHalf = mesesPeriodo.slice(0, mid);
    const secondHalf = mesesPeriodo.slice(mid);

    const recFirst = recF.filter((r) => firstHalf.includes(r.mesRef)).reduce((s, r) => s + r.valor, 0);
    const recSecond = recF.filter((r) => secondHalf.includes(r.mesRef)).reduce((s, r) => s + r.valor, 0);
    const desFirst = desF.filter((d) => firstHalf.includes(d.mesRef)).reduce((s, d) => s + d.valor, 0);
    const desSecond = desF.filter((d) => secondHalf.includes(d.mesRef)).reduce((s, d) => s + d.valor, 0);

    return {
      deltaReceita: calcDelta(recSecond, recFirst),
      deltaDespesa: calcDelta(desSecond, desFirst),
      deltaSaldo: calcDelta(recSecond - desSecond, recFirst - desFirst),
      deltaInv: undefined,
      deltaLabel: `2ª metade vs 1ª metade`,
    };
  }, [recF, desF, receitas, despesas]);

  const desCategoria = desF.filter((d) => {
    if (filtroCategoria === "pago") return d.pago;
    if (filtroCategoria === "provisionado") return !d.pago;
    return true;
  });
  const porCategoria = Object.entries(
    desCategoria.reduce<Record<string, number>>((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Fluxo agregado por mês — usa TODAS as receitas/despesas (incluindo futuras) filtradas só pelo período
  const allRecPeriodo = useMemo(
    () => receitas.filter((r) => {
      if (!incluirEmprestados && r.emprestado) return false;
      return inPeriodo(r.mesRef, periodo, custom);
    }),
    [receitas, periodo, custom, incluirEmprestados]
  );
  const allDesPeriodo = useMemo(
    () => despesas.filter((d) => {
      if (!incluirEmprestados && d.emprestado) return false;
      return inPeriodo(d.mesRef, periodo, custom);
    }),
    [despesas, periodo, custom, incluirEmprestados]
  );
  const emptyFluxo = () => ({ receitaRecebida: 0, receitaEmprestimo: 0, receitaProv: 0, despesaPaga: 0, despesaProv: 0 });
  const fluxoMap = new Map<string, ReturnType<typeof emptyFluxo>>();
  // Pré-popula meses do período (mesmo sem dados) para que o eixo X mostre o range completo
  const mesesPeriodo = (() => {
    const hoje = new Date();
    const rangeMeses = (startY: number, startM: number, endY: number, endM: number) => {
      const out: string[] = [];
      const d = new Date(startY, startM, 1);
      const end = new Date(endY, endM, 1);
      while (d <= end) {
        out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        d.setMonth(d.getMonth() + 1);
      }
      return out;
    };
    if (periodo === "mes") return [hoje.toISOString().slice(0, 7)];
    if (periodo === "3m") return rangeMeses(hoje.getFullYear(), hoje.getMonth() - 2, hoje.getFullYear(), hoje.getMonth());
    if (periodo === "6m") return rangeMeses(hoje.getFullYear(), hoje.getMonth() - 5, hoje.getFullYear(), hoje.getMonth());
    if (periodo === "ano") return rangeMeses(hoje.getFullYear(), 0, hoje.getFullYear(), hoje.getMonth());
    if (periodo === "custom" && custom.from && custom.to) {
      const [fy, fm] = custom.from.split("-").map(Number);
      const [ty, tm] = custom.to.split("-").map(Number);
      return rangeMeses(fy, fm - 1, ty, tm - 1);
    }
    return [] as string[];
  })();
  mesesPeriodo.forEach((m) => fluxoMap.set(m, emptyFluxo()));
  allRecPeriodo.forEach((r) => {
    const cur = fluxoMap.get(r.mesRef) || emptyFluxo();
    if (r.mesRef <= mesAtual) {
      if (r.emprestado) cur.receitaEmprestimo += r.valor;
      else cur.receitaRecebida += r.valor;
    } else {
      cur.receitaProv += r.valor;
    }
    fluxoMap.set(r.mesRef, cur);
  });
  allDesPeriodo.forEach((d) => {
    const cur = fluxoMap.get(d.mesRef) || emptyFluxo();
    if (d.pago) cur.despesaPaga += d.valor;
    else cur.despesaProv += d.valor;
    fluxoMap.set(d.mesRef, cur);
  });
  const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const fmtMes = (mesRef: string) => {
    const [y, m] = mesRef.split("-").map(Number);
    return `${MESES_ABREV[m - 1]}${String(y).slice(2)}`;
  };
  const fluxo = Array.from(fluxoMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({ mes: fmtMes(mes), ...v }));

  // Evolução do patrimônio líquido por mês (retroativa).
  // Só saldoContas varia mês a mês (reflete fluxo de caixa).
  // Investimentos / bens / consórcios contemplados entram como valor atual (não há histórico).
  const totalInvAtual = investimentos.reduce((s, i) => s + i.saldoAtual, 0);
  const totalBensAtual = bens.reduce((s, b) => s + b.valorMercado, 0);
  const totalDividasAtual = bens.reduce((s, b) => s + b.dividaRestante, 0);
  const totalConsContemplados = consorcios
    .filter((c) => c.contemplado)
    .reduce((s, c) => s + c.valorCarta, 0);
  const saldoInicialContas = contas.reduce((s, c) => s + c.saldoInicial, 0);
  const patrimonioSerie = mesesPeriodo
    .filter((m) => m <= mesAtual)
    .map((m) => {
      const entradas = receitas.filter((r) => r.mesRef <= m).reduce((s, r) => s + r.valor, 0);
      const saidas = despesas.filter((d) => !d.cartaoId && d.mesRef <= m).reduce((s, d) => s + d.valor, 0);
      const saldoContasM = saldoInicialContas + entradas - saidas;
      const patrimonio = saldoContasM + totalInvAtual + totalBensAtual - totalDividasAtual + totalConsContemplados;
      return { mes: fmtMes(m), patrimonio: Math.round(patrimonio * 100) / 100 };
    });

  const periodos: { key: Periodo; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "mes", label: "Este mês" },
    { key: "3m", label: "3 meses" },
    { key: "6m", label: "6 meses" },
    { key: "ano", label: "Ano" },
    { key: "custom", label: "Personalizado" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {periodos.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                className={`btn btn-sm ${periodo === p.key ? "btn-primary" : "btn-ghost"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {periodo === "custom" && (
        <Card>
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="label">De (mês)</label>
              <input type="month" className="input" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
            </div>
            <div>
              <label className="label">Até (mês)</label>
              <input type="month" className="input" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receitas" value={brl(totalReceita)} icon={<TrendingUp size={18} />} accent />
        <KpiCard label="Despesas" value={brl(totalDespesa)} icon={<TrendingDown size={18} />} />
        <KpiCard label="Saldo" value={brl(saldo)} valueClass={saldo < 0 ? "text-danger" : undefined} icon={<Wallet size={18} />} />
        <KpiCard label="Investimentos" value={brl(totalInv)} icon={<LineChart size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title={
            <div className="flex items-center gap-3">
              <span>Fluxo mensal</span>
              <label className={`flex items-center gap-1.5 text-xs cursor-pointer select-none px-2 py-1 rounded transition ${incluirEmprestados ? "text-loan" : "text-zinc-500"}`}>
                <input
                  type="checkbox"
                  checked={incluirEmprestados}
                  onChange={(e) => setIncluirEmprestados(e.target.checked)}
                  className="accent-loan"
                />
                Visualizar dados com valores emprestado
              </label>
            </div>
          }
          className="lg:col-span-2"
        >
          {fluxo.length ? <AreaFlow data={fluxo} /> : <Empty />}
        </Card>
        <Card
          title={
            <div className="flex items-center justify-between gap-3 w-full">
              <span>Despesas por categoria</span>
              <div className="flex rounded border border-border overflow-hidden text-[11px]">
                {([
                  { k: "tudo", l: "Tudo" },
                  { k: "pago", l: "Pago" },
                  { k: "provisionado", l: "Provisionado" },
                ] as const).map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => setFiltroCategoria(o.k)}
                    className={`px-2 py-1 ${filtroCategoria === o.k ? "bg-primary text-white" : "text-zinc-400 hover:bg-surface2"} ${o.k !== "tudo" ? "border-l border-border" : ""}`}
                  >{o.l}</button>
                ))}
              </div>
            </div>
          }
        >
          {porCategoria.length ? <PieCategoria data={porCategoria} showPercent /> : <Empty />}
        </Card>
      </div>

      <Card
        title={
          <div className="flex items-center gap-3">
            <span>Evolução do patrimônio líquido</span>
            {patrimonioSerie.length > 1 && (() => {
              const ini = patrimonioSerie[0].patrimonio;
              const fim = patrimonioSerie.at(-1)!.patrimonio;
              const delta = fim - ini;
              const pos = delta >= 0;
              return (
                <span className={`text-xs font-medium ${pos ? "text-success" : "text-danger"}`}>
                  {pos ? "+" : ""}{brl(delta)} no período
                </span>
              );
            })()}
          </div>
        }
      >
        {patrimonioSerie.length ? <PatrimonioEvolucao data={patrimonioSerie} /> : <Empty />}
      </Card>

      <Card title="Últimas transações">
        {desF.length ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="t min-w-[560px]">
              <thead>
                <tr><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Data</th><th className="text-right">Valor</th></tr>
              </thead>
              <tbody>
                {desF.slice(-8).reverse().map((d) => (
                  <tr key={d.id}>
                    <td>{d.descricao}</td>
                    <td><span className="pill pill-muted">{d.categoria}</span></td>
                    <td className="text-zinc-400">{d.forma}</td>
                    <td className="text-zinc-500">{dataBR(d.data)}</td>
                    <td className={`text-right font-medium ${d.emprestado ? "text-loan" : ""}`}>{brl(d.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty />}
      </Card>
    </div>
  );
}

function Empty() {
  return <div className="text-center text-sm text-zinc-500 py-10">Sem dados no período selecionado</div>;
}
