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

  // Até o mês atual (inclusive). Valores projetados em meses futuros não entram no realizado:
  // - Receitas: só as já recebidas (mesRef <= mês atual)
  // - Despesas não-cartão: só as já pagas (mesRef <= mês atual)
  // - Despesas de cartão: todas (o gasto já foi efetivado no cartão, mesmo que a fatura seja futura)
  const mesAtual = new Date().toISOString().slice(0, 7);

  const recF = useMemo(
    () => receitas.filter((r) => r.mesRef <= mesAtual && inPeriodo(r.mesRef, periodo, custom)),
    [receitas, periodo, custom, mesAtual]
  );
  const desF = useMemo(
    () => despesas.filter((d) => {
      const dentroPeriodo = inPeriodo(d.mesRef, periodo, custom);
      if (!dentroPeriodo) return false;
      // cartão: sempre conta; outras formas: só até hoje
      if (d.cartaoId) return true;
      return d.mesRef <= mesAtual;
    }),
    [despesas, periodo, custom, mesAtual]
  );

  const totalReceita = recF.reduce((s, r) => s + r.valor, 0);
  const totalDespesa = desF.reduce((s, d) => s + d.valor, 0);
  const saldo = totalReceita - totalDespesa;
  const totalInv = investimentos.reduce((s, i) => s + i.saldoAtual, 0);

  // Calcular deltas reais: mês atual vs mês anterior
  const mesAnterior = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }, []);

  const recMesAtual = receitas.filter((r) => r.mesRef === mesAtual).reduce((s, r) => s + r.valor, 0);
  const recMesAnterior = receitas.filter((r) => r.mesRef === mesAnterior).reduce((s, r) => s + r.valor, 0);
  const desMesAtual = despesas.filter((d) => d.mesRef === mesAtual).reduce((s, d) => s + d.valor, 0);
  const desMesAnterior = despesas.filter((d) => d.mesRef === mesAnterior).reduce((s, d) => s + d.valor, 0);
  const saldoMesAtual = recMesAtual - desMesAtual;
  const saldoMesAnterior = recMesAnterior - desMesAnterior;

  function calcDelta(atual: number, anterior: number): number | undefined {
    if (anterior === 0 && atual === 0) return undefined;
    if (anterior === 0) return atual > 0 ? 100 : -100;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  }

  const deltaReceita = calcDelta(recMesAtual, recMesAnterior);
  const deltaDespesa = calcDelta(desMesAtual, desMesAnterior);
  const deltaSaldo = calcDelta(saldoMesAtual, saldoMesAnterior);
  const deltaInv = undefined; // investimentos não têm comparação mensal simples

  const porCategoria = Object.entries(
    desF.reduce<Record<string, number>>((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Fluxo agregado por mês
  const fluxoMap = new Map<string, { receita: number; despesa: number }>();
  recF.forEach((r) => {
    const cur = fluxoMap.get(r.mesRef) || { receita: 0, despesa: 0 };
    cur.receita += r.valor;
    fluxoMap.set(r.mesRef, cur);
  });
  desF.forEach((d) => {
    const cur = fluxoMap.get(d.mesRef) || { receita: 0, despesa: 0 };
    cur.despesa += d.valor;
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
        <KpiCard label="Receitas" value={brl(totalReceita)} delta={deltaReceita} icon={<TrendingUp size={18} />} accent />
        <KpiCard label="Despesas" value={brl(totalDespesa)} delta={deltaDespesa} icon={<TrendingDown size={18} />} />
        <KpiCard label="Saldo" value={brl(saldo)} delta={deltaSaldo} icon={<Wallet size={18} />} />
        <KpiCard label="Investimentos" value={brl(totalInv)} delta={deltaInv} icon={<LineChart size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Fluxo mensal" className="lg:col-span-2">
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
