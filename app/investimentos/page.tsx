"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import LineProjecao from "@/components/charts/LineProjecao";
import PieCategoria from "@/components/charts/PieCategoria";
import { useStore, type Investimento } from "@/lib/store";
import { projecaoInvestimento, projecaoPortfolio } from "@/lib/calculations";
import { brl, dataBR } from "@/lib/format";
import { LineChart, Plus, Pencil, Trash2, RefreshCw, Info } from "lucide-react";
import { useIndicadores } from "@/lib/indicadores";
import ExportButton from "@/components/ui/ExportButton";
import { exportPDF, exportExcel } from "@/lib/export";

const HORIZONTES = [
  { label: "6m", v: 6 }, { label: "1a", v: 12 }, { label: "3a", v: 36 },
  { label: "5a", v: 60 }, { label: "10a", v: 120 },
];

type Benchmark = "selic" | "cdi" | "ipca" | "poupanca" | "custom";

export default function InvestimentosPage() {
  const { investimentos, addInvestimento, updateInvestimento, removeInvestimento } = useStore();
  const indicadores = useIndicadores();
  const [benchmark, setBenchmark] = useState<Benchmark>("selic");
  const [taxaCustomAA, setTaxaCustomAA] = useState(12);
  const [considerarIpca, setConsiderarIpca] = useState(true);
  const [horizonte, setHorizonte] = useState(60);
  const [ativoId, setAtivoId] = useState("portfolio");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investimento | null>(null);

  const taxaAnualNominal = (() => {
    switch (benchmark) {
      case "selic": return indicadores.selic;
      case "cdi": return indicadores.cdi;
      case "ipca": return indicadores.ipca + 5;
      case "poupanca": return indicadores.poupanca;
      case "custom": return taxaCustomAA;
    }
  })();
  const taxaAnualReal = considerarIpca
    ? ((1 + taxaAnualNominal / 100) / (1 + indicadores.ipca / 100) - 1) * 100
    : taxaAnualNominal;
  const taxaMensal = Math.pow(1 + taxaAnualReal / 100, 1 / 12) - 1;

  const total = investimentos.reduce((s, i) => s + i.saldoAtual, 0);
  const aporteMensal = investimentos.reduce((s, i) => s + i.aporteMensal, 0);
  const totalAportado = investimentos.reduce((s, i) => s + i.valorInicial, 0);
  const rendimento = total - totalAportado;

  const projData = useMemo(() => {
    if (ativoId === "portfolio") return projecaoPortfolio(investimentos, taxaMensal, horizonte);
    const inv = investimentos.find((i) => i.id === ativoId);
    return inv ? projecaoInvestimento(inv, taxaMensal, horizonte) : [];
  }, [ativoId, taxaMensal, horizonte, investimentos]);

  const porTipo = Object.entries(
    investimentos.reduce<Record<string, number>>((acc, i) => {
      acc[i.tipo] = (acc[i.tipo] || 0) + i.saldoAtual;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investimentos"
        subtitle="Portfólio"
        action={
          <div className="flex items-center gap-2">
            <ExportButton
              onExportPDF={() => exportPDF({
                title: "Investimentos", columns: [
                  { header: "Nome", key: "nome" }, { header: "Tipo", key: "tipo" },
                  { header: "Valor Inicial", key: "valorInicial", format: "brl" },
                  { header: "Aporte Mensal", key: "aporteMensal", format: "brl" },
                  { header: "Saldo Atual", key: "saldoAtual", format: "brl" },
                ],
                rows: investimentos, totals: { saldoAtual: investimentos.reduce((s, i) => s + i.saldoAtual, 0) },
                filename: `nordicash-investimentos-${new Date().toISOString().slice(0, 7)}`,
              })}
              onExportExcel={() => exportExcel({
                title: "Investimentos", columns: [
                  { header: "Nome", key: "nome" }, { header: "Tipo", key: "tipo" },
                  { header: "Valor Inicial", key: "valorInicial", format: "brl" },
                  { header: "Aporte Mensal", key: "aporteMensal", format: "brl" },
                  { header: "Saldo Atual", key: "saldoAtual", format: "brl" },
                ],
                rows: investimentos, totals: { saldoAtual: investimentos.reduce((s, i) => s + i.saldoAtual, 0) },
                filename: `nordicash-investimentos-${new Date().toISOString().slice(0, 7)}`,
              })}
            />
            <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus size={16} /> Novo investimento
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Saldo total" value={brl(total)} icon={<LineChart size={18} />} accent />
        <KpiCard label="Rendimento" value={brl(rendimento)} icon={<LineChart size={18} />} />
        <KpiCard label="Aporte mensal" value={brl(aporteMensal)} icon={<LineChart size={18} />} />
        <KpiCard label="Ativos" value={String(investimentos.length)} icon={<LineChart size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Premissas"
          action={
            indicadores.updatedAt ? (
              <span className="text-[11px] text-zinc-500 inline-flex items-center gap-1">
                <RefreshCw size={11} /> BCB {new Date(indicadores.updatedAt).toLocaleDateString("pt-BR")}
              </span>
            ) : null
          }
        >
          <div className="space-y-3">
            <div>
              <label className="label">Benchmark</label>
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
                <input type="number" step="0.1" className="input" value={taxaCustomAA} onChange={(e) => setTaxaCustomAA(parseFloat(e.target.value) || 0)} />
              </div>
            ) : (
              <div>
                <label className="label">Taxa mensal efetiva</label>
                <div className="input flex items-center justify-between text-zinc-300">
                  <span>{(taxaMensal * 100).toFixed(3)}%</span>
                  <span className="text-xs text-zinc-500">{taxaAnualReal.toFixed(2)}% a.a. {considerarIpca ? "real" : "nominal"}</span>
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" checked={considerarIpca} onChange={(e) => setConsiderarIpca(e.target.checked)} />
              Descontar IPCA (valor real)
            </label>
            <div>
              <label className="label">Horizonte</label>
              <div className="flex gap-1 bg-surface2 p-1 rounded">
                {HORIZONTES.map((h) => (
                  <button key={h.v} onClick={() => setHorizonte(h.v)}
                    className={`flex-1 px-2 py-1 text-xs rounded ${horizonte === h.v ? "bg-primary text-white font-semibold" : "text-zinc-400"}`}>
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Ativo</label>
              <select className="select" value={ativoId} onChange={(e) => setAtivoId(e.target.value)}>
                <option value="portfolio">Portfólio completo</option>
                {investimentos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </select>
            </div>
            <div className="text-[11px] text-zinc-500 inline-flex items-start gap-1">
              <Info size={11} className="mt-0.5 shrink-0" />
              Taxas atualizadas automaticamente pelo Banco Central (Selic, CDI, IPCA, IGP-M).
            </div>
          </div>
        </Card>

        <Card title="Composição" className="lg:col-span-2">
          {porTipo.length ? <PieCategoria data={porTipo} /> : <div className="text-sm text-zinc-500 py-6 text-center">Sem dados</div>}
        </Card>
      </div>

      <Card title={`Projeção · ${horizonte} meses`}>
        {projData.length > 1 ? <LineProjecao data={projData} /> : <div className="text-sm text-zinc-500 py-6 text-center">Adicione um investimento para ver a projeção</div>}
      </Card>

      <Card title="Ativos">
        {investimentos.length === 0 ? (
          <div className="text-sm text-zinc-500 py-6 text-center">Nenhum investimento cadastrado</div>
        ) : (
          <table className="t">
            <thead><tr><th>Nome</th><th>Tipo</th><th>Início</th><th className="text-right">Inicial</th><th className="text-right">Aporte/mês</th><th className="text-right">Saldo atual</th><th className="text-right">Rend.</th><th></th></tr></thead>
            <tbody>
              {investimentos.map((i) => {
                const rend = i.saldoAtual - i.valorInicial;
                return (
                  <tr key={i.id}>
                    <td className="font-medium">{i.nome}</td>
                    <td><span className="pill pill-info">{i.tipo}</span></td>
                    <td className="text-zinc-500">{dataBR(i.inicio)}</td>
                    <td className="text-right">{brl(i.valorInicial)}</td>
                    <td className="text-right">{brl(i.aporteMensal)}</td>
                    <td className="text-right text-success font-semibold">{brl(i.saldoAtual)}</td>
                    <td className={`text-right text-xs ${rend >= 0 ? "text-success" : "text-danger"}`}>{rend >= 0 ? "+" : ""}{brl(rend)}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-1">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditing(i); setOpen(true); }}><Pencil size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => confirm("Apagar?") && removeInvestimento(i.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <InvModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(d) => {
          if (editing) updateInvestimento(editing.id, d);
          else addInvestimento(d);
          setOpen(false);
        }}
      />
    </div>
  );
}

function InvModal({
  open, onClose, editing, onSave,
}: {
  open: boolean; onClose: () => void; editing: Investimento | null;
  onSave: (i: Omit<Investimento, "id">) => void;
}) {
  const empty: Omit<Investimento, "id"> = {
    nome: "", tipo: "Renda Fixa", valorInicial: 0, aporteMensal: 0, saldoAtual: 0,
    inicio: new Date().toISOString().slice(0, 10), taxaMensal: 0.9,
  };
  const [f, setF] = useState<Omit<Investimento, "id">>(empty);
  useEffect(() => {
    if (open) setF(editing ? { ...editing } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar investimento" : "Novo investimento"} size="lg">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nome / Fundo / Ativo</label>
            <input className="input" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as Investimento["tipo"] })}>
              <option>Renda Fixa</option><option>Tesouro</option><option>Ações</option>
              <option>FIIs</option><option>Cripto</option><option>Fundo</option>
            </select>
          </div>
          <div>
            <label className="label">Data início</label>
            <input type="date" className="input" required value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} />
          </div>
          <div>
            <label className="label">Valor inicial (R$)</label>
            <input type="number" step="0.01" className="input" value={f.valorInicial || ""} onChange={(e) => setF({ ...f, valorInicial: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Aporte mensal (R$)</label>
            <input type="number" step="0.01" className="input" value={f.aporteMensal || ""} onChange={(e) => setF({ ...f, aporteMensal: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Saldo atual (R$)</label>
            <input type="number" step="0.01" className="input" required value={f.saldoAtual || ""} onChange={(e) => setF({ ...f, saldoAtual: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Taxa esperada (% mês)</label>
            <input type="number" step="0.01" className="input" value={f.taxaMensal ?? 0} onChange={(e) => setF({ ...f, taxaMensal: parseFloat(e.target.value) || 0 })} />
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
