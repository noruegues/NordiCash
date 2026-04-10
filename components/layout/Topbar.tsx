"use client";
import { Search, Bell, Sun, Moon, AlertTriangle, CheckCircle2, CreditCard, X, LogOut, User as UserIcon, Lock, Crown, Camera, Menu } from "lucide-react";
import { useStore, usoCartao } from "@/lib/store";
import { useAuth, useCurrentUser, type Plano } from "@/lib/auth";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { brl } from "@/lib/format";
import SearchModal from "@/components/SearchModal";

export default function Topbar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { cartoes, despesas, marcarFaturaPaga } = useStore();
  const { theme, toggleTheme, logout } = useAuth();
  const user = useCurrentUser();

  const [openNotif, setOpenNotif] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [profileTab, setProfileTab] = useState<"menu" | "perfil" | "senha" | "plano">("menu");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K global shortcut
  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpenSearch(true);
    }
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  const today = new Date();
  const mesAtual = today.toISOString().slice(0, 7);

  const alertas = useMemo(() => {
    const list: { id: string; type: "danger" | "warn"; title: string; desc: string; cartaoId?: string }[] = [];
    for (const c of cartoes) {
      const usado = usoCartao(c.id, despesas, c.faturaPagaMes);
      const pct = c.limite > 0 ? (usado / c.limite) * 100 : 0;
      const overdue = c.faturaPagaMes !== mesAtual && today.getDate() > c.diaVencimento;
      if (overdue && usado > 0) {
        list.push({ id: `over-${c.id}`, type: "danger", title: `Fatura em atraso · ${c.nome}`, desc: `Vencimento dia ${c.diaVencimento} · ${brl(usado)}`, cartaoId: c.id });
      } else if (pct >= 90) {
        list.push({ id: `lim-${c.id}`, type: "warn", title: `Limite quase no fim · ${c.nome}`, desc: `${pct.toFixed(0)}% utilizado · ${brl(usado)}/${brl(c.limite)}`, cartaoId: c.id });
      }
    }
    return list;
  }, [cartoes, despesas, mesAtual]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpenNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenProfile(false);
        setProfileTab("menu");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;
  const initials = user.nome.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
    <header className="h-16 border-b border-border bg-surface relative z-20 px-3 sm:px-6 flex items-center gap-2 sm:gap-4">
      {onOpenSidebar && (
        <button className="btn btn-ghost btn-icon md:hidden" onClick={onOpenSidebar} title="Menu">
          <Menu size={18} />
        </button>
      )}
      <button
        className="hidden sm:flex items-center gap-2 flex-1 max-w-md bg-surface2 border border-border rounded h-9 px-3 cursor-pointer hover:border-zinc-500 transition-colors"
        onClick={() => setOpenSearch(true)}
      >
        <Search size={15} className="text-zinc-500" />
        <span className="flex-1 text-left text-sm text-zinc-500">Buscar transações, ativos...</span>
        <kbd className="text-[10px] text-zinc-500 border border-border rounded px-1.5 py-0.5">⌘K</kbd>
      </button>

      <div className="flex-1" />

      {/* THEME TOGGLE */}
      <button className="btn btn-ghost btn-icon" title={theme === "dark" ? "Tema claro" : "Tema escuro"} onClick={toggleTheme}>
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* NOTIFICATIONS */}
      <div className="relative" ref={notifRef}>
        <button className="relative btn btn-ghost btn-icon" title="Notificações" onClick={() => setOpenNotif((v) => !v)}>
          <Bell size={16} />
          {alertas.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] leading-none flex items-center justify-center font-bold animate-pulse">
              {alertas.length}
            </span>
          )}
        </button>
        {openNotif && (
          <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-3 w-[calc(100vw-1rem)] sm:w-96 max-w-md card shadow-soft z-50">
            <div className="card-header">
              <h3 className="card-title">Notificações</h3>
              <button onClick={() => setOpenNotif(false)} className="text-zinc-400 hover:text-zinc-100"><X size={16} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {alertas.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">
                  <CheckCircle2 className="mx-auto mb-2 text-success" size={24} />
                  Tudo em dia! Nenhuma notificação.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {alertas.map((a) => (
                    <li key={a.id} className="p-4 hover:bg-surface2/50 transition">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded grid place-items-center shrink-0 ${a.type === "danger" ? "bg-danger/10 text-danger" : "bg-warn/10 text-warn"}`}>
                          {a.type === "danger" ? <AlertTriangle size={16} /> : <CreditCard size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-100">{a.title}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{a.desc}</div>
                          <div className="mt-2 flex gap-2">
                            <Link href="/cartoes" className="btn btn-soft btn-sm" onClick={() => setOpenNotif(false)}>Ver cartão</Link>
                            {a.type === "danger" && a.cartaoId && (
                              <button className="btn btn-success btn-sm" onClick={() => marcarFaturaPaga(a.cartaoId!, mesAtual)}>Marcar paga</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PROFILE */}
      <div className="relative" ref={profileRef}>
        <button
          className="flex items-center gap-3 pl-4 border-l border-border h-9 hover:opacity-80 transition"
          onClick={() => { setOpenProfile((v) => !v); setProfileTab("menu"); }}
        >
          <Avatar user={user} initials={initials} size={36} />
          <div className="text-sm text-left hidden md:block">
            <div className="font-medium text-zinc-100 leading-tight">{user.nome}</div>
            <div className="text-xs text-zinc-500">{user.plano}</div>
          </div>
        </button>

        {openProfile && (
          <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full sm:mt-3 w-[calc(100vw-1rem)] sm:w-80 max-w-sm card shadow-soft z-50 max-h-[80vh] overflow-y-auto">
            {profileTab === "menu" && (
              <>
                <div className="card-body !pb-3 flex items-center gap-3 border-b border-border">
                  <Avatar user={user} initials={initials} size={48} />
                  <div className="min-w-0">
                    <div className="font-semibold text-zinc-100 truncate">{user.nome}</div>
                    <div className="text-xs text-zinc-500 truncate">{user.email || "@" + user.login}</div>
                    <div className="mt-1 inline-flex items-center gap-1 pill pill-info"><Crown size={11} /> {user.plano}</div>
                  </div>
                </div>
                <div className="p-2">
                  <MenuItem icon={<UserIcon size={15} />} label="Editar perfil" onClick={() => setProfileTab("perfil")} />
                  <MenuItem icon={<Lock size={15} />} label="Trocar login & senha" onClick={() => setProfileTab("senha")} />
                  <MenuItem icon={<Crown size={15} />} label="Plano & assinatura" onClick={() => setProfileTab("plano")} />
                  <div className="border-t border-border my-1" />
                  <MenuItem icon={<LogOut size={15} />} label="Sair" danger onClick={() => { logout(); setOpenProfile(false); }} />
                </div>
              </>
            )}
            {profileTab === "perfil" && <PerfilPanel onBack={() => setProfileTab("menu")} />}
            {profileTab === "senha" && <SenhaPanel onBack={() => setProfileTab("menu")} />}
            {profileTab === "plano" && <PlanoPanel onBack={() => setProfileTab("menu")} />}
          </div>
        )}
      </div>
    </header>
    <SearchModal open={openSearch} onClose={() => setOpenSearch(false)} />
    </>
  );
}

function Avatar({ user, initials, size }: { user: { avatar?: string }; initials: string; size: number }) {
  if (user.avatar) {
    return <img src={user.avatar} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-primary to-primary2 grid place-items-center text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition ${
        danger ? "text-danger hover:bg-danger/10" : "text-zinc-300 hover:bg-surface2 hover:text-zinc-100"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function PerfilPanel({ onBack }: { onBack: () => void }) {
  const user = useCurrentUser()!;
  const { updateProfile } = useAuth();
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="card-body">
      <PanelHeader title="Editar perfil" onBack={onBack} />
      <div className="flex flex-col items-center gap-3 mb-4">
        <Avatar user={user} initials={user.nome.slice(0, 2).toUpperCase()} size={72} />
        <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
          <Camera size={13} /> {user.avatar ? "Trocar foto" : "Adicionar foto"}
        </button>
        {user.avatar && (
          <button className="text-xs text-danger hover:underline" onClick={() => updateProfile({ avatar: undefined })}>Remover foto</button>
        )}
        <input type="file" accept="image/*" hidden ref={fileRef} onChange={onPick} />
      </div>
      <div className="space-y-3">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full" onClick={() => { updateProfile({ nome, email }); onBack(); }}>Salvar</button>
      </div>
    </div>
  );
}

function SenhaPanel({ onBack }: { onBack: () => void }) {
  const user = useCurrentUser()!;
  const { changePassword } = useAuth();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  return (
    <div className="card-body">
      <PanelHeader title="Alterar senha" onBack={onBack} />
      <div className="space-y-3">
        <div>
          <label className="label">Senha atual</label>
          <input type="password" className="input" value={atual} onChange={(e) => setAtual(e.target.value)} />
        </div>
        <div>
          <label className="label">Nova senha</label>
          <input type="password" className="input" value={nova} onChange={(e) => setNova(e.target.value)} />
        </div>
        <button className="btn btn-primary w-full" onClick={async () => {
          const r = await changePassword(atual, nova);
          if (r.ok) { setMsg({ type: "ok", text: "Senha alterada" }); setAtual(""); setNova(""); }
          else setMsg({ type: "err", text: r.error! });
        }}>Alterar senha</button>
        {msg && (
          <div className={`text-xs rounded p-2 ${msg.type === "ok" ? "bg-success/10 text-success border border-success/20" : "bg-danger/10 text-danger border border-danger/20"}`}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanoPanel({ onBack }: { onBack: () => void }) {
  const user = useCurrentUser()!;
  const { setPlano } = useAuth();

  const planos: { key: Plano; price: string; features: string[]; popular?: boolean }[] = [
    { key: "Free", price: "R$ 0", features: ["1 conta", "2 cartões", "Funcionalidades básicas"] },
    { key: "Pro", price: "R$ 19", features: ["Contas ilimitadas", "Cartões ilimitadas", "Investimentos & projeções"], popular: true },
    { key: "Premium", price: "R$ 39", features: ["Tudo do Pro", "Consórcios e patrimônio", "Suporte prioritário"] },
  ];

  return (
    <div className="card-body">
      <PanelHeader title="Plano & assinatura" onBack={onBack} />
      <div className="text-xs text-zinc-500 mb-3">Plano atual: <span className="text-primary font-medium">{user.plano}</span></div>
      <div className="space-y-2">
        {planos.map((p) => {
          const atual = p.key === user.plano;
          return (
            <div key={p.key} className={`border rounded p-3 ${atual ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-100">{p.key}</span>
                  {p.popular && <span className="pill pill-info">Popular</span>}
                  {atual && <span className="pill pill-success">Atual</span>}
                </div>
                <div className="text-sm font-semibold">{p.price}<span className="text-xs text-zinc-500">/mês</span></div>
              </div>
              <ul className="text-xs text-zinc-500 space-y-0.5 mb-2">
                {p.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
              {!atual && (
                <button className="btn btn-soft btn-sm w-full" onClick={() => setPlano(p.key)}>
                  {planos.findIndex((x) => x.key === p.key) > planos.findIndex((x) => x.key === user.plano) ? "Fazer upgrade" : "Fazer downgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button onClick={onBack} className="text-xs text-zinc-500 hover:text-zinc-300">← Voltar</button>
      <div className="text-sm font-semibold">{title}</div>
      <div className="w-8" />
    </div>
  );
}
