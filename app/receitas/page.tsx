"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { useStore, type Receita, type ContaBancaria } from "@/lib/store";
import { brl, mesRefBR } from "@/lib/format";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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

type Tab = "receitas" | "macro";

export default function ReceitasPage() {
  const [tab, setTab] = useState<Tab>("receitas");
  const allReceitas = useStore((s) => s.receitas);
  const receitas = allReceitas;
  const user = useCurrentUser();
  const [pendingEdit, setPendingEdit] = useState<Receita | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader title="Receitas" subtitle="Movimentações de entrada" action={
        <div className="flex items-center gap-2">
          <button className="btn btn-soft" onClick={() => {
            if (user && user.plano === "Free") setUpgradeOpen(true);
            else setImportOpen(true);
          }}>
            <Upload size={15} /> Importar
          </button>
          <ExportButton
            onExportPDF={() => exportPDF({
              title: "Receitas",
              columns: [
                { header: "Fonte", key: "fonte" },
                { header: "Categoria", key: "categoria" },
                { header: "Mês Ref", key: "mesRef" },
                { header: "Recorrência", key: "recorrencia" },
                { header: "Valor", key: "valor", format: "brl" },
              ],
              rows: receitas,
              totals: { valor: receitas.reduce((s, r) => s + r.valor, 0) },
              filename: `nordicash-receitas-${new Date().toISOString().slice(0, 7)}`,
            })}
            onExportExcel={() => exportExcel({
              title: "Receitas",
              columns: [
                { header: "Fonte", key: "fonte" },
                { header: "Categoria", key: "categoria" },
                { header: "Mês Ref", key: "mesRef" },
                { header: "Recorrência", key: "recorrencia" },
                { header: "Valor", key: "valor", format: "brl" },
              ],
              rows: receitas,
              totals: { valor: receitas.reduce((s, r) => s + r.valor, 0) },
              filename: `nordicash-receitas-${new Date().toISOString().slice(0, 7)}`,
            })}
          />
          <button className="btn btn-primary" onClick={() => setOpenModal(true)}>
            <Plus size={16} /> Lançar receita
          </button>
        </div>
      } />
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
      {tab === "receitas" && <ReceitasTab pendingEdit={pendingEdit} clearPendingEdit={() => setPendingEdit(null)} openModal={openModal} closeModal={() => setOpenModal(false)} />}
      {tab === "macro" && (
        <MacroView
          items={receitas}
          groupBy="fonte"
          colorTotal="text-success"
          mode="receita"
          onEditGroup={(key, mode) => {
            const found = receitas.find((r) => String(r[mode as keyof typeof r]) === key);
            if (found) { setPendingEdit(found); setTab("receitas"); }
          }}
        />
      )}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="A importação de extratos está disponível nos planos Pro e Premium." />
    </div>
  );
}

// ============= Receitas =============
function ReceitasTab({ pendingEdit, clearPendingEdit, openModal, closeModal }: { pendingEdit: Receita | null; clearPendingEdit: () => void; openModal: boolean; closeModal: () => void }) {
  const { receitas: allReceitas, contas, addReceita, updateReceita, removeReceita, removeReceitaGroup, removeReceitaFromMonth } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Receita | null>(null);
  const [monthFilter, setMonthFilter] = useState<MonthFilterValue>({ mode: "current" });
  const [deleteTarget, setDeleteTarget] = useState<Receita | null>(null);

  useEffect(() => {
    if (pendingEdit) { setEditing(pendingEdit); setOpen(true); clearPendingEdit(); }
  }, [pendingEdit, clearPendingEdit]);

  useEffect(() => {
    if (openModal) { setEditing(null); setOpen(true); closeModal(); }
  }, [openModal, closeModal]);

  const receitas = applyMonthFilter(allReceitas, monthFilter);
  const total = receitas.reduce((s, r) => s + r.valor, 0);
  const nomeConta = (id?: string) => contas.find((c) => c.id === id)?.nome ?? "—";

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
      <MonthFilter value={monthFilter} onChange={setMonthFilter} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Total</div><div className="text-2xl font-semibold mt-1 text-success">{brl(total)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Lançamentos</div><div className="text-2xl font-semibold mt-1">{receitas.length}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Contas</div><div className="text-2xl font-semibold mt-1">{contas.length}</div></Card>
      </div>

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
                      <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => setDeleteTarget(r)}><Trash2 size={13} /></button>
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
        onSave={async (items) => {
          if (editing) {
            await updateReceita(editing.id, items[0]);
          } else {
            for (const r of items) await addReceita(r);
          }
          setOpen(false);
        }}
      />
      <DeleteReceitaDialog
        receita={deleteTarget}
        groupCount={deleteTarget?.groupId ? allReceitas.filter((r) => r.groupId === deleteTarget.groupId).length : 0}
        groupFromMonthCount={deleteTarget?.groupId ? allReceitas.filter((r) => r.groupId === deleteTarget.groupId && r.mesRef >= deleteTarget.mesRef).length : 0}
        onClose={() => setDeleteTarget(null)}
        onDeleteSingle={async () => { await removeReceita(deleteTarget!.id); setDeleteTarget(null); }}
        onDeleteGroup={async () => { await removeReceitaGroup(deleteTarget!.groupId!); setDeleteTarget(null); }}
        onDeleteFromMonth={async () => { await removeReceitaFromMonth(deleteTarget!.groupId!, deleteTarget!.mesRef); setDeleteTarget(null); }}
      />
    </div>
  );
}

