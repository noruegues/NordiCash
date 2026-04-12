"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { useStore, type Despesa, type ContaBancaria, type Cartao, type FormaPagamento, type RecorrenciaTipo } from "@/lib/store";
import { brl, mesRefBR } from "@/lib/format";
import { Plus, Pencil, Trash2, Check, CheckCheck, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import MacroView from "@/components/MacroView";
import MoneyInput from "@/components/ui/MoneyInput";
import MonthFilter, { applyMonthFilter, type MonthFilterValue } from "@/components/ui/MonthFilter";
import ComboboxCategoria from "@/components/ui/ComboboxCategoria";
import ExportButton from "@/components/ui/ExportButton";
import { exportPDF, exportExcel } from "@/lib/export";
import ImportModal from "@/components/ImportModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useCurrentUser } from "@/lib/auth";
import { Upload } from "lucide-react";

type Tab = "lancamentos" | "macro";

export default function DespesasPage() {
  const { despesas: allDespesas, contas, cartoes, addDespesa, updateDespesa, removeDespesa, removeDespesaGroup } = useStore();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Despesa | null>(null);
  const [filtroCat, setFiltroCat] = useState("");
  const [tab, setTab] = useState<Tab>("lancamentos");
  const [monthFilter, setMonthFilter] = useState<MonthFilterValue>({ mode: "current" });
  const [importOpen, setImportOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Despesa | null>(null);
  const [dupAlert, setDupAlert] = useState<{ items: Omit<Despesa, "id">[]; existing: string } | null>(null);

  const despesas = applyMonthFilter(allDespesas, monthFilter);
  const total = despesas.reduce((s, d) => s + d.valor, 0);
  const totalPago = despesas.filter((d) => d.pago).reduce((s, d) => s + d.valor, 0);
  const totalProvisionado = despesas.filter((d) => !d.pago).reduce((s, d) => s + d.valor, 0);
  const totalEmprestado = despesas.filter((d) => d.emprestado).reduce((s, d) => s + d.valor, 0);

  const subtotaisCat = Object.entries(
    despesas.reduce<Record<string, number>>((acc, d) => {
      acc[d.categoria] = (acc[d.categoria] || 0) + d.valor;
      return acc;
    }, {})
  );

  const filtered = filtroCat ? despesas.filter((d) => d.categoria === filtroCat) : despesas;

  const nomeOrigem = (d: Despesa) => {
    if (d.cartaoId) return cartoes.find((c) => c.id === d.cartaoId)?.nome ?? "—";
    if (d.contaId) return contas.find((c) => c.id === d.contaId)?.nome ?? "—";
    return "—";
  };

  // Mês ativo para navegação com setas
  const mesAtivo = monthFilter.mode === "current"
    ? new Date().toISOString().slice(0, 7)
    : monthFilter.mode === "month"
      ? monthFilter.mes
      : null;

  function shiftMonth(offset: number) {
    const base = mesAtivo || new Date().toISOString().slice(0, 7);
    const [y, m] = base.split("-").map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    const novo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setMonthFilter({ mode: "month", mes: novo });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        subtitle="Movimentações de saída"
        action={
          <div className="flex items-center gap-2">
            <button className="btn btn-soft" onClick={() => {
              if (user && user.plano === "Free") setUpgradeOpen(true);
              else setImportOpen(true);
            }}>
              <Upload size={15} /> Importar
            </button>
            <ExportButton
              onExportPDF={() => exportPDF({
                title: "Despesas", period: monthFilter.mode === "current" ? mesRefBR(new Date().toISOString().slice(0, 7)) : "Personalizado",
                columns: [
                  { header: "Descrição", key: "descricao" },
                  { header: "Categoria", key: "categoria" },
                  { header: "Forma", key: "forma" },
                  { header: "Mês Ref", key: "mesRef" },
                  { header: "Valor", key: "valor", format: "brl" },
                  { header: "Status", key: "_status" },
                ],
                rows: despesas.map((d) => ({ ...d, _status: d.pago ? "Pago" : "Provisionado" })),
                totals: { valor: total },
                filename: `nordicash-despesas-${new Date().toISOString().slice(0, 7)}`,
              })}
              onExportExcel={() => exportExcel({
                title: "Despesas", period: "",
                columns: [
                  { header: "Descrição", key: "descricao" },
                  { header: "Categoria", key: "categoria" },
                  { header: "Forma", key: "forma" },
                  { header: "Mês Ref", key: "mesRef" },
                  { header: "Valor", key: "valor", format: "brl" },
                  { header: "Status", key: "_status" },
                ],
                rows: despesas.map((d) => ({ ...d, _status: d.pago ? "Pago" : "Provisionado" })),
                totals: { valor: total },
                filename: `nordicash-despesas-${new Date().toISOString().slice(0, 7)}`,
              })}
            />
            <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus size={16} /> Lançar despesa
            </button>
          </div>
        }
      />

      <div className="flex border-b border-border">
        {[
          { k: "lancamentos", l: "Lançamentos" },
          { k: "macro", l: "Visão macro" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as Tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.k ? "border-primary text-primary" : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "macro" && (
        <MacroView
          items={allDespesas}
          groupBy="descricao"
          colorTotal="text-danger"
          onEditGroup={(key, mode) => {
            const found = despesas.find((d) => String(d[mode as keyof typeof d]) === key);
            if (found) { setEditing(found); setOpen(true); setTab("lancamentos"); }
          }}
        />
      )}

      {tab === "lancamentos" && <div className="space-y-6">
      <MonthFilter value={monthFilter} onChange={setMonthFilter} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Total</div><div className="text-2xl font-semibold mt-1">{brl(total)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Pago</div><div className="text-2xl font-semibold mt-1 text-success">{brl(totalPago)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Provisionado</div><div className="text-2xl font-semibold mt-1 text-warn">{brl(totalProvisionado)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Emprestado</div><div className="text-2xl font-semibold mt-1 text-loan">{brl(totalEmprestado)}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <span>Lançamentos</span>
              {(monthFilter.mode === "current" || monthFilter.mode === "month") && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    className="p-0.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition"
                    onClick={() => shiftMonth(-1)}
                    title="Mês anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-medium text-zinc-300 min-w-[80px] text-center">
                    {mesRefBR(mesAtivo || new Date().toISOString().slice(0, 7))}
                  </span>
                  <button
                    className="p-0.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition"
                    onClick={() => shiftMonth(1)}
                    title="Próximo mês"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          }
          className="lg:col-span-2"
          action={
            filtered.length > 0 && filtered.some((d) => !d.pago) ? (
              <button
                className="btn btn-sm btn-soft"
                onClick={() => {
                  if (!confirm("Deseja marcar todas as despesas deste mês como paga?")) return;
                  filtered.filter((d) => !d.pago).forEach((d) => updateDespesa(d.id, { pago: true }));
                }}
              >
                <CheckCheck size={14} /> Marcar todos como pago
              </button>
            ) : undefined
          }
        >
          {filtered.length === 0 ? (
            <div className="text-sm text-zinc-500 py-6 text-center">Nenhuma despesa</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="t min-w-[720px]">
              <thead><tr><th className="w-10">Pago</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Origem</th><th>Mês</th><th className="text-right">Valor</th><th></th></tr></thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className={`${d.emprestado ? "bg-loan/5" : ""} ${d.pago ? "opacity-60" : ""}`}>
                    <td>
                      <button
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          d.pago
                            ? "bg-success/20 border-success text-success"
                            : "border-zinc-600 hover:border-zinc-400 text-transparent hover:text-zinc-500"
                        }`}
                        onClick={() => updateDespesa(d.id, { pago: !d.pago })}
                        title={d.pago ? "Marcar como não pago" : "Marcar como pago"}
                      >
                        <Check size={12} strokeWidth={3} />
                      </button>
                    </td>
                    <td className="font-medium">{d.descricao}</td>
                    <td><span className="pill pill-muted">{d.categoria}</span></td>
                    <td>{d.forma}</td>
                    <td className="text-zinc-400">{nomeOrigem(d)}</td>
                    <td className="text-zinc-500">{mesRefBR(d.mesRef)}</td>
                    <td className={`text-right font-semibold ${d.emprestado ? "text-loan" : "text-zinc-100"}`}>{brl(d.valor)}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-1">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditing(d); setOpen(true); }}><Pencil size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => setDeleteTarget(d)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Card>

        <Card title="Por categoria">
          <ul className="space-y-2">
            <li>
              <button className={`w-full text-left text-sm px-2 py-1.5 rounded ${!filtroCat ? "bg-primary/10 text-primary" : "text-zinc-400 hover:bg-surface2"}`} onClick={() => setFiltroCat("")}>
                Todas
              </button>
            </li>
            {subtotaisCat.map(([cat, val]) => (
              <li key={cat}>
                <button className={`w-full flex justify-between items-center text-sm px-2 py-1.5 rounded ${filtroCat === cat ? "bg-primary/10 text-primary" : "text-zinc-300 hover:bg-surface2"}`} onClick={() => setFiltroCat(cat)}>
                  <span>{cat}</span>
                  <span className="font-semibold">{brl(val)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      </div>}

      <DespesaModal
        open={open}
        onClose={() => setOpen(false)}
        contas={contas}
        cartoes={cartoes}
        editing={editing}
        onSave={async (items) => {
          if (editing) {
            await updateDespesa(editing.id, items[0]);
            setOpen(false);
            return;
          }
          // Detecção de duplicata: mesmo nome base no mesmo mês
          const baseDesc = items[0].descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
          const dup = allDespesas.find((d) => {
            const existBase = d.descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();
            return existBase.toLowerCase() === baseDesc.toLowerCase() && d.mesRef === items[0].mesRef;
          });
          if (dup) {
            setDupAlert({ items, existing: dup.descricao });
            return;
          }
          for (const d of items) await addDespesa(d);
          setOpen(false);
        }}
      />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="A importação de extratos está disponível nos planos Pro e Premium." />
      <DuplicateAlertDialog
        alert={dupAlert}
        onClose={() => setDupAlert(null)}
        onConfirm={async () => {
          for (const d of dupAlert!.items) await addDespesa(d);
          setDupAlert(null);
          setOpen(false);
        }}
        onRename={() => {
          setDupAlert(null);
          // Mantém modal aberto para editar o nome
        }}
      />
      <DeleteDespesaDialog
        despesa={deleteTarget}
        groupCount={deleteTarget?.groupId ? allDespesas.filter((d) => d.groupId === deleteTarget.groupId).length : 0}
        onClose={() => setDeleteTarget(null)}
        onDeleteSingle={async () => { await removeDespesa(deleteTarget!.id); setDeleteTarget(null); }}
        onDeleteGroup={async () => { await removeDespesaGroup(deleteTarget!.groupId!); setDeleteTarget(null); }}
      />
    </div>
  );
}

function nextMonth(mesRef: string, offset: number): string {
  const [y, m] = mesRef.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const PARCELA_OPTIONS = Array.from({ length: 35 }, (_, i) => i + 2);

function DespesaModal({
  open, onClose, contas, cartoes, editing, onSave,
}: {
  open: boolean; onClose: () => void;
  contas: ContaBancaria[]; cartoes: Cartao[];
  editing: Despesa | null;
  onSave: (items: Omit<Despesa, "id">[]) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultCartao = cartoes.find((c) => c.isDefault) || (cartoes.length === 1 ? cartoes[0] : null);
  const empty: Omit<Despesa, "id"> = {
    descricao: "", categoria: "", valor: 0, data: today, mesRef: today.slice(0, 7),
    forma: "Pix", contaId: contas[0]?.id, cartaoId: defaultCartao?.id, recorrencia: "Única", emprestado: false, pago: false,
  };
  const [f, setF] = useState<Omit<Despesa, "id">>(empty);

  useEffect(() => {
    if (open) setF(editing ? { ...editing } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const { despesas: allDesp } = useStore();
  const categoriasExistentes = Array.from(new Set(allDesp.map((d) => d.categoria).filter(Boolean))).sort();

  const formas: FormaPagamento[] = ["Pix", "Débito", "Dinheiro", "Boleto", "Cartão"];
  const recs: RecorrenciaTipo[] = ["Única", "Recorrente", "Indeterminada"];
  const isCartao = f.forma === "Cartão";
  const isRecorrente = !editing && f.recorrencia === "Recorrente";

  const qtdMeses = f.recorrenciaMeses ?? 2;
  const isParcela = isRecorrente && f.valor > 0 && qtdMeses > 0;
  const valorParcela = isParcela ? Math.round((f.valor / qtdMeses) * 100) / 100 : 0;

  function buildItems(): Omit<Despesa, "id">[] {
    const base = { ...f };
    if (base.forma === "Cartão") base.contaId = undefined;
    else base.cartaoId = undefined;
    if (base.recorrencia !== "Recorrente") base.recorrenciaMeses = undefined;

    if (!isParcela) return [base];

    const gId = crypto.randomUUID();
    const items: Omit<Despesa, "id">[] = [];
    for (let i = 0; i < qtdMeses; i++) {
      const mes = nextMonth(base.mesRef, i);
      items.push({
        ...base,
        descricao: `${base.descricao} (${i + 1}/${qtdMeses})`,
        valor: valorParcela,
        mesRef: mes,
        data: `${mes}-${base.data.slice(8, 10)}`,
        groupId: gId,
        pago: false,
      });
    }
    return items;
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar despesa" : "Nova despesa"} size="lg">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        onSave(buildItems());
      }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Descrição</label>
            <input className="input" required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          </div>
          <div>
            <label className="label">Categoria</label>
            <ComboboxCategoria
              value={f.categoria}
              onChange={(v) => setF({ ...f, categoria: v })}
              options={categoriasExistentes}
              required
            />
          </div>
          <div>
            <label className="label">{isParcela && !editing ? "Valor total" : "Valor"}</label>
            <MoneyInput required value={f.valor} onChange={(v) => setF({ ...f, valor: v })} />
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" required value={f.data} onChange={(e) => setF({ ...f, data: e.target.value, mesRef: e.target.value.slice(0, 7) })} />
          </div>
          <div>
            <label className="label">Mês de referência</label>
            <input type="month" className="input" required value={f.mesRef} onChange={(e) => setF({ ...f, mesRef: e.target.value })} />
          </div>

          <div>
            <label className="label">Forma de pagamento</label>
            <select className="select" value={f.forma} onChange={(e) => setF({ ...f, forma: e.target.value as FormaPagamento })}>
              {formas.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          {isCartao ? (
            <div>
              <label className="label">Cartão</label>
              <select className="select" required value={f.cartaoId ?? ""} onChange={(e) => setF({ ...f, cartaoId: e.target.value })}>
                <option value="">Selecione...</option>
                {cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome} ({c.banco})</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Conta</label>
              <select className="select" value={f.contaId ?? ""} onChange={(e) => setF({ ...f, contaId: e.target.value || undefined })}>
                <option value="">— Nenhuma —</option>
                {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}

          {!editing ? (
            <>
              <div>
                <label className="label">Recorrência</label>
                <select className="select" value={f.recorrencia} onChange={(e) => {
                  const rec = e.target.value as RecorrenciaTipo;
                  setF({ ...f, recorrencia: rec, recorrenciaMeses: rec === "Recorrente" ? (f.recorrenciaMeses ?? 2) : undefined });
                }}>
                  {recs.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              {isRecorrente && (
                <div>
                  <label className="label">Parcelas</label>
                  <select className="select" value={qtdMeses} onChange={(e) => setF({ ...f, recorrenciaMeses: parseInt(e.target.value) })}>
                    {PARCELA_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : editing.recorrencia === "Recorrente" && editing.recorrenciaMeses ? (
            <p className="col-span-2 text-xs text-warn/80">
              Parcela {(() => { const m = editing.descricao.match(/\((\d+)\/(\d+)\)$/); return m ? `${m[1]}/${m[2]}` : `${editing.recorrenciaMeses}x`; })()} · {mesRefBR(editing.mesRef)} · compra em {new Date(editing.data + "T12:00:00").toLocaleDateString("pt-BR")}
            </p>
          ) : (
            <p className="col-span-2 text-xs text-warn/80">
              Despesa {editing.recorrencia.toLowerCase()}
            </p>
          )}

          {/* Valor da parcela */}
          {isRecorrente && f.valor > 0 && (
            <div className="col-span-2">
              <label className="label">Valor da parcela</label>
              <div className="input flex items-center justify-between text-zinc-300">
                <span className="font-semibold text-primary">{brl(valorParcela)}</span>
                <span className="text-xs text-zinc-500">{qtdMeses}x de {brl(valorParcela)}</span>
              </div>
            </div>
          )}

          {/* Simulação de parcelas */}
          {isParcela && !editing && (
            <div className="col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Parcelas por mês</span>
                <span className="text-xs text-zinc-400">{qtdMeses}x de <span className="text-primary font-semibold">{brl(valorParcela)}</span></span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                {Array.from({ length: Math.min(qtdMeses, 24) }, (_, i) => (
                  <div key={i} className="text-center rounded bg-surface2 px-2 py-1.5">
                    <div className="text-[10px] text-zinc-500">{mesRefBR(nextMonth(f.mesRef, i))}</div>
                    <div className="text-xs font-semibold text-zinc-200">{brl(valorParcela)}</div>
                  </div>
                ))}
                {qtdMeses > 24 && (
                  <div className="text-center rounded bg-surface2 px-2 py-1.5">
                    <div className="text-xs text-zinc-500">+{qtdMeses - 24} meses</div>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-zinc-500">
                Total: {brl(f.valor)} a partir de {mesRefBR(f.mesRef)}
              </div>
            </div>
          )}

          <div className="col-span-2 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={!!f.pago} onChange={(e) => setF({ ...f, pago: e.target.checked })} className="accent-success" />
              Já está pago
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={!!f.emprestado} onChange={(e) => setF({ ...f, emprestado: e.target.checked })} className="accent-loan" />
              Valor emprestado a terceiros
            </label>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            {isParcela && !editing ? `Salvar ${qtdMeses} parcelas` : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DuplicateAlertDialog({
  alert, onClose, onConfirm, onRename,
}: {
  alert: { items: Omit<Despesa, "id">[]; existing: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  onRename: () => void;
}) {
  if (!alert) return null;
  const baseDesc = alert.items[0].descricao.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim();

  return (
    <Modal open={!!alert} onClose={onClose} title="Despesa duplicada" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-warn/10 p-2">
            <AlertTriangle size={20} className="text-warn" />
          </div>
          <div className="text-sm text-zinc-300">
            <p>Já existe uma despesa <span className="font-semibold text-zinc-100">&quot;{alert.existing}&quot;</span> cadastrada neste mês.</p>
            <p className="mt-1">Deseja cadastrar <span className="font-semibold text-zinc-100">&quot;{baseDesc}&quot;</span> mesmo assim?</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button className="btn btn-primary w-full justify-center" onClick={onConfirm}>
            Cadastrar mesmo assim
          </button>
          <button className="btn btn-soft w-full justify-center" onClick={onRename}>
            Ajustar o nome
          </button>
          <button className="btn btn-ghost w-full justify-center" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteDespesaDialog({
  despesa, groupCount, onClose, onDeleteSingle, onDeleteGroup,
}: {
  despesa: Despesa | null;
  groupCount: number;
  onClose: () => void;
  onDeleteSingle: () => void;
  onDeleteGroup: () => void;
}) {
  if (!despesa) return null;
  const hasGroup = !!despesa.groupId && groupCount > 1;

  return (
    <Modal open={!!despesa} onClose={onClose} title="Apagar despesa" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-danger/10 p-2">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div className="text-sm text-zinc-300">
            {hasGroup ? (
              <>
                <p className="font-medium text-zinc-100 mb-1">&quot;{despesa.descricao}&quot;</p>
                <p>Esta despesa faz parte de uma recorrência com <span className="font-semibold text-zinc-100">{groupCount} parcelas</span>. O que deseja fazer?</p>
              </>
            ) : (
              <p>Tem certeza que deseja apagar <span className="font-semibold text-zinc-100">&quot;{despesa.descricao}&quot;</span>?</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {hasGroup && (
            <>
              <button
                className="btn btn-danger w-full justify-center"
                onClick={onDeleteGroup}
              >
                <Trash2 size={14} /> Apagar todas as {groupCount} parcelas
              </button>
              <button
                className="btn btn-soft w-full justify-center"
                onClick={onDeleteSingle}
              >
                Apagar somente esta parcela
              </button>
            </>
          )}
          {!hasGroup && (
            <button
              className="btn btn-danger w-full justify-center"
              onClick={onDeleteSingle}
            >
              <Trash2 size={14} /> Apagar
            </button>
          )}
          <button className="btn btn-ghost w-full justify-center" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
