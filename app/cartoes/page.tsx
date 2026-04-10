"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import CreditCardVisual from "@/components/cards/CreditCardVisual";
import ProgressBar from "@/components/ui/ProgressBar";
import { useStore, type Cartao, type Bandeira, usoCartao } from "@/lib/store";
import { brl, dataBR } from "@/lib/format";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import MoneyInput from "@/components/ui/MoneyInput";
import { useCurrentUser, getPlanLimit } from "@/lib/auth";

export default function CartoesPage() {
  const { cartoes, despesas, addCartao, updateCartao, removeCartao, marcarFaturaPaga } = useStore();
  const user = useCurrentUser();
  const [selected, setSelected] = useState<string | null>(cartoes[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cartao | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  const limit = user ? getPlanLimit(user.plano, "cartoes") : Infinity;
  const atLimit = cartoes.length >= limit;

  function handleAdd() {
    if (atLimit) { setUpgrade(true); return; }
    setEditing(null);
    setOpen(true);
  }

  useEffect(() => {
    if (!selected && cartoes[0]) setSelected(cartoes[0].id);
  }, [cartoes, selected]);

  const cartao = cartoes.find((c) => c.id === selected) ?? null;

  // Aggregate uso & alertas
  const today = new Date();
  const mesAtual = today.toISOString().slice(0, 7);
  const [mesFatura, setMesFatura] = useState<string>(mesAtual);

  const alertas = useMemo(
    () =>
      cartoes.filter((c) => c.faturaPagaMes !== mesAtual && today.getDate() > c.diaVencimento),
    [cartoes, mesAtual]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões"
        subtitle="Crédito"
        action={
          <div className="flex items-center gap-2">
            {limit !== Infinity && (
              <span className="text-xs text-zinc-500">{cartoes.length}/{limit}</span>
            )}
            <button className="btn btn-primary" onClick={handleAdd}>
              <Plus size={16} /> Novo cartão
            </button>
          </div>
        }
      />

      {alertas.length > 0 && (
        <div className="card border-danger/40">
          <div className="card-body flex items-center gap-3">
            <AlertTriangle className="text-danger" size={20} />
            <div className="flex-1">
              <div className="font-semibold text-zinc-100">Faturas em atraso</div>
              <div className="text-sm text-zinc-400">
                {alertas.map((a) => a.nome).join(", ")} — vencimento já passou e não foi marcada como paga.
              </div>
            </div>
          </div>
        </div>
      )}

      {cartoes.length === 0 ? (
        <Card><div className="text-sm text-zinc-500 py-6 text-center">Nenhum cartão cadastrado</div></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cartoes.map((c) => (
            <CreditCardVisual
              key={c.id}
              cartao={c}
              usado={usoCartao(c.id, despesas, c.faturaPagaMes)}
              selected={selected === c.id}
              onClick={() => setSelected(c.id)}
            />
          ))}
        </div>
      )}

      {cartao && (() => {
        // "Limite utilizado total" = todas despesas não pagas, independente do mês
        const usadoTotal = despesas
          .filter((d) => d.cartaoId === cartao.id && !d.pago)
          .reduce((s, d) => s + d.valor, 0);
        // Despesas do mês selecionado
        const itensMes = despesas
          .filter((d) => d.cartaoId === cartao.id && d.mesRef === mesFatura);
        const totalMes = itensMes.reduce((s, i) => s + i.valor, 0);
        const totalMesAberto = itensMes.filter((d) => !d.pago).reduce((s, i) => s + i.valor, 0);
        const pct = cartao.limite > 0 ? (usadoTotal / cartao.limite) * 100 : 0;
        const overdue = cartao.faturaPagaMes !== mesFatura && mesFatura <= mesAtual && today.getDate() > cartao.diaVencimento;
        const faturaPaga = cartao.faturaPagaMes === mesFatura || (itensMes.length > 0 && itensMes.every((d) => d.pago));

        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title={`Limite — ${cartao.nome}`}>
                <ProgressBar value={usadoTotal} max={cartao.limite} highlight={totalMesAberto} />
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-400">Limite total</span><span className="font-semibold text-zinc-100">{brl(cartao.limite)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Utilizado total</span><span className="font-semibold text-zinc-100">{brl(usadoTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-primary">Mês {mesFatura}</span><span className="font-semibold text-primary">{brl(totalMesAberto)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-zinc-400">Disponível</span><span className="font-semibold text-success">{brl(cartao.limite - usadoTotal)}</span></div>
                </div>
                {pct >= 90 && <div className="mt-3 text-xs text-danger">⚠️ Acima de 90% do limite</div>}
                {pct >= 70 && pct < 90 && <div className="mt-3 text-xs text-warn">⚠️ Atenção: 70% do limite usado</div>}
                <div className="mt-4 flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(cartao); setOpen(true); }}>
                    <Pencil size={13} /> Editar
                  </button>
                  <button className="btn btn-ghost btn-sm hover:!text-danger" onClick={() => confirm("Apagar cartão?") && (removeCartao(cartao.id), setSelected(null))}>
                    <Trash2 size={13} /> Apagar
                  </button>
                </div>
              </Card>

              <Card
                title={`Fatura ${mesFatura}`}
                className="lg:col-span-2"
                action={
                  <div className="flex items-center gap-2">
                    <input
                      type="month"
                      className="input !h-8 !text-xs !py-1"
                      value={mesFatura}
                      onChange={(e) => setMesFatura(e.target.value)}
                    />
                    <button
                      className={`btn btn-sm ${overdue ? "btn-danger" : "btn-success"}`}
                      onClick={() => marcarFaturaPaga(cartao.id, mesFatura)}
                    >
                      <CheckCircle2 size={14} /> Marcar fatura paga
                    </button>
                  </div>
                }
              >
                <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-zinc-400">
                    Vencimento dia {cartao.diaVencimento}
                    {overdue && <span className="ml-2 pill pill-danger">EM ATRASO</span>}
                    {faturaPaga && <span className="ml-2 pill pill-success">PAGA</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Total da fatura</div>
                    <div className="text-2xl font-semibold">{brl(totalMes)}</div>
                    {totalMesAberto !== totalMes && (
                      <div className="text-xs text-success">Em aberto: {brl(totalMesAberto)}</div>
                    )}
                  </div>
                </div>
                {itensMes.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-6 text-center">Sem lançamentos neste mês</div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="t min-w-[560px]">
                    <thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Status</th><th className="text-right">Valor</th></tr></thead>
                    <tbody>
                      {itensMes.map((i) => (
                        <tr key={i.id} className={i.pago ? "opacity-60" : ""}>
                          <td>{i.descricao}</td>
                          <td><span className="pill pill-muted">{i.categoria}</span></td>
                          <td className="text-zinc-500">{dataBR(i.data)}</td>
                          <td>{i.pago ? <span className="pill pill-success">Pago</span> : <span className="pill pill-muted">Aberto</span>}</td>
                          <td className="text-right font-medium">{brl(i.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </Card>
            </div>
          </>
        );
      })()}

      <CartaoModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSave={(data) => {
          if (editing) updateCartao(editing.id, data);
          else addCartao(data);
          setOpen(false);
        }}
      />
      <UpgradeModal
        open={upgrade}
        onClose={() => setUpgrade(false)}
        reason={`Seu plano ${user?.plano} permite no máximo ${limit} cartões. Faça upgrade para adicionar mais.`}
      />
    </div>
  );
}

function CartaoModal({
  open, onClose, editing, onSave,
}: {
  open: boolean; onClose: () => void; editing: Cartao | null;
  onSave: (c: Omit<Cartao, "id">) => void;
}) {
  const empty: Omit<Cartao, "id"> = {
    nome: "", banco: "", bandeira: "Visa", cor: "#0F0F0F", limite: 0, diaVencimento: 10,
  };
  const [f, setF] = useState<Omit<Cartao, "id">>(empty);

  useEffect(() => {
    if (open) setF(editing ? { ...editing } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const bandeiras: Bandeira[] = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"];

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar cartão" : "Novo cartão"}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Apelido</label>
            <input className="input" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Banco</label>
            <input className="input" required value={f.banco} onChange={(e) => setF({ ...f, banco: e.target.value })} />
          </div>
          <div>
            <label className="label">Bandeira</label>
            <select className="select" value={f.bandeira} onChange={(e) => setF({ ...f, bandeira: e.target.value as Bandeira })}>
              {bandeiras.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Limite</label>
            <MoneyInput required value={f.limite} onChange={(v) => setF({ ...f, limite: v })} />
          </div>
          <div>
            <label className="label">Dia de vencimento</label>
            <input type="number" min={1} max={31} className="input" required value={f.diaVencimento} onChange={(e) => setF({ ...f, diaVencimento: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="col-span-2">
            <label className="label">Cor do cartão</label>
            <input type="color" className="input !p-1 h-10" value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} />
          </div>
          {/* Pré-visualização */}
          <div className="col-span-2 mt-2">
            <div className="rounded-md p-5 h-32 relative overflow-hidden border border-border" style={{ background: `linear-gradient(135deg, ${f.cor}, #000)` }}>
              <div className="text-xs text-white/60">{f.banco || "Banco"}</div>
              <div className="font-semibold text-white">{f.nome || "Cartão"}</div>
              <div className="absolute bottom-5 right-5 text-xs font-bold text-white/80 tracking-wider">{f.bandeira.toUpperCase()}</div>
              <div className="absolute bottom-5 left-5 text-white text-sm font-mono">R$ {f.limite.toLocaleString("pt-BR")}</div>
            </div>
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
