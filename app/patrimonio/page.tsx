"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import PieCategoria from "@/components/charts/PieCategoria";
import LineProjecao from "@/components/charts/LineProjecao";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend } from "recharts";
import { useStore, type Bem } from "@/lib/store";
import { projecaoPortfolio } from "@/lib/calculations";
import { brl } from "@/lib/format";
import MoneyInput from "@/components/ui/MoneyInput";
import NumberInput from "@/components/ui/NumberInput";
import { Wallet, Plus, Pencil, Trash2, TrendingUp, TrendingDown, Landmark, Info, RefreshCw } from "lucide-react";
import { useIndicadores } from "@/lib/indicadores";
import ExportButton from "@/components/ui/ExportButton";
import { exportPDF, exportExcel } from "@/lib/export";

// Taxas padrão por tipo (% a.a.)
const TAXA_PADRAO: Record<Bem["tipo"], { taxa: number; comportamento: "valoriza" | "desvaloriza" }> = {
  Imóvel: { taxa: 6, comportamento: "valoriza" },
  Veículo: { taxa: -10, comportamento: "desvaloriza" }, // ~10% a.a. de desvalorização média
  Moto: { taxa: -8, comportamento: "desvaloriza" },
  Outros: { taxa: 0, comportamento: "valoriza" },
};

function projetarBem(b: Bem, anos: number) {
  const taxa = (b.taxaAnual ?? TAXA_PADRAO[b.tipo].taxa) / 100;
  return b.valorMercado * Math.pow(1 + taxa, anos);
}

