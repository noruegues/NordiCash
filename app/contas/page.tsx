"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { useStore, type ContaBancaria } from "@/lib/store";
import { brl } from "@/lib/format";
import { Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import MoneyInput from "@/components/ui/MoneyInput";
import UpgradeModal from "@/components/UpgradeModal";
import { useCurrentUser, getPlanLimit } from "@/lib/auth";
import ExportButton from "@/components/ui/ExportButton";
import { exportPDF, exportExcel } from "@/lib/export";

// Saldo real = saldoInicial + entradas (receitas) - saídas (despesas pagas com essa conta; NÃO inclui cartão)
function saldoRealConta(contaId: string, state: ReturnType<typeof useStore.getState>) {
  const { receitas, despesas, contas } = state;
  const conta = contas.find((c) => c.id === contaId);
  if (!conta) return 0;
  const entradas = receitas.filter((r) => r.contaId === contaId).reduce((s, r) => s + r.valor, 0);
  const saidas = despesas
    .filter((d) => d.contaId === contaId && !d.cartaoId)
    .reduce((s, d) => s + d.valor, 0);
  return conta.saldoInicial + entradas - saidas;
}

export default function ContasPage() {
  const state = useStore();
  const { contas, receitas, despesas, addConta, updateConta, removeConta } = state;
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContaBancaria | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  const limit = user ? getPlanLimit(user.plano, "contas") : Infinity;
  const atLimit = contas.length >= limit;

  function handleAdd() {
    if (atLimit) { setUpgrade(true); return; }
    setEditing(null);
    setOpen(true);
  }

  // Só conta o que realmente entrou/saiu até o mês atual — evita inflar saldo com valores projetados
  const mesAtual = new Date().toISOString().slice(0, 7);
  const saldosPorConta = contas.map((c) => {
    const entradas = receitas
      .filter((r) => r.contaId === c.id && r.mesRef <= mesAtual)
      .reduce((s, r) => s + r.valor, 0);
    const saidas = despesas
      .filter((d) => d.contaId === c.id && !d.cartaoId && d.mesRef <= mesAtual)
      .reduce((s, d) => s + d.valor, 0);
    const saldo = c.saldoInicial + entradas - saidas;
    return { conta: c, entradas, saidas, saldo };
  });
  const totalSaldo = saldosPorConta.reduce((s, x) => s + x.saldo, 0);
  const totalEntradas = saldosPorConta.reduce((s, x) => s + x.entradas, 0);
  const totalSaidas = saldosPorConta.reduce((s, x) => s + x.saidas, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas bancárias"
        subtitle="Saldo real em tempo real"
        action={
          <div className="flex items-center gap-2">
            <ExportButton
              onExportPDF={() => exportPDF({
                title: "Contas Bancárias", columns: [
                  { header: "Nome", key: "nome" }, { header: "Banco", key: "banco" },
                  { header: "Tipo", key: "tipo" }, { header: "Saldo Inicial", key: "saldoInicial", format: "brl" },
                ],
                rows: contas, totals: { saldoInicial: contas.reduce((s, c) => s + c.saldoInicial, 0) },
                filename: `nordicash-contas-${new Date().toISOString().slice(0, 7)}`,
              })}
              onExportExcel={() => exportExcel({
                title: "Contas Bancárias", columns: [
                  { header: "Nome", key: "nome" }, { header: "Banco", key: "banco" },
                  { header: "Tipo", key: "tipo" }, { header: "Saldo Inicial", key: "saldoInicial", format: "brl" },
                ],
                rows: contas, totals: { saldoInicial: contas.reduce((s, c) => s + c.saldoInicial, 0) },
                filename: `nordicash-contas-${new Date().toISOString().slice(0, 7)}`,
              })}
            />
            {limit !== Infinity && (
              <span className="text-xs text-zinc-500">{contas.length}/{limit}</span>
            )}
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={16} /> Nova conta
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider">Saldo total</div><div className="text-2xl font-semibold mt-1">{brl(totalSaldo)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1"><TrendingUp size={12} className="text-success" /> Entradas</div><div className="text-2xl font-semibold mt-1 text-success">{brl(totalEntradas)}</div></Card>
        <Card><div className="text-xs text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1"><TrendingDown size={12} className="text-danger" /> Saídas</div><div className="text-2xl font-semibold mt-1 text-danger">{brl(totalSaidas)}</div></Card>
      </div>

      <Card title="Minhas contas">
        {contas.length === 0 ? (
          <div className="text-sm text-zinc-500 py-6 text-center">Nenhuma conta cadastrada</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {saldosPorConta.map(({ conta: c, entradas, saidas, saldo }) => (
              <div key={c.id} className="border border-border rounded p-4 bg-surface2/40 relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded grid place-items-center text-white font-bold" style={{ background: c.cor }}>
                    {c.banco[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-zinc-100 truncate">{c.nome}</div>
                    <div className="text-xs text-zinc-500">{c.banco} · {c.tipo}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-zinc-500 uppercase tracking-wider inline-flex items-center gap-1"><Wallet size={11} /> Saldo real</div>
                <div className={`text-2xl font-semibold ${saldo < 0 ? "text-danger" : "text-zinc-100"}`}>{brl(saldo)}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-zinc-500">Inicial</div>
                    <div className="font-medium">{brl(c.saldoInicial)}</div>
                  </div>
                  <div>
                    <div className="text-success">Entradas</div>
                    <div className="font-medium text-success">{brl(entradas)}</div>
                  </div>
                  <div>
                    <div className="text-danger">Saídas</div>
                    <div className="font-medium text-danger">{brl(saidas)}</div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 flex gap-1">
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditing(c); setOpen(true); }}><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => confirm("Apagar conta?") && removeConta(c.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ContaModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(data) => {
          if (editing) updateConta(editing.id, data);
          else addConta(data);
          setOpen(false);
        }}
      />
      <UpgradeModal
        open={upgrade}
        onClose={() => setUpgrade(false)}
        reason={`Seu plano ${user?.plano} permite no máximo ${limit} ${limit === 1 ? "conta" : "contas"}. Faça upgrade para adicionar mais.`}
      />
    </div>
  );
}

function ContaModal({
  open, onClose, editing, onSave,
}: {
  open: boolean; onClose: () => void; editing: ContaBancaria | null;
  onSave: (c: Omit<ContaBancaria, "id">) => void;
}) {
  const empty: Omit<ContaBancaria, "id"> = { nome: "", banco: "", tipo: "Corrente", saldoInicial: 0, cor: "#3B82F6" };
  const [f, setF] = useState<Omit<ContaBancaria, "id">>(empty);

  useEffect(() => {
    if (open) setF(editing ? { ...editing } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar conta" : "Nova conta bancária"}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nome</label>
            <input className="input" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Banco</label>
            <input className="input" required value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select className="select" value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as ContaBancaria["tipo"] })}>
              <option>Corrente</option><option>Poupança</option><option>Pagamento</option>
            </select>
          </div>
          <div>
            <label className="label">Saldo inicial</label>
            <MoneyInput value={f.saldoInicial} onChange={(v) => setF({ ...f, saldoInicial: v })} />
          </div>
          <div>
            <label className="label">Cor</label>
            <input type="color" className="input !p-1 h-9" value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} />
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
