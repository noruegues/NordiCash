"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import CreditCardVisual from "@/components/cards/CreditCardVisual";
import ProgressBar from "@/components/ui/ProgressBar";
import { useStore, type Cartao, type Bandeira, type ContaBancaria, usoCartao, CATEGORIA_ANTECIPACAO_FATURA, FORMA_ANTECIPACAO_FATURA } from "@/lib/store";
import { brl, dataBR, mesRefBR } from "@/lib/format";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2, Undo2, Star, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import UpgradeModal from "@/components/UpgradeModal";
import MoneyInput from "@/components/ui/MoneyInput";
import NumberInput from "@/components/ui/NumberInput";
import { useCurrentUser, getPlanLimit } from "@/lib/auth";
import ExportButton from "@/components/ui/ExportButton";
import { exportPDF, exportExcel } from "@/lib/export";

export default function CartoesPage() {
  const { cartoes, contas, despesas, addCartao, updateCartao, removeCartao, setCartaoDefault, reorderCartoes, marcarFaturaPaga, desmarcarFaturaPaga, addDespesa, removeDespesa } = useStore();
  const user = useCurrentUser();
  const [selected, setSelected] = useState<string | null>(cartoes[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cartao | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [payDialog, setPayDialog] = useState<{ cartaoId: string; mes: string; valor: number } | null>(null);
  const [antecipDialog, setAntecipDialog] = useState<{ cartaoId: string; mes: string; sugerido: number } | null>(null);
  const [noContaDialog, setNoContaDialog] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);
  const dragGhost = useRef<HTMLDivElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: string, node: HTMLDivElement) => {
    setDragId(id);
    dragNode.current = node;
    e.dataTransfer.effectAllowed = "move";
    // Cria clone do cartão como drag image — mantém vivo até dragEnd
    const clone = node.cloneNode(true) as HTMLDivElement;
    clone.style.width = `${node.offsetWidth}px`;
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.zIndex = "-1";
    clone.style.opacity = "0.9";
    clone.style.borderRadius = "12px";
    clone.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)";
    clone.style.transform = "rotate(-2deg) scale(0.95)";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);
    dragGhost.current = clone;
    e.dataTransfer.setDragImage(clone, node.offsetWidth / 2, 40);
  }, []);

  const handleDragEnd = useCallback(() => {
    // Remove o ghost clone
    if (dragGhost.current) {
      document.body.removeChild(dragGhost.current);
      dragGhost.current = null;
    }
    if (dragId !== null && dragOver !== null) {
      const fromIdx = cartoes.findIndex((c) => c.id === dragId);
      if (fromIdx !== -1 && fromIdx !== dragOver) {
        const ids = cartoes.map((c) => c.id);
        const [moved] = ids.splice(fromIdx, 1);
        ids.splice(dragOver, 0, moved);
        reorderCartoes(ids);
      }
    }
    setDragId(null);
    setDragOver(null);
    dragNode.current = null;
  }, [dragId, dragOver, cartoes, reorderCartoes]);

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
      cartoes.filter((c) => {
        if (c.faturaPagaMes === mesAtual) return false;
        if (today.getDate() <= c.diaVencimento) return false;
        // Só alerta se houver despesas no mês atual (sem fatura não há o que pagar)
        const temFatura = despesas.some((d) => d.cartaoId === c.id && d.mesRef === mesAtual);
        return temFatura;
      }),
    [cartoes, despesas, mesAtual]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cartões"
        subtitle="Crédito"
        action={
          <div className="flex items-center gap-2">
            <ExportButton
              onExportPDF={() => exportPDF({
                title: "Cartões", columns: [
                  { header: "Nome", key: "nome" }, { header: "Banco", key: "banco" },
                  { header: "Bandeira", key: "bandeira" }, { header: "Limite", key: "limite", format: "brl" },
                ],
                rows: cartoes, filename: `nordicash-cartoes-${new Date().toISOString().slice(0, 7)}`,
              })}
              onExportExcel={() => exportExcel({
                title: "Cartões", columns: [
                  { header: "Nome", key: "nome" }, { header: "Banco", key: "banco" },
                  { header: "Bandeira", key: "bandeira" }, { header: "Limite", key: "limite", format: "brl" },
                ],
                rows: cartoes, filename: `nordicash-cartoes-${new Date().toISOString().slice(0, 7)}`,
              })}
            />
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
          {cartoes.map((c, idx) => (
            <div
              key={c.id}
              className={`relative group transition-all ${
                dragId === c.id
                  ? "opacity-30 scale-95 border-2 border-dashed border-zinc-500 rounded-xl"
                  : dragOver === idx && dragId !== c.id
                    ? "border-2 border-dashed border-primary/50 rounded-xl scale-[1.02]"
                    : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, c.id, e.currentTarget as HTMLDivElement)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => { e.preventDefault(); setDragOver(idx); }}
              onDragLeave={() => { if (dragOver === idx) setDragOver(null); }}
            >
              {/* Controles: grip + estrela */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                {cartoes.length > 1 && (
                  <div
                    className="p-1 rounded cursor-grab text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-zinc-200 transition active:cursor-grabbing"
                    title="Arrastar para reordenar"
                  >
                    <GripVertical size={16} />
                  </div>
                )}
                <button
                  className={`p-1 rounded transition ${
                    c.isDefault
                      ? "text-yellow-400"
                      : "text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-yellow-400"
                  }`}
                  onClick={(e) => { e.stopPropagation(); setCartaoDefault(c.id); }}
                  title={c.isDefault ? "Cartão padrão" : "Definir como padrão"}
                >
                  <Star size={16} fill={c.isDefault ? "currentColor" : "none"} />
                </button>
              </div>
              <CreditCardVisual
                cartao={c}
                usado={usoCartao(c.id, despesas, c.faturaPagaMes)}
                selected={selected === c.id}
                onClick={() => setSelected(c.id)}
              />
            </div>
          ))}
        </div>
      )}

      {cartao && (() => {
        // "Limite utilizado total" = não-pagas − antecipações (antecipação libera limite)
        const usadoBruto = despesas
          .filter((d) => d.cartaoId === cartao.id && !d.pago)
          .reduce((s, d) => s + d.valor, 0);
        const antecipacoesCartao = despesas
          .filter((d) => d.cartaoId === cartao.id && d.forma === FORMA_ANTECIPACAO_FATURA)
          .reduce((s, d) => s + d.valor, 0);
        const usadoTotal = Math.max(0, usadoBruto - antecipacoesCartao);
        // Despesas do mês selecionado
        const itensMesAll = despesas
          .filter((d) => d.cartaoId === cartao.id && d.mesRef === mesFatura);
        const itensMes = itensMesAll.filter((d) => d.forma !== FORMA_ANTECIPACAO_FATURA);
        const antecipacoes = itensMesAll.filter((d) => d.forma === FORMA_ANTECIPACAO_FATURA);
        const totalMes = itensMes.reduce((s, i) => s + i.valor, 0);
        const totalAntecipado = antecipacoes.reduce((s, a) => s + a.valor, 0);
        const totalMesAbertoBruto = itensMes.filter((d) => !d.pago).reduce((s, i) => s + i.valor, 0);
        const totalMesAberto = Math.max(0, totalMesAbertoBruto - totalAntecipado);
        const pct = cartao.limite > 0 ? (usadoTotal / cartao.limite) * 100 : 0;
        const overdue = cartao.faturaPagaMes !== mesFatura && mesFatura <= mesAtual && today.getDate() > cartao.diaVencimento;
        const faturaPaga = cartao.faturaPagaMes === mesFatura || (itensMes.length > 0 && (itensMes.every((d) => d.pago) || totalMesAberto === 0));

        return (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card title={`Limite — ${cartao.nome}`}>
                <ProgressBar value={usadoTotal} max={cartao.limite} highlight={totalMesAberto} />
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-400">Limite total</span><span className="font-semibold text-zinc-100" data-money>{brl(cartao.limite)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-400">Utilizado total</span><span className="font-semibold text-zinc-100" data-money>{brl(usadoTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-primary">Mês {mesFatura}</span><span className="font-semibold text-primary" data-money>{brl(totalMesAberto)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="text-zinc-400">Disponível</span><span className="font-semibold text-success" data-money>{brl(cartao.limite - usadoTotal)}</span></div>
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
                title={
                  <div className="flex items-center gap-2">
                    <span>Fatura</span>
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        className="p-0.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition"
                        onClick={() => {
                          const [y, m] = mesFatura.split("-").map(Number);
                          const d = new Date(y, m - 2, 1);
                          setMesFatura(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                        }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-medium text-zinc-300 min-w-[80px] text-center">
                        {mesRefBR(mesFatura)}
                      </span>
                      <button
                        className="p-0.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition"
                        onClick={() => {
                          const [y, m] = mesFatura.split("-").map(Number);
                          const d = new Date(y, m, 1);
                          setMesFatura(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                        }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                }
                className="lg:col-span-2"
                action={
                  itensMes.length > 0 ? (
                    <div className="flex items-center gap-2">
                      {!faturaPaga && totalMesAberto > 0 && (
                        <button
                          className="btn btn-sm btn-ghost text-success hover:!bg-success/10"
                          onClick={() => {
                            if (contas.length === 0) { setNoContaDialog(true); return; }
                            setAntecipDialog({ cartaoId: cartao.id, mes: mesFatura, sugerido: totalMesAberto });
                          }}
                        >
                          <CheckCircle2 size={14} /> Antecipar pagamento
                        </button>
                      )}
                      {faturaPaga ? (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => desmarcarFaturaPaga(cartao.id, mesFatura)}
                        >
                          <Undo2 size={14} /> Cancelar pagamento
                        </button>
                      ) : (
                        <button
                          className={`btn btn-sm ${overdue ? "btn-danger" : "btn-success"}`}
                          onClick={() => {
                            if (contas.length === 0) {
                              setNoContaDialog(true);
                              return;
                            }
                            if (contas.length === 1) {
                              marcarFaturaPaga(cartao.id, mesFatura, contas[0].id);
                              return;
                            }
                            setPayDialog({ cartaoId: cartao.id, mes: mesFatura, valor: totalMesAberto });
                          }}
                        >
                          <CheckCircle2 size={14} /> Marcar fatura paga
                        </button>
                      )}
                    </div>
                  ) : undefined
                }
              >
                <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Vencimento dia {cartao.diaVencimento}</span>
                    {cartao.diaFechamento && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>Fecha dia {cartao.diaFechamento}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-success">Melhor compra: dia {(cartao.diaFechamento % 31) + 1}</span>
                      </>
                    )}
                    {itensMes.length > 0 && overdue && <span className="pill pill-danger">EM ATRASO</span>}
                    {itensMes.length > 0 && faturaPaga && <span className="pill pill-success">PAGA</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Total da fatura</div>
                    <div className="text-2xl font-semibold">{brl(totalMes)}</div>
                    {totalAntecipado > 0 && (
                      <div className="text-xs text-success">Antecipado: {brl(totalAntecipado)}</div>
                    )}
                    {totalMesAberto !== totalMes && (
                      <div className="text-xs text-success">Em aberto: {brl(totalMesAberto)}</div>
                    )}
                  </div>
                </div>
                {itensMesAll.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-6 text-center">Sem lançamentos neste mês</div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="t min-w-[600px]">
                    <thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Status</th><th className="text-right">Valor</th><th></th></tr></thead>
                    <tbody>
                      {itensMes.map((i) => (
                        <tr key={i.id} className={i.pago ? "opacity-60" : ""}>
                          <td>{i.descricao}</td>
                          <td><span className="pill pill-muted">{i.categoria}</span></td>
                          <td className="text-zinc-500">{dataBR(i.data)}</td>
                          <td>{i.pago ? <span className="pill pill-success">Pago</span> : <span className="pill pill-muted">Aberto</span>}</td>
                          <td className="text-right font-medium">{brl(i.valor)}</td>
                          <td></td>
                        </tr>
                      ))}
                      {antecipacoes.map((a) => (
                        <tr key={a.id} className="bg-success/5">
                          <td className="text-success">{a.descricao}</td>
                          <td><span className="pill pill-success">{a.categoria}</span></td>
                          <td className="text-success/80">{dataBR(a.data)}</td>
                          <td><span className="pill pill-success">Antecipado</span></td>
                          <td className="text-right font-medium text-success">− {brl(a.valor)}</td>
                          <td className="text-right">
                            <button
                              className="btn btn-ghost btn-sm btn-icon hover:!text-danger"
                              title="Apagar antecipação"
                              onClick={() => { if (confirm(`Apagar antecipação de ${brl(a.valor)}?`)) removeDespesa(a.id); }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
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

      <PagarFaturaDialog
        data={payDialog}
        contas={contas}
        onCancel={() => setPayDialog(null)}
        onConfirm={(contaId) => {
          if (payDialog) marcarFaturaPaga(payDialog.cartaoId, payDialog.mes, contaId);
          setPayDialog(null);
        }}
      />

      <SemContaDialog
        open={noContaDialog}
        onClose={() => setNoContaDialog(false)}
      />

      <AntecipacaoDialog
        data={antecipDialog}
        contas={contas}
        cartaoNome={cartao?.nome ?? ""}
        onCancel={() => setAntecipDialog(null)}
        onConfirm={async ({ valor, data, contaId }) => {
          if (!antecipDialog) return;
          await addDespesa({
            descricao: `Antecipação — ${cartao?.nome ?? ""} ${mesRefBR(antecipDialog.mes)}`,
            categoria: CATEGORIA_ANTECIPACAO_FATURA,
            valor,
            data,
            mesRef: antecipDialog.mes,
            forma: FORMA_ANTECIPACAO_FATURA,
            contaId,
            cartaoId: antecipDialog.cartaoId,
            recorrencia: "Única",
            pago: true,
          });
          setAntecipDialog(null);
        }}
      />
    </div>
  );
}

function PagarFaturaDialog({
  data, contas, onCancel, onConfirm,
}: {
  data: { cartaoId: string; mes: string; valor: number } | null;
  contas: ContaBancaria[];
  onCancel: () => void;
  onConfirm: (contaId: string) => void;
}) {
  const defaultConta = contas.find((c) => c.isDefault) ?? contas[0];
  const [contaId, setContaId] = useState(defaultConta?.id ?? "");

  useEffect(() => {
    if (data) setContaId(defaultConta?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Modal open={!!data} onClose={onCancel} title="Pagar fatura">
      <div className="space-y-4">
        <div className="text-sm text-zinc-400">
          Pagando fatura de <span className="font-semibold text-zinc-100">{data ? mesRefBR(data.mes) : ""}</span> no valor de <span className="font-semibold text-success">{data ? brl(data.valor) : ""}</span>.
        </div>
        <div>
          <label className="label">Conta de débito</label>
          <select className="select" value={contaId} onChange={(e) => setContaId(e.target.value)}>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.isDefault ? "★ " : ""}{c.nome} · {c.banco}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-success" disabled={!contaId} onClick={() => onConfirm(contaId)}>
            <CheckCircle2 size={14} /> Pagar fatura
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AntecipacaoDialog({
  data, contas, cartaoNome, onCancel, onConfirm,
}: {
  data: { cartaoId: string; mes: string; sugerido: number } | null;
  contas: ContaBancaria[];
  cartaoNome: string;
  onCancel: () => void;
  onConfirm: (p: { valor: number; data: string; contaId: string }) => void;
}) {
  const defaultConta = contas.find((c) => c.isDefault) ?? contas[0];
  const [contaId, setContaId] = useState(defaultConta?.id ?? "");
  const [valor, setValor] = useState(0);
  const [dataPag, setDataPag] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (data) {
      setContaId(defaultConta?.id ?? "");
      setValor(data.sugerido);
      setDataPag(new Date().toISOString().slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const valorInvalido = !valor || valor <= 0 || valor > (data?.sugerido ?? 0);

  return (
    <Modal open={!!data} onClose={onCancel} title="Antecipar pagamento">
      <div className="space-y-4">
        <div className="text-sm text-zinc-400">
          Antecipando fatura de <span className="font-semibold text-zinc-100">{cartaoNome} — {data ? mesRefBR(data.mes) : ""}</span>. Em aberto: <span className="font-semibold text-success">{data ? brl(data.sugerido) : ""}</span>.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Categoria</label>
            <input className="input cursor-not-allowed opacity-60" value={CATEGORIA_ANTECIPACAO_FATURA} readOnly />
          </div>
          <div>
            <label className="label">Valor</label>
            <MoneyInput value={valor} onChange={setValor} />
            {valor > (data?.sugerido ?? 0) && (
              <div className="text-[11px] text-danger mt-1">Valor maior que o em aberto.</div>
            )}
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={dataPag} onChange={(e) => setDataPag(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Conta de débito</label>
            <select className="select" value={contaId} onChange={(e) => setContaId(e.target.value)}>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.isDefault ? "★ " : ""}{c.nome} · {c.banco}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button type="button" className="btn btn-success" disabled={!contaId || valorInvalido} onClick={() => onConfirm({ valor, data: dataPag, contaId })}>
            <CheckCircle2 size={14} /> Antecipar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SemContaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Sem conta cadastrada">
      <div className="space-y-4">
        <div className="text-sm text-zinc-400">
          Para pagar a fatura, você precisa ter pelo menos uma conta bancária cadastrada. O valor será debitado dela.
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <Link href="/contas" className="btn btn-primary" onClick={onClose}>
            <Plus size={14} /> Criar conta
          </Link>
        </div>
      </div>
    </Modal>
  );
}

function CartaoModal({
  open, onClose, editing, onSave,
}: {
  open: boolean; onClose: () => void; editing: Cartao | null;
  onSave: (c: Omit<Cartao, "id">) => void;
}) {
  const empty: Omit<Cartao, "id"> = {
    nome: "", banco: "", bandeira: "Visa", cor: "#0F0F0F", limite: 0, diaVencimento: 10, diaFechamento: undefined,
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
            <select
              className="select"
              required
              value={f.diaVencimento}
              onChange={(e) => setF({ ...f, diaVencimento: parseInt(e.target.value) })}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Dia de fechamento</label>
            <select
              className="select"
              value={f.diaFechamento ?? ""}
              onChange={(e) => setF({ ...f, diaFechamento: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">—</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {f.diaFechamento && (
            <div className="col-span-2 -mt-2 text-xs text-zinc-500">
              Melhor dia para compra: <span className="text-success font-medium">dia {((f.diaFechamento % 31) + 1)}</span> — compras feitas a partir desse dia caem na próxima fatura.
            </div>
          )}
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
