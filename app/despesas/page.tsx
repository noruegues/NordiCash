"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { useStore, type Despesa, type ContaBancaria, type Cartao, type FormaPagamento, type RecorrenciaTipo } from "@/lib/store";
import { brl, mesRefBR } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import MacroView from "@/components/MacroView";
import MoneyInput from "@/components/ui/MoneyInput";
import MonthFilter, { applyMonthFilter, type MonthFilterValue } from "@/components/ui/MonthFilter";
import ComboboxCategoria from "@/components/ui/ComboboxCategoria";

type Tab = "lancamentos" | "macro";

export default function DespesasPage() {
  const { despesas: allDespesas, contas, cartoes, addDespesa, updateDespesa, removeDespesa } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Despesa | null>(null);
  const [filtroCat, setFiltroCat] = useState("");
  const [tab, setTab] = useState<Tab>("lancamentos");
  const [monthFilter, setMonthFilter] = useState<MonthFilterValue>({ mode: "current" });

  const despesas = applyMonthFilter(allDespesas, monthFilter);
  const total = despesas.reduce((s, d) => s + d.valor, 0);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Despesas"
        subtitle="Movimentações de saída"
        action={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Lançar despesa
          </button>
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
          items={allDespesas as any}
          groupBy="descricao"
          colorTotal="text-danger"
          onEditGroup={(key, mode) => {
            const found = despesas.find((d) => String((d as any)[mode]) === key);
            if (found) { setEditing(found); setOpen(true); setTab("lancamentos"); }
          }}
        />
      )}

      {tab === "lancamentos" && <div className="space-y-6">
      <MonthFilter value={monthFilter} onChange={setMonthFilter} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Total</div><div className="text-2xl font-semibold mt-1">{brl(total)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Emprestado</div><div className="text-2xl font-semibold mt-1 text-loan">{brl(totalEmprestado)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Lançamentos</div><div className="text-2xl font-semibold mt-1">{despesas.length}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Lançamentos" className="lg:col-span-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-zinc-500 py-6 text-center">Nenhuma despesa</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="t min-w-[720px]">
              <thead><tr><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Origem</th><th>Mês</th><th className="text-right">Valor</th><th></th></tr></thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className={`${d.emprestado ? "bg-loan/5" : ""} ${d.pago ? "opacity-60" : ""}`}>
                    <td className="font-medium">{d.descricao}{d.pago && <span className="ml-2 pill pill-success">Pago</span>}</td>
                    <td><span className="pill pill-muted">{d.categoria}</span></td>
                    <td>{d.forma}</td>
                    <td className="text-zinc-400">{nomeOrigem(d)}</td>
                    <td className="text-zinc-500">{mesRefBR(d.mesRef)}</td>
                    <td className={`text-right font-semibold ${d.emprestado ? "text-loan" : "text-zinc-100"}`}>{brl(d.valor)}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-1">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditing(d); setOpen(true); }}><Pencil size={13} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => confirm("Apagar despesa?") && removeDespesa(d.id)}><Trash2 size={13} /></button>
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
        onSave={(data) => {
          if (editing) updateDespesa(editing.id, data);
          else addDespesa(data);
          setOpen(false);
        }}
      />
    </div>
  );
}

function DespesaModal({
  open, onClose, contas, cartoes, editing, onSave,
}: {
  open: boolean; onClose: () => void;
  contas: ContaBancaria[]; cartoes: Cartao[];
  editing: Despesa | null;
  onSave: (d: Omit<Despesa, "id">) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const empty: Omit<Despesa, "id"> = {
    descricao: "", categoria: "", valor: 0, data: today, mesRef: today.slice(0, 7),
    forma: "Pix", contaId: contas[0]?.id, recorrencia: "Única", emprestado: false,
  };
  const [f, setF] = useState<Omit<Despesa, "id">>(empty);

  useEffect(() => {
    if (open) setF(editing ? { ...editing } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // Categorias já usadas (deduplicado, ordenado)
  const { despesas: allDesp } = useStore();
  const categoriasExistentes = Array.from(new Set(allDesp.map((d) => d.categoria).filter(Boolean))).sort();

  const formas: FormaPagamento[] = ["Pix", "Débito", "Dinheiro", "Boleto", "Cartão"];
  const recs: RecorrenciaTipo[] = ["Única", "Periódica", "Indeterminada"];
  const isCartao = f.forma === "Cartão";

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar despesa" : "Nova despesa"} size="lg">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const clean = { ...f };
        if (clean.forma === "Cartão") clean.contaId = undefined;
        else clean.cartaoId = undefined;
        if (clean.recorrencia !== "Periódica") clean.recorrenciaMeses = undefined;
        onSave(clean);
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
            <label className="label">Valor</label>
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

          <div>
            <label className="label">Recorrência</label>
            <select className="select" value={f.recorrencia} onChange={(e) => setF({ ...f, recorrencia: e.target.value as RecorrenciaTipo })}>
              {recs.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          {f.recorrencia === "Periódica" && (
            <div>
              <label className="label">Por quantos meses?</label>
              <input type="number" min={1} className="input" value={f.recorrenciaMeses ?? 12} onChange={(e) => setF({ ...f, recorrenciaMeses: parseInt(e.target.value) || 1 })} />
            </div>
          )}

          <div className="col-span-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={!!f.emprestado} onChange={(e) => setF({ ...f, emprestado: e.target.checked })} className="accent-loan" />
              Valor emprestado a terceiros
            </label>
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
