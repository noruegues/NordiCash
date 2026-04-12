"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, TrendingUp, Receipt, CreditCard, LineChart, Layers, Wallet, Landmark, X, Shield,
} from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, group: "Geral" },
  { href: "/contas", label: "Contas bancárias", icon: Landmark, group: "Geral" },
  { href: "/receitas", label: "Receitas", icon: TrendingUp, group: "Movimentações" },
  { href: "/despesas", label: "Despesas", icon: Receipt, group: "Movimentações" },
  { href: "/cartoes", label: "Cartões", icon: CreditCard, group: "Movimentações" },
  { href: "/investimentos", label: "Investimentos", icon: LineChart, group: "Carteira" },
  { href: "/consorcios", label: "Consórcios", icon: Layers, group: "Carteira" },
  { href: "/patrimonio", label: "Patrimônio", icon: Wallet, group: "Carteira" },
];

export default function Sidebar({ mobileOpen = false, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const path = usePathname();
  const user = useCurrentUser();
  const grouped = items.reduce<Record<string, typeof items>>((acc, it) => {
    (acc[it.group] ||= []).push(it);
    return acc;
  }, {});

  // Fecha drawer ao navegar
  useEffect(() => { if (mobileOpen && onClose) onClose(); /* eslint-disable-next-line */ }, [path]);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}
    <aside
      className={`w-64 shrink-0 border-r border-border bg-surface min-h-screen flex flex-col z-40
        md:sticky md:top-0 md:translate-x-0
        fixed top-0 left-0 h-screen transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      {onClose && (
        <button className="md:hidden absolute top-3 right-3 btn btn-ghost btn-icon btn-sm" onClick={onClose}>
          <X size={16} />
        </button>
      )}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-border">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary to-primary2 grid place-items-center text-white font-bold shadow-glow">N</div>
        <div>
          <div className="font-semibold tracking-tight text-zinc-100">NordiCash</div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">Finance SaaS</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {Object.entries(grouped).map(([group, list]) => (
          <div key={group}>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-3 mb-2">{group}</div>
            <div className="flex flex-col gap-0.5">
              {list.map(({ href, label, icon: Icon }) => {
                const active = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-surface2"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {(user?.isAdmin || user?.isSuporte) && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 px-3 mb-2">Administração</div>
            <div className="flex flex-col gap-0.5">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  path === "/admin"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-surface2"
                }`}
              >
                <Shield size={17} />
                Painel Admin
              </Link>
            </div>
          </div>
        )}
      </nav>

      <SidebarFooter />
    </aside>
    </>
  );
}

function SidebarFooter() {
  const user = useCurrentUser();
  const plano = user?.plano ?? "Free";
  const planoW = plano === "Free" ? "w-1/4" : plano === "Pro" ? "w-2/3" : "w-full";
  return (
    <div className="p-4 border-t border-border space-y-2">
      <div className="card !shadow-none">
        <div className="card-body !p-3">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">Plano</div>
          <div className="text-sm font-medium text-zinc-100 mt-0.5">{plano}</div>
          <div className="mt-2 h-1.5 rounded-full bg-surface2 overflow-hidden">
            <div className={`h-full bg-gradient-to-r from-primary to-accent ${planoW}`} />
          </div>
        </div>
      </div>
      <div className="text-center text-[10px] text-zinc-600">NordiCash v1.2.0</div>
    </div>
  );
}
