"use client";
import KpiCard from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import AreaFlow from "@/components/charts/AreaFlow";
import PieCategoria from "@/components/charts/PieCategoria";
import { brl, dataBR } from "@/lib/format";
import { useStore } from "@/lib/store";
import { TrendingUp, TrendingDown, Wallet, LineChart } from "lucide-react";
import { useMemo, useState } from "react";

type Periodo = "todos" | "mes" | "3m" | "6m" | "ano" | "custom";

function inPeriodo(mesRef: string, periodo: Periodo, custom?: { from: string; to: string }) {
  if (periodo === "todos") return true;
  const hoje = new Date();
  const ref = new Date(mesRef + "-01");
  if (periodo === "mes") return mesRef === hoje.toISOString().slice(0, 7);
  if (periodo === "3m" || periodo === "6m") {
    const meses = periodo === "3m" ? 3 : 6;
    const limite = new Date(hoje.getFullYear(), hoje.getMonth() - meses + 1, 1);
    return ref >= limite;
  }
  if (periodo === "ano") return ref.getFullYear() === hoje.getFullYear();
  if (periodo === "custom" && custom?.from && custom?.to) {
    return mesRef >= custom.from && mesRef <= custom.to;
  }
  return true;
}

export default function Dashboard() {
  const { receitas, despesas, investimentos } = useStore();
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [incluirEmprestados, setIncluirEmprestados] = useState(false);

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

  const porCategoria = Object.entries(
    desF.reduce<Record<string, number>>((acc, d) => {
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
  const fluxo = Array.from(fluxoMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({ mes: mes.slice(5), ...v }));

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
        <KpiCard label="Receitas" value={brl(totalReceita)} delta={deltaReceita} deltaLabel={deltaLabel} icon={<TrendingUp size={18} />} accent />
        <KpiCard label="Despesas" value={brl(totalDespesa)} delta={deltaDespesa} deltaLabel={deltaLabel} icon={<TrendingDown size={18} />} />
        <KpiCard label="Saldo" value={brl(saldo)} delta={deltaSaldo} deltaLabel={deltaLabel} icon={<Wallet size={18} />} />
        <KpiCard label="Investimentos" value={brl(totalInv)} delta={deltaInv} icon={<LineChart size={18} />} />
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
        <Card title="Despesas por categoria">
          {porCategoria.length ? <PieCategoria data={porCategoria} showPercent /> : <Empty />}
        </Card>
      </div>

      <Card title="Últimas transações">
        {desF.length ? (
          <table className="t">
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
        ) : <Empty />}
      </Card>
    </div>
  );
}

function Empty() {
  return <div className="text-center text-sm text-zinc-500 py-10">Sem dados no período selecionado</div>;
}
