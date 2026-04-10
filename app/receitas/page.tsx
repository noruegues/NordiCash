"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { useStore, type Receita, type ContaBancaria } from "@/lib/store";
import { brl, mesRefBR } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import MacroView from "@/components/MacroView";
import MoneyInput from "@/components/ui/MoneyInput";
import MonthFilter, { applyMonthFilter, type MonthFilterValue } from "@/components/ui/MonthFilter";

type Tab = "receitas" | "macro";

export default function ReceitasPage() {
  const [tab, setTab] = useState<Tab>("receitas");
  const allReceitas = useStore((s) => s.receitas);
  const receitas = allReceitas;
  const [pendingEdit, setPendingEdit] = useState<Receita | null>(null);
  return (
    <div className="space-y-6">
      <PageHeader title="Receitas" subtitle="Movimentações de entrada" />
      <div className="flex border-b border-border">
        {[
          { k: "receitas", l: "Lançamentos" },
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
      {tab === "receitas" && <ReceitasTab pendingEdit={pendingEdit} clearPendingEdit={() => setPendingEdit(null)} />}
      {tab === "macro" && (
        <MacroView
          items={receitas as any}
          groupBy="fonte"
          colorTotal="text-success"
          onEditGroup={(key, mode) => {
            const found = receitas.find((r) => String((r as any)[mode]) === key);
            if (found) { setPendingEdit(found); setTab("receitas"); }
          }}
        />
      )}
    </div>
  );
}

// ============= Receitas =============
function ReceitasTab({ pendingEdit, clearPendingEdit }: { pendingEdit: Receita | null; clearPendingEdit: () => void }) {
  const { receitas: allReceitas, contas, addReceita, updateReceita, removeReceita } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Receita | null>(null);
  const [monthFilter, setMonthFilter] = useState<MonthFilterValue>({ mode: "current" });

  useEffect(() => {
    if (pendingEdit) { setEditing(pendingEdit); setOpen(true); clearPendingEdit(); }
  }, [pendingEdit, clearPendingEdit]);

  const receitas = applyMonthFilter(allReceitas, monthFilter);
  const total = receitas.reduce((s, r) => s + r.valor, 0);
  const nomeConta = (id?: string) => contas.find((c) => c.id === id)?.nome ?? "—";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Total</div><div className="text-2xl font-semibold mt-1">{brl(total)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Lançamentos</div><div className="text-2xl font-semibold mt-1">{receitas.length}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Contas</div><div className="text-2xl font-semibold mt-1">{contas.length}</div></Card>
      </div>

      <Card
        title="Lançamentos de receita"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <MonthFilter value={monthFilter} onChange={setMonthFilter} />
            <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus size={14} /> Nova receita
            </button>
          </div>
        }
      >
        {receitas.length === 0 ? (
          <div className="text-sm text-zinc-500 py-6 text-center">Nenhuma receita cadastrada</div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="t min-w-[680px]">
            <thead><tr><th>Fonte</th><th>Categoria</th><th>Conta</th><th>Mês ref.</th><th>Recorrência</th><th className="text-right">Valor</th><th></th></tr></thead>
            <tbody>
              {receitas.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.fonte}</td>
                  <td><span className="pill pill-info">{r.categoria}</span></td>
                  <td>{nomeConta(r.contaId)}</td>
                  <td className="text-zinc-400">{mesRefBR(r.mesRef)}</td>
                  <td>{r.recorrencia}</td>
                  <td className="text-right font-semibold text-success">{brl(r.valor)}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => confirm("Apagar receita?") && removeReceita(r.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>

      <ReceitaModal
        open={open}
        onClose={() => setOpen(false)}
        contas={contas}
        editing={editing}
        onSave={(data) => {
          if (editing) updateReceita(editing.id, data);
          else addReceita(data);
          setOpen(false);
        }}
      />
    </>
  );
}

function ReceitaModal({
  open, onClose, contas, editing, onSave,
}: {
  open: boolean; onClose: () => void; contas: ContaBancaria[];
  editing: Receita | null; onSave: (r: Omit<Receita, "id">) => void;
}) {
  const empty: Omit<Receita, "id"> = {
    fonte: "", categoria: "", valor: 0, contaId: contas[0]?.id, mesRef: new Date().toISOString().slice(0, 7), recorrencia: "Mensal",
  };
  const [f, setF] = useState<Omit<Receita, "id">>(empty);

  useEffect(() => {
    if (open) setF(editing ? { ...editing } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar receita" : "Nova receita"}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Fonte</label>
            <input className="input" required value={f.fonte} onChange={(e) => setF({ ...f, fonte: e.target.value })} />
          </div>
          <div>
            <label className="label">Categoria</label>
            <input className="input" required value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} />
          </div>
          <div>
            <label className="label">Valor</label>
            <MoneyInput required value={f.valor} onChange={(v) => setF({ ...f, valor: v })} />
          </div>
          <div>
            <label className="label">Conta</label>
            <select className="select" value={f.contaId ?? ""} onChange={(e) => setF({ ...f, contaId: e.target.value || undefined })}>
              <option value="">— Nenhuma —</option>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Mês de referência</label>
            <input type="month" className="input" required value={f.mesRef} onChange={(e) => setF({ ...f, mesRef: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Recorrência</label>
            <select className="select" value={f.recorrencia} onChange={(e) => setF({ ...f, recorrencia: e.target.value as any })}>
              <option value="Mensal">Mensal</option>
              <option value="Única">Única</option>
            </select>
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
