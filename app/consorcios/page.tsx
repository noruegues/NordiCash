"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Modal from "@/components/ui/Modal";
import { useStore, type Consorcio, type StatusParcela } from "@/lib/store";
import { consorcioStats } from "@/lib/calculations";
import { brl, dataBR } from "@/lib/format";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import MoneyInput from "@/components/ui/MoneyInput";

export default function ConsorciosPage() {
  const { consorcios, contas, addConsorcio, updateConsorcio, removeConsorcio, updateParcela, desmarcarContempladosTodos } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Consorcio | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consórcios"
        subtitle="Carteira"
        action={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus size={16} /> Novo consórcio
          </button>
        }
      />

      {consorcios.length === 0 ? (
        <Card><div className="text-sm text-zinc-500 py-10 text-center">Nenhum consórcio cadastrado</div></Card>
      ) : (
        consorcios.map((c) => {
          const stats = consorcioStats(c);
          const isOpen = expanded === c.id;
          return (
            <Card
              key={c.id}
              title={`${c.bem} · ${c.administradora}`}
              action={
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(isOpen ? null : c.id)}>
                    {isOpen ? "Recolher" : "Ver parcelas"}
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setEditing(c); setOpen(true); }}><Pencil size={13} /></button>
                  <button className="btn btn-ghost btn-sm btn-icon hover:!text-danger" onClick={() => confirm("Apagar?") && removeConsorcio(c.id)}><Trash2 size={13} /></button>
                </div>
              }
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <Stat label="Crédito" value={brl(c.valorCarta)} />
                <Stat label="Taxa adm." value={`${c.taxaAdmin}%`} />
                <Stat
                  label={c.contemplado ? "Parcela atual" : "Parcela reduzida (50%)"}
                  value={brl(stats.parcelaAtual)}
                />
                <Stat
                  label={c.contemplado ? "Parcela cheia" : "Cheia simulada"}
                  value={brl(stats.parcelaCheiaSimulada)}
                />
                <Stat label="Pagas" value={`${stats.pagas}/${c.prazoMeses}`} />
                <Stat label="Saldo dev." value={brl(stats.saldoDevedor)} />
                <Stat label="% quitado" value={`${stats.pct.toFixed(1)}%`} />
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {c.contemplado && <span className="pill pill-success">Contemplado</span>}
                {!c.contemplado && c.pagamentoReduzido !== false && (
                  <span className="pill pill-info">Pagando 50% até a contemplação</span>
                )}
                {c.debitoAutomatico
                  ? <span className="pill pill-info">Débito automático · dia {c.diaVencimento}</span>
                  : <span className="pill pill-muted">Vencimento dia {c.diaVencimento}</span>}
                {c.parcelas.some((p) => p.contemplado) && (
                  <button
                    className="btn btn-ghost btn-sm hover:!text-danger"
                    onClick={() => confirm("Desmarcar todas as parcelas contempladas?") && desmarcarContempladosTodos(c.id)}
                  >
                    Desmarcar todos contemplados
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="mt-5 overflow-x-auto max-h-96">
                  <table className="t">
                    <thead><tr><th>Nº</th><th>Vencimento</th><th className="text-right">Valor pago</th><th className="text-right">Cheia simulada</th><th>Status</th><th>Contemplado</th></tr></thead>
                    <tbody>
                      {c.parcelas.map((p, idx) => {
                        const cheiaSim = stats.cheias[idx] ?? 0;
                        return (
                        <tr key={p.numero}>
                          <td className="text-zinc-500">#{p.numero}</td>
                          <td>{dataBR(p.dataVenc)}</td>
                          <td className="text-right">
                            <ValorPagoCell
                              value={p.valor}
                              onSave={(v) => updateParcela(c.id, p.numero, { valor: v })}
                            />
                          </td>
                          <td className="text-right text-zinc-400">{brl(cheiaSim)}</td>
                          <td>
                            <select
                              className="select !h-7 !text-xs"
                              value={p.status}
                              onChange={(e) => updateParcela(c.id, p.numero, { status: e.target.value as StatusParcela })}
                            >
                              <option>Futuro</option><option>Pendente</option><option>Pago</option>
                            </select>
                          </td>
                          <td>
                            <label className="inline-flex items-center gap-2 text-xs">
                              <input type="checkbox" checked={p.contemplado} onChange={(e) => updateParcela(c.id, p.numero, { contemplado: e.target.checked })} />
                              Sim
                            </label>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })
      )}

      <ConsorcioModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        contas={contas}
        onSave={(d) => {
          if (editing) updateConsorcio(editing.id, d);
          else addConsorcio(d);
          setOpen(false);
        }}
      />
    </div>
  );
}

function ValorPagoCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value.toFixed(2));

  function commit() {
    const v = parseFloat(draft.replace(",", "."));
    if (!isNaN(v) && v >= 0) onSave(v);
    setEditing(false);
  }
  function cancel() {
    setDraft(value.toFixed(2));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <input
          type="number"
          step="0.01"
          autoFocus
          className="input !h-7 !text-xs !py-1 !px-2 w-24 text-right"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          onBlur={commit}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon !h-7 !w-7 !text-success"
          onMouseDown={(e) => { e.preventDefault(); commit(); }}
          title="Salvar"
        >
          <Check size={13} />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-icon !h-7 !w-7 hover:!text-danger"
          onMouseDown={(e) => { e.preventDefault(); cancel(); }}
          title="Cancelar"
        >
          <X size={13} />
        </button>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1 group">
      <span>{brl(value)}</span>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-icon !h-6 !w-6 opacity-0 group-hover:opacity-100 transition"
        title="Editar valor"
        onClick={() => { setDraft(value.toFixed(2)); setEditing(true); }}
      >
        <Pencil size={11} />
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-zinc-500 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function ConsorcioModal({
  open, onClose, editing, contas, onSave,
}: {
  open: boolean; onClose: () => void; editing: Consorcio | null;
  contas: { id: string; nome: string }[];
  onSave: (c: Omit<Consorcio, "id" | "parcelas">) => void;
}) {
  const empty: Omit<Consorcio, "id" | "parcelas"> = {
    bem: "", administradora: "", valorCarta: 0, prazoMeses: 60, parcelaCheia: 0,
    taxaAdmin: 18, inicio: new Date().toISOString().slice(0, 10), diaVencimento: 10,
    debitoAutomatico: false, contaId: undefined, contemplado: false,
    pagamentoReduzido: true, percentualReducao: 0.5,
  };
  const [f, setF] = useState<Omit<Consorcio, "id" | "parcelas">>(empty);
  useEffect(() => {
    if (open) {
      if (editing) {
        const { parcelas, id, ...rest } = editing;
        setF(rest);
      } else {
        setF(empty);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // Cálculos automáticos a partir de: valorCarta + parcelaCheia + prazoMeses
  // parcelaCheia = valorCarta * (1 + taxaAdmin/100) / prazoMeses
  // → taxaAdmin = ((parcelaCheia * prazoMeses / valorCarta) - 1) * 100
  const taxaAdminCalc = f.valorCarta && f.prazoMeses && f.parcelaCheia
    ? ((f.parcelaCheia * f.prazoMeses) / f.valorCarta - 1) * 100
    : 0;
  const reducao = f.pagamentoReduzido === false ? 1 : (f.percentualReducao ?? 0.5);
  const parcelaReduzidaCalc = f.parcelaCheia * reducao;

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar consórcio" : "Novo consórcio"} size="lg">
      <form className="space-y-4" onSubmit={(e) => {
        e.preventDefault();
        // grava a taxa calculada automaticamente
        const data = { ...f, taxaAdmin: Number(taxaAdminCalc.toFixed(2)) };
        onSave(data);
      }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Bem</label>
            <input className="input" required value={f.bem} onChange={(e) => setF({ ...f, bem: e.target.value })} />
          </div>
          <div>
            <label className="label">Administradora</label>
            <input className="input" required value={f.administradora} onChange={(e) => setF({ ...f, administradora: e.target.value })} />
          </div>
          <div>
            <label className="label">Valor da carta <span className="text-zinc-500 text-[10px]">(ajustável anualmente)</span></label>
            <MoneyInput required value={f.valorCarta} onChange={(v) => setF({ ...f, valorCarta: v })} />
          </div>
          <div>
            <label className="label">Prazo (meses)</label>
            <input type="number" className="input" required value={f.prazoMeses || ""} onChange={(e) => setF({ ...f, prazoMeses: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="label">Parcela cheia</label>
            <MoneyInput required value={f.parcelaCheia} onChange={(v) => setF({ ...f, parcelaCheia: v })} />
          </div>
          <div>
            <label className="label">Taxa admin (auto)</label>
            <div className="input flex items-center justify-between text-zinc-300">
              <span>{taxaAdminCalc.toFixed(2)}%</span>
              <span className="text-xs text-zinc-500">calculado</span>
            </div>
          </div>
          <div>
            <label className="label">Início</label>
            <input type="date" className="input" required value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} />
          </div>
          <div>
            <label className="label">Dia de vencimento</label>
            <input type="number" min={1} max={31} className="input" required value={f.diaVencimento} onChange={(e) => setF({ ...f, diaVencimento: parseInt(e.target.value) || 1 })} />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={f.debitoAutomatico} onChange={(e) => setF({ ...f, debitoAutomatico: e.target.checked })} />
              Débito automático
            </label>
          </div>
          {f.debitoAutomatico && (
            <div className="col-span-2">
              <label className="label">Conta de débito</label>
              <select className="select" value={f.contaId ?? ""} onChange={(e) => setF({ ...f, contaId: e.target.value || undefined })}>
                <option value="">Selecione...</option>
                {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          )}
          <div className="col-span-2 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={f.pagamentoReduzido !== false}
                onChange={(e) => setF({ ...f, pagamentoReduzido: e.target.checked })}
              />
              Pagamento reduzido até a contemplação
            </label>
          </div>
          {f.pagamentoReduzido !== false && (
            <>
              <div>
                <label className="label">% pago até contemplação</label>
                <select
                  className="select"
                  value={Math.round((f.percentualReducao ?? 0.5) * 100)}
                  onChange={(e) => setF({ ...f, percentualReducao: parseInt(e.target.value) / 100 })}
                >
                  {[25, 30, 50, 60, 70, 75].map((p) => (
                    <option key={p} value={p}>{p}%</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Parcela reduzida (auto)</label>
                <div className="input flex items-center justify-between text-zinc-300">
                  <span>{brl(parcelaReduzidaCalc)}</span>
                  <span className="text-xs text-zinc-500">calculado</span>
                </div>
              </div>
              <div className="col-span-2 text-xs text-zinc-500 -mt-2">
                Você paga {Math.round((f.percentualReducao ?? 0.5) * 100)}% até ser contemplado. Após a contemplação o sistema recalcula o valor das parcelas restantes automaticamente.
              </div>
            </>
          )}
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={f.contemplado} onChange={(e) => setF({ ...f, contemplado: e.target.checked })} />
              Já contemplado
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