export default function PatrimonioPage() {
  const { bens, investimentos, consorcios, contas, receitas, despesas, addBem, updateBem, removeBem } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bem | null>(null);

  // Indicadores econômicos atuais
  const indicadores = useIndicadores();

  // Base: Selic → taxa mensal equivalente
  const selicMensal = Math.pow(1 + indicadores.selic / 100, 1 / 12) - 1;

  // Benchmark selecionado pelo usuário (default: CDI ~ Selic)
  type Benchmark = "selic" | "cdi" | "ipca" | "poupanca" | "custom";
  const [benchmark, setBenchmark] = useState<Benchmark>("selic");
  const [taxaCustomAA, setTaxaCustomAA] = useState(12); // % a.a.
  const [horizonteAnos, setHorizonteAnos] = useState(5);
  const [aporteExtra, setAporteExtra] = useState(0);
  const [considerarIpca, setConsiderarIpca] = useState(true); // retorno real (descontar inflação)

  const taxaAnualNominal = useMemo(() => {
    switch (benchmark) {
      case "selic": return indicadores.selic;
      case "cdi": return indicadores.cdi;
      case "ipca": return indicadores.ipca + 5; // ex.: Tesouro IPCA+5
      case "poupanca": return indicadores.poupanca;
      case "custom": return taxaCustomAA;
    }
  }, [benchmark, indicadores, taxaCustomAA]);

  // Retorno real = (1 + nominal) / (1 + inflação) - 1
  const taxaAnualReal = considerarIpca
    ? ((1 + taxaAnualNominal / 100) / (1 + indicadores.ipca / 100) - 1) * 100
    : taxaAnualNominal;

  const taxaProj = Math.pow(1 + taxaAnualReal / 100, 1 / 12) - 1;

  // Saldo real consolidado das contas, só até o mês atual (não infla com valores projetados)
  const mesAtual = new Date().toISOString().slice(0, 7);
  const saldoContas = useMemo(() => {
    let total = 0;
    for (const c of contas) {
      const e = receitas
        .filter((r) => r.contaId === c.id && r.mesRef <= mesAtual)
        .reduce((s, r) => s + r.valor, 0);
      const s2 = despesas
        .filter((d) => d.contaId === c.id && !d.cartaoId && d.mesRef <= mesAtual)
        .reduce((s, d) => s + d.valor, 0);
      total += c.saldoInicial + e - s2;
    }
    return total;
  }, [contas, receitas, despesas, mesAtual]);

  const totalBens = bens.reduce((s, b) => s + b.valorMercado, 0);
  const totalDividas = bens.reduce((s, b) => s + b.dividaRestante, 0);
  const totalInv = investimentos.reduce((s, i) => s + i.saldoAtual, 0);

  // Consórcios: patrimônio ATUAL só conta os contemplados (carta de crédito obtida)
  // Não contemplados entram apenas na projeção futura
  const totalConsorciosContemplados = consorcios
    .filter((c) => c.contemplado)
    .reduce((s, c) => s + c.valorCarta, 0);
  const patrimonioAtual = totalBens - totalDividas + totalInv + totalConsorciosContemplados + saldoContas;

  // Projeção investimentos com aporte extra opcional
  const projInvData = useMemo(() => {
    const ajustado = investimentos.map((i) => ({ ...i, aporteMensal: i.aporteMensal + aporteExtra / Math.max(1, investimentos.length) }));
    return projecaoPortfolio(ajustado, taxaProj, horizonteAnos * 12);
  }, [investimentos, taxaProj, horizonteAnos, aporteExtra]);

  const projInvFinal = projInvData.at(-1)?.valor ?? totalInv;

  // Projeção bens individual (cada bem com sua própria taxa)
  const bensProj = useMemo(
    () =>
      bens.map((b) => {
        const futuro = projetarBem(b, horizonteAnos);
        const delta = futuro - b.valorMercado;
        const taxa = b.taxaAnual ?? TAXA_PADRAO[b.tipo].taxa;
        return { ...b, futuro, delta, taxa };
      }),
    [bens, horizonteAnos]
  );

  const totalBensFuturo = bensProj.reduce((s, b) => s + b.futuro, 0);

  // Consórcio projetado: simula que o usuário continua pagando.
  // Ao final do horizonte, se não contemplou ainda, conta totalPago acumulado.
  // Se contemplou (ou contempla durante simulação), conta a carta.
  const consorciosProj = useMemo(() => {
    const mesesProj = horizonteAnos * 12;
    return consorcios.map((c) => {
      if (c.contemplado) {
        // Já contemplado: tem a carta. Valor = valorCarta.
        return { ...c, valorAtual: c.valorCarta, valorFuturo: c.valorCarta };
      }
      // Não contemplado: patrimônio atual = 0 (não tem a carta).
      // Projeção futura: simula pagamentos continuando. Se termina no horizonte, assume carta.
      const pagas = c.parcelas.filter((p) => p.status === "Pago").length;
      const totalPago = c.parcelas.filter((p) => p.status === "Pago").reduce((s, p) => s + p.valor, 0);
      const reducao = c.pagamentoReduzido === false ? 1 : (c.percentualReducao ?? 0.5);
      const parcelaMensal = c.parcelaCheia * reducao;
      const parcelasApagar = Math.min(c.prazoMeses - pagas, mesesProj);
      const pagamentoFuturo = totalPago + parcelaMensal * parcelasApagar;
      // Se com N meses de pagamento termina o consórcio ou assume contemplação no horizonte
      const terminaNoHorizonte = pagas + parcelasApagar >= c.prazoMeses;
      const valorFuturo = terminaNoHorizonte ? c.valorCarta : pagamentoFuturo;
      return { ...c, valorAtual: 0, valorFuturo };
    });
  }, [consorcios, horizonteAnos]);

  const totalConsFuturo = consorciosProj.reduce((s, c) => s + c.valorFuturo, 0);
  const patrimonioFuturo = projInvFinal + totalBensFuturo - totalDividas + totalConsFuturo + saldoContas;

  const composicao = [
    { name: "Investimentos", value: totalInv },
    { name: "Bens", value: totalBens - totalDividas },
    { name: "Consórcios", value: totalConsorciosContemplados },
    { name: "Contas", value: saldoContas },
  ];

  // Gráfico de barras para consórcios: atual vs projetado
  const barConsorcioData = consorciosProj.map((c) => ({
    name: `${c.bem} · ${c.administradora}`.length > 18 ? `${c.bem}`.slice(0, 16) + "…" : `${c.bem} · ${c.administradora}`,
    Atual: Math.round(c.valorAtual),
    Projetado: Math.round(c.valorFuturo),
  }));

  const grouped = bens.reduce<Record<string, Bem[]>>((acc, b) => {
    (acc[b.tipo] ||= []).push(b);
    return acc;
  }, {});

  const barData = bensProj.map((b) => ({
    name: b.nome.length > 14 ? b.nome.slice(0, 12) + "…" : b.nome,
    Atual: Math.round(b.valorMercado),
    Projetado: Math.round(b.futuro),
    valoriza: b.delta >= 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patrimônio"
        subtitle="Visão consolidada"
        action={
          <div className="flex items-center gap-2">
            <ExportButton
              onExportPDF={() => exportPDF({
                title: "Patrimônio — Bens", columns: [
                  { header: "Nome", key: "nome" }, { header: "Tipo", key: "tipo" },
                  { header: "Valor Compra", key: "valorCompra", format: "brl" },
                  { header: "Valor Mercado", key: "valorMercado", format: "brl" },
                  { header: "Dívida", key: "dividaRestante", format: "brl" },
                ],
                rows: bens, totals: { valorMercado: bens.reduce((s, b) => s + b.valorMercado, 0) },
                filename: `nordicash-patrimonio-${new Date().toISOString().slice(0, 7)}`,
              })}
              onExportExcel={() => exportExcel({
                title: "Patrimônio — Bens", columns: [
                  { header: "Nome", key: "nome" }, { header: "Tipo", key: "tipo" },
                  { header: "Valor Compra", key: "valorCompra", format: "brl" },
                  { header: "Valor Mercado", key: "valorMercado", format: "brl" },
                  { header: "Dívida", key: "dividaRestante", format: "brl" },
                ],
                rows: bens, totals: { valorMercado: bens.reduce((s, b) => s + b.valorMercado, 0) },
                filename: `nordicash-patrimonio-${new Date().toISOString().slice(0, 7)}`,
              })}
            />
            <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus size={16} /> Novo bem
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Patrimônio atual" value={brl(patrimonioAtual)} icon={<Wallet size={18} />} accent />
        <KpiCard label="Contas" value={brl(saldoContas)} icon={<Landmark size={18} />} />
        <KpiCard label="Investimentos" value={brl(totalInv)} icon={<Wallet size={18} />} />
        <KpiCard label="Bens líquidos" value={brl(totalBens - totalDividas)} icon={<Wallet size={18} />} />
        <KpiCard label="Dívidas" value={brl(totalDividas)} icon={<Wallet size={18} />} />
      </div>

      {/* Indicadores econômicos (BCB) */}
      <Card title="Indicadores econômicos · dados reais (Banco Central)" action={
        indicadores.updatedAt ? (
          <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
            <RefreshCw size={11} /> atualizado {new Date(indicadores.updatedAt).toLocaleDateString("pt-BR")}
          </span>
        ) : indicadores.loading ? (
          <span className="text-[11px] text-zinc-500">carregando…</span>
        ) : (
          <span className="text-[11px] text-warn">usando valores de fallback</span>
        )
      }>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <IndicadorCell label="Selic meta" value={`${indicadores.selic.toFixed(2)}% a.a.`} />
          <IndicadorCell label="CDI" value={`${indicadores.cdi.toFixed(2)}% a.a.`} />
          <IndicadorCell label="IPCA (12m)" value={`${indicadores.ipca.toFixed(2)}%`} />
          <IndicadorCell label="IGP-M (12m)" value={`${indicadores.igpm.toFixed(2)}%`} />
          <IndicadorCell label="Poupança" value={`${indicadores.poupanca.toFixed(2)}% a.a.`} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Composição">
          <PieCategoria data={composicao} />
        </Card>

        <Card title="Simulador de patrimônio futuro" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Benchmark de rendimento</label>
              <select className="select" value={benchmark} onChange={(e) => setBenchmark(e.target.value as Benchmark)}>
                <option value="selic">Selic ({indicadores.selic.toFixed(2)}% a.a.)</option>
                <option value="cdi">CDI ({indicadores.cdi.toFixed(2)}% a.a.)</option>
                <option value="ipca">Tesouro IPCA+ 5% ({(indicadores.ipca + 5).toFixed(2)}% a.a.)</option>
                <option value="poupanca">Poupança ({indicadores.poupanca.toFixed(2)}% a.a.)</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            {benchmark === "custom" ? (
              <div>
                <label className="label">Taxa a.a. (%)</label>
                <NumberInput decimal value={taxaCustomAA} onChange={(v) => setTaxaCustomAA(v ?? 0)} />
              </div>
            ) : (
              <div>
                <label className="label">Taxa mensal efetiva</label>
                <div className="input flex items-center justify-between text-zinc-300">
                  <span>{(taxaProj * 100).toFixed(3)}%</span>
                  <span className="text-xs text-zinc-500">{taxaAnualReal.toFixed(2)}% a.a. {considerarIpca ? "real" : "nominal"}</span>
                </div>
              </div>
            )}
            <div>
              <label className="label">Horizonte (anos): {horizonteAnos}</label>
              <input type="range" min={1} max={20} value={horizonteAnos} onChange={(e) => setHorizonteAnos(parseInt(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <label className="label">Aporte mensal extra</label>
              <MoneyInput value={aporteExtra} onChange={(v) => setAporteExtra(v)} />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input type="checkbox" checked={considerarIpca} onChange={(e) => setConsiderarIpca(e.target.checked)} />
                Descontar inflação (IPCA) — projetar em valor real
              </label>
              <div className="text-xs text-zinc-500 mt-1 inline-flex items-start gap-1">
                <Info size={11} className="mt-0.5 shrink-0" />
                Saldo de contas é considerado estável (liquidez parada, sem rendimento). Bens usam a taxa individual de cada item.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            <div className="card"><div className="card-body !p-3"><div className="text-xs text-zinc-500">Atual</div><div className="font-semibold text-base" data-money>{brl(patrimonioAtual)}</div></div></div>
            <div className="card border-primary/30"><div className="card-body !p-3"><div className="text-xs text-primary">Projetado ({horizonteAnos}a)</div><div className="font-semibold text-base" data-money>{brl(patrimonioFuturo)}</div></div></div>
            <div className="card"><div className="card-body !p-3"><div className="text-xs text-success">Ganho projetado</div><div className="font-semibold text-base text-success" data-money>+{brl(patrimonioFuturo - patrimonioAtual)}</div></div></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={`Projeção de investimentos · ${horizonteAnos} anos`}>
          {projInvData.length > 1 ? <LineProjecao data={projInvData} /> : <div className="text-sm text-zinc-500 py-6 text-center">Sem dados</div>}
        </Card>

        <Card title={`Valorização / Desvalorização dos bens · ${horizonteAnos} anos`}>
          {bensProj.length === 0 ? (
            <div className="text-sm text-zinc-500 py-6 text-center">Cadastre bens para visualizar</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 6, fontSize: 12, color: "var(--chart-tooltip-text)" }}
                  formatter={(v: number) => `R$ ${Number(v).toLocaleString("pt-BR")}`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Atual" fill="#64748B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Projetado" radius={[6, 6, 0, 0]}>
                  {barData.map((b, i) => <Cell key={i} fill={b.valoriza ? "#22C55E" : "#EF4444"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {consorciosProj.length > 0 && (
        <Card title={`Consórcios · Projeção ${horizonteAnos} anos`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barConsorcioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--chart-axis)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 6, fontSize: 12, color: "var(--chart-tooltip-text)" }}
                formatter={(v: number) => `R$ ${Number(v).toLocaleString("pt-BR")}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Atual" fill="#64748B" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Projetado" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 overflow-x-auto">
            <table className="t">
              <thead><tr><th>Consórcio</th><th>Status</th><th className="text-right">Carta</th><th className="text-right">Atual</th><th className="text-right">Projetado ({horizonteAnos}a)</th></tr></thead>
              <tbody>
                {consorciosProj.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.bem} · {c.administradora}</td>
                    <td>{c.contemplado ? <span className="pill pill-success">Contemplado</span> : <span className="pill pill-muted">Pagando</span>}</td>
                    <td className="text-right">{brl(c.valorCarta)}</td>
                    <td className="text-right">{brl(c.valorAtual)}</td>
                    <td className="text-right font-semibold text-success">{brl(c.valorFuturo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {bensProj.length > 0 && (
        <Card title="Acompanhamento — valorização / desvalorização">
          <div className="overflow-x-auto">
            <table className="t min-w-[720px]">
              <thead>
                <tr>
                  <th>Bem</th>
                  <th>Tipo</th>
                  <th className="text-right">Valor atual</th>
                  <th className="text-right">Taxa a.a.</th>
                  <th className="text-right">Projetado ({horizonteAnos}a)</th>
                  <th className="text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {bensProj.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium">{b.nome}</td>
                    <td><span className="pill pill-muted">{b.tipo}</span></td>
                    <td className="text-right">{brl(b.valorMercado)}</td>
                    <td className={`text-right font-semibold ${b.taxa >= 0 ? "text-success" : "text-danger"}`}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        {b.taxa >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {b.taxa.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right">{brl(b.futuro)}</td>
                    <td className={`text-right font-semibold ${b.delta >= 0 ? "text-success" : "text-danger"}`}>
                      {b.delta >= 0 ? "+" : ""}{brl(b.delta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="Bens cadastrados">
        {bens.length === 0 ? (
          <div className="text-sm text-zinc-500 py-6 text-center">Nenhum bem cadastrado</div>
        ) : (
          Object.entries(grouped).map(([tipo, list]) => (
            <div key={tipo} className="mb-6 last:mb-0">
              <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{tipo}</div>
              <table className="t">
                <thead><tr><th>Nome</th><th className="text-right">Compra</th><th className="text-right">Mercado</th><th className="text-right">Dívida</th><th className="text-right">Líquido</th><th></th></tr></thead>
                <tbody>
                  {list.map((b) => (
                    <tr key={b.id}>
                      <td className="font-medium">{b.nome}</td>
                      <td className="text-right">{brl(b.valorCompra)}</td>
                      <td className="text-right">{brl(b.valorMercado)}</td>
                      <td className="text-right text-danger">{brl(b.dividaRestante)}</td>
                      <td className="text-right text-success font-semibold">{brl(b.valorMercado - b.dividaRestante)}</td>
                      <td className="text-right">
                        <div className="inline-flex gap-1">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditing(b); setOpen(true); }}><Pencil size={13} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => confirm("Apagar bem?") && removeBem(b.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </Card>

      <BemModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(d) => {
          if (editing) updateBem(editing.id, d);
          else addBem(d);
          setOpen(false);
        }}
      />
    </div>
  );
}

function IndicadorCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded p-3 bg-surface2/40">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="font-semibold text-zinc-100 mt-0.5">{value}</div>
    </div>
  );
}

function BemModal({
  open, onClose, editing, onSave,
}: {
  open: boolean; onClose: () => void; editing: Bem | null;
  onSave: (b: Omit<Bem, "id">) => void;
}) {
  const empty: Omit<Bem, "id"> = {
    nome: "", tipo: "Imóvel", valorCompra: 0, valorMercado: 0, anosUso: 0, dividaRestante: 0,
    taxaAnual: TAXA_PADRAO["Imóvel"].taxa, comportamento: "valoriza",
  };
  const [f, setF] = useState<Omit<Bem, "id">>(empty);
  useEffect(() => {
    if (open) {
      if (editing) setF({ ...editing });
      else setF(empty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  function changeTipo(t: Bem["tipo"]) {
    const padrao = TAXA_PADRAO[t];
    setF({ ...f, tipo: t, taxaAnual: padrao.taxa, comportamento: padrao.comportamento });
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar bem" : "Novo bem"} size="lg">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nome / Descrição</label>
            <input className="input" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={f.tipo} onChange={(e) => changeTipo(e.target.value as Bem["tipo"])}>
              <option>Imóvel</option><option>Veículo</option><option>Moto</option><option>Outros</option>
            </select>
          </div>
          <div>
            <label className="label">Anos de uso</label>
            <NumberInput min={0} value={f.anosUso || undefined} onChange={(v) => setF({ ...f, anosUso: v ?? 0 })} />
          </div>
          <div>
            <label className="label">Valor de compra</label>
            <MoneyInput required value={f.valorCompra} onChange={(v) => setF({ ...f, valorCompra: v })} />
          </div>
          <div>
            <label className="label">Valor de mercado</label>
            <MoneyInput required value={f.valorMercado} onChange={(v) => setF({ ...f, valorMercado: v })} />
          </div>

          <div className="col-span-2 border-t border-border pt-3">
            <label className="label">Comportamento ao longo do tempo</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setF({ ...f, comportamento: "valoriza", taxaAnual: Math.abs(f.taxaAnual ?? 5) })}
                className={`btn btn-sm flex-1 ${f.comportamento === "valoriza" ? "btn-success" : "btn-ghost"}`}
              >
                <TrendingUp size={14} /> Valoriza (imóvel etc.)
              </button>
              <button
                type="button"
                onClick={() => setF({ ...f, comportamento: "desvaloriza", taxaAnual: -Math.abs(f.taxaAnual ?? 10) })}
                className={`btn btn-sm flex-1 ${f.comportamento === "desvaloriza" ? "btn-danger" : "btn-ghost"}`}
              >
                <TrendingDown size={14} /> Desvaloriza (veículo etc.)
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <label className="label">
              Taxa anual ({f.comportamento === "desvaloriza" ? "desvalorização" : "valorização"}) — % a.a.
            </label>
            <NumberInput decimal allowNegative value={f.taxaAnual ?? 0} onChange={(v) => setF({ ...f, taxaAnual: v ?? 0 })} />
            <div className="text-xs text-zinc-500 mt-1">
              Sugerido: Imóvel +6% · Veículo −10% · Moto −8%. Use valor negativo para desvalorização.
            </div>
          </div>

          <div className="col-span-2">
            <label className="label">Dívida restante</label>
            <MoneyInput value={f.dividaRestante} onChange={(v) => setF({ ...f, dividaRestante: v })} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
