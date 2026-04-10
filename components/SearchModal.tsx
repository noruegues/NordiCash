"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";
import {
  Search, X, Receipt, TrendingUp, Landmark, CreditCard, LineChart, Layers, Wallet,
} from "lucide-react";

type Result = {
  module: string;
  icon: typeof Receipt;
  href: string;
  label: string;
  detail?: string;
  value?: number;
};

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { despesas, receitas, contas, cartoes, investimentos, consorcios, bens } = useStore();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: Result[] = [];

    for (const d of despesas) {
      if (d.descricao.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q)) {
        out.push({ module: "Despesas", icon: Receipt, href: "/despesas", label: d.descricao, detail: d.categoria, value: d.valor });
      }
    }
    for (const r of receitas) {
      if (r.fonte.toLowerCase().includes(q) || r.categoria.toLowerCase().includes(q)) {
        out.push({ module: "Receitas", icon: TrendingUp, href: "/receitas", label: r.fonte, detail: r.categoria, value: r.valor });
      }
    }
    for (const c of contas) {
      if (c.nome.toLowerCase().includes(q) || c.banco.toLowerCase().includes(q)) {
        out.push({ module: "Contas", icon: Landmark, href: "/contas", label: c.nome, detail: c.banco });
      }
    }
    for (const c of cartoes) {
      if (c.nome.toLowerCase().includes(q) || c.banco.toLowerCase().includes(q)) {
        out.push({ module: "Cartões", icon: CreditCard, href: "/cartoes", label: c.nome, detail: `${c.banco} · ${c.bandeira}` });
      }
    }
    for (const i of investimentos) {
      if (i.nome.toLowerCase().includes(q) || i.tipo.toLowerCase().includes(q)) {
        out.push({ module: "Investimentos", icon: LineChart, href: "/investimentos", label: i.nome, detail: i.tipo, value: i.saldoAtual });
      }
    }
    for (const c of consorcios) {
      if (c.bem.toLowerCase().includes(q) || c.administradora.toLowerCase().includes(q)) {
        out.push({ module: "Consórcios", icon: Layers, href: "/consorcios", label: c.bem, detail: c.administradora, value: c.valorCarta });
      }
    }
    for (const b of bens) {
      if (b.nome.toLowerCase().includes(q) || b.tipo.toLowerCase().includes(q)) {
        out.push({ module: "Patrimônio", icon: Wallet, href: "/patrimonio", label: b.nome, detail: b.tipo, value: b.valorMercado });
      }
    }

    return out.slice(0, 50);
  }, [query, despesas, receitas, contas, cartoes, investimentos, consorcios, bens]);

  // Agrupar por módulo
  const grouped = useMemo(() => {
    const map: Record<string, Result[]> = {};
    for (const r of results) {
      (map[r.module] ||= []).push(r);
    }
    return map;
  }, [results]);

  const flatResults = results;

  function navigate(r: Result) {
    router.push(r.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && flatResults[selected]) {
      e.preventDefault();
      navigate(flatResults[selected]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel max-w-xl !p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
            placeholder="Buscar despesas, receitas, contas, cartões..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
          <kbd className="text-[10px] text-zinc-500 border border-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </div>
          )}

          {!query && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Digite para buscar em todos os módulos
            </div>
          )}

          {Object.entries(grouped).map(([module, items]) => (
            <div key={module}>
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-medium bg-surface2/50">
                {module} ({items.length})
              </div>
              {items.map((r) => {
                flatIdx++;
                const idx = flatIdx;
                const Icon = r.icon;
                return (
                  <button
                    key={`${r.module}-${r.label}-${idx}`}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors
                      ${idx === selected ? "bg-primary/10 text-primary" : "text-zinc-300 hover:bg-surface2"}`}
                    onClick={() => navigate(r)}
                    onMouseEnter={() => setSelected(idx)}
                  >
                    <Icon size={15} className="shrink-0 text-zinc-500" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{r.label}</span>
                      {r.detail && <span className="text-xs text-zinc-500">{r.detail}</span>}
                    </div>
                    {r.value !== undefined && (
                      <span className="text-xs font-medium text-zinc-400 shrink-0">{brl(r.value)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[10px] text-zinc-500">
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>esc fechar</span>
          </div>
        )}
      </div>
    </div>
  );
}