function nextMonth(mesRef: string, offset: number): string {
  const [y, m] = mesRef.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MESES_OPTIONS = Array.from({ length: 23 }, (_, i) => i + 2); // 2 a 24

function ReceitaModal({
  open, onClose, contas, editing, onSave,
}: {
  open: boolean; onClose: () => void; contas: ContaBancaria[];
  editing: Receita | null; onSave: (items: Omit<Receita, "id">[]) => void;
}) {
  const empty: Omit<Receita, "id"> = {
    fonte: "", categoria: "", valor: 0, contaId: contas[0]?.id, mesRef: new Date().toISOString().slice(0, 7), recorrencia: "Única",
  };
  const [f, setF] = useState<Omit<Receita, "id">>(empty);
  const [qtdMeses, setQtdMeses] = useState(12);

  useEffect(() => {
    if (open) { setF(editing ? { ...editing } : empty); setQtdMeses(12); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const { receitas: allRec } = useStore();
  const categoriasExistentes = Array.from(new Set(allRec.map((r) => r.categoria).filter(Boolean))).sort();

  const isMensal = !editing && f.recorrencia === "Mensal";

  function buildItems(): Omit<Receita, "id">[] {
    if (!isMensal) return [f];

    const gId = crypto.randomUUID();
    return Array.from({ length: qtdMeses }, (_, i) => ({
      ...f,
      mesRef: nextMonth(f.mesRef, i),
      groupId: gId,
    }));
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar receita" : "Nova receita"}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(buildItems()); }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Fonte</label>
            <input className="input" required value={f.fonte} onChange={(e) => setF({ ...f, fonte: e.target.value })} />
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

          {!editing ? (
            <>
              <div>
                <label className="label">Recorrência</label>
                <select className="select" value={f.recorrencia} onChange={(e) => setF({ ...f, recorrencia: e.target.value as Receita["recorrencia"] })}>
                  <option value="Única">Única</option>
                  <option value="Mensal">Mensal</option>
                </select>
              </div>
              {isMensal && (
                <div>
                  <label className="label">Quantidade de meses</label>
                  <select className="select" value={qtdMeses} onChange={(e) => setQtdMeses(parseInt(e.target.value))}>
                    {MESES_OPTIONS.map((n) => <option key={n} value={n}>{n} meses</option>)}
                  </select>
                </div>
              )}
            </>
          ) : editing.recorrencia === "Mensal" && editing.groupId ? (
            <p className="col-span-2 text-xs text-warn/80">
              Receita recorrente · {mesRefBR(editing.mesRef)}
            </p>
          ) : (
            <div className="col-span-2">
              <label className="label">Recorrência</label>
              <select className="select cursor-not-allowed opacity-50" value={f.recorrencia} disabled>
                <option>{f.recorrencia}</option>
              </select>
            </div>
          )}

          {/* Preview dos meses */}
          {isMensal && f.valor > 0 && (
            <div className="col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Receita mensal</span>
                <span className="text-xs text-zinc-400">{qtdMeses}x de <span className="text-primary font-semibold">{brl(f.valor)}</span></span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                {Array.from({ length: Math.min(qtdMeses, 24) }, (_, i) => (
                  <div key={i} className="text-center rounded bg-surface2 px-2 py-1.5">
                    <div className="text-[10px] text-zinc-500">{mesRefBR(nextMonth(f.mesRef, i))}</div>
                    <div className="text-xs font-semibold text-zinc-200">{brl(f.valor)}</div>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-zinc-500">
                Total: {brl(f.valor * qtdMeses)} a partir de {mesRefBR(f.mesRef)}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">
            {isMensal ? `Salvar ${qtdMeses} meses` : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteReceitaDialog({
  receita, groupCount, groupFromMonthCount, onClose, onDeleteSingle, onDeleteGroup, onDeleteFromMonth,
}: {
  receita: Receita | null;
  groupCount: number;
  groupFromMonthCount: number;
  onClose: () => void;
  onDeleteSingle: () => void;
  onDeleteGroup: () => void;
  onDeleteFromMonth: () => void;
}) {
  if (!receita) return null;
  const hasGroup = !!receita.groupId && groupCount > 1;

  return (
    <Modal open={!!receita} onClose={onClose} title="Apagar receita" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-danger/10 p-2">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div className="text-sm text-zinc-300">
            {hasGroup ? (
              <>
                <p className="font-medium text-zinc-100 mb-1">&quot;{receita.fonte}&quot;</p>
                <p>Esta receita faz parte de uma recorrência com <span className="font-semibold text-zinc-100">{groupCount} lançamentos restantes</span>. O que deseja fazer?</p>
              </>
            ) : (
              <p>Tem certeza que deseja apagar <span className="font-semibold text-zinc-100">&quot;{receita.fonte}&quot;</span>?</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {hasGroup && (
            <>
              <button className="btn btn-danger w-full justify-center" onClick={onDeleteGroup}>
                <Trash2 size={14} /> Apagar todas as {groupCount} receitas
              </button>
              {groupFromMonthCount < groupCount && groupFromMonthCount > 0 && (
                <button className="btn btn-soft w-full justify-center text-warn border-warn/30 hover:bg-warn/10" onClick={onDeleteFromMonth}>
                  Apagar de {mesRefBR(receita.mesRef)} em diante ({groupFromMonthCount})
                </button>
              )}
              <button className="btn btn-soft w-full justify-center" onClick={onDeleteSingle}>
                Apagar somente esta receita
              </button>
            </>
          )}
          {!hasGroup && (
            <button className="btn btn-danger w-full justify-center" onClick={onDeleteSingle}>
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
