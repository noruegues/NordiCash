"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Shield, Users, Crown, Trash2, ChevronDown, Megaphone, Plus, X,
  Info, CheckCircle2, AlertTriangle, XCircle, Eye, EyeOff, Send, Headset, KeyRound,
  Bold, Italic, Underline, List, Type, Redo,
} from "lucide-react";

type AdminUser = {
  id: string;
  login: string;
  nome: string;
  email: string | null;
  avatar: string | null;
  plano: string;
  isAdmin: boolean;
  isSuporte: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  _count: { contas: number; receitas: number; despesas: number; cartoes: number; investimentos: number; consorcios: number; bens: number };
};

type AvisoLeitor = {
  lidoEm: string;
  user: { id: string; nome: string; login: string; avatar: string | null };
};

type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  planoAlvo: string | null;
  ativo: boolean;
  criadoEm: string;
  _count: { lidos: number };
  lidos: AvisoLeitor[];
};

export default function AdminPage() {
  const currentUser = useAuth((s) => s.user);
  const [tab, setTab] = useState<"users" | "avisos">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => { if (!r.ok) throw new Error("Acesso negado"); return r.json(); }),
      fetch("/api/admin/avisos").then((r) => r.ok ? r.json() : []),
    ])
      .then(([u, a]) => { setUsers(u); setAvisos(a); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Polling: atualiza lista de usuários a cada 30s para status online
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/admin/users").then((r) => r.ok ? r.json() : null).then((u) => { if (u) setUsers(u); });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function updateUser(userId: string, data: Record<string, unknown>) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
    }
  }

  async function deleteUser(userId: string, nome: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${nome}"? Todos os dados serão perdidos.`)) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  const authLoading = useAuth((s) => s.loading);

  if (loading || authLoading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-zinc-400">Carregando...</div></div>;
  }

  if (!currentUser?.isAdmin && !currentUser?.isSuporte) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-zinc-300">Acesso Restrito</h1>
          <p className="text-sm text-zinc-500 mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-danger mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-zinc-300">Erro</h1>
          <p className="text-sm text-zinc-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const planoCount = { Free: 0, Pro: 0, Premium: 0 };
  users.forEach((u) => { if (u.plano in planoCount) planoCount[u.plano as keyof typeof planoCount]++; });
  const avisosAtivos = avisos.filter((a) => a.ativo).length;
  const onlineCount = users.filter((u) => u.lastSeenAt && (Date.now() - new Date(u.lastSeenAt).getTime()) < 2 * 60 * 1000).length;

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel Admin</h1>
          <p className="text-sm text-zinc-500">Gerencie usuários, planos e avisos</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Total Usuários</div>
          <div className="text-2xl font-bold">{totalUsers}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Plano Free</div>
          <div className="text-2xl font-bold text-zinc-400">{planoCount.Free}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Plano Pro</div>
          <div className="text-2xl font-bold text-blue-400">{planoCount.Pro}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Plano Premium</div>
          <div className="text-2xl font-bold text-amber-400">{planoCount.Premium}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1.5">Online <span className="w-2 h-2 rounded-full bg-success animate-pulse" /></div>
          <div className="text-2xl font-bold text-success">{onlineCount}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">Avisos Ativos</div>
          <div className="text-2xl font-bold text-purple-400">{avisosAtivos}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface border border-border rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${
            tab === "users" ? "bg-primary/10 text-primary" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Users size={15} /> Usuários
        </button>
        {currentUser?.isAdmin && (
          <button
            onClick={() => setTab("avisos")}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${
              tab === "avisos" ? "bg-primary/10 text-primary" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Megaphone size={15} /> Avisos
          </button>
        )}
      </div>

      {tab === "users" && (
        <UsersTable users={users} currentUser={currentUser} updateUser={updateUser} deleteUser={deleteUser} isViewerAdmin={!!currentUser?.isAdmin} />
      )}
      {tab === "avisos" && currentUser?.isAdmin && (
        <AvisosPanel avisos={avisos} setAvisos={setAvisos} totalUsers={totalUsers} planoCount={planoCount} />
      )}
    </div>
  );
}

// ===== USERS TABLE =====
type RoleFilter = "todos" | "suporte" | "admin";

function UsersTable({
  users, currentUser, updateUser, deleteUser, isViewerAdmin,
}: {
  users: AdminUser[];
  currentUser: { id: string } | null;
  updateUser: (id: string, data: Record<string, unknown>) => void;
  deleteUser: (id: string, nome: string) => void;
  isViewerAdmin: boolean;
}) {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("todos");

  const filtered = users.filter((u) => {
    if (roleFilter === "admin") return u.isAdmin;
    if (roleFilter === "suporte") return u.isSuporte;
    return true;
  });

  function isOnline(u: AdminUser) {
    return !!u.lastSeenAt && (Date.now() - new Date(u.lastSeenAt).getTime()) < 2 * 60 * 1000;
  }

  function UserAvatar({ user }: { user: AdminUser }) {
    const online = isOnline(user);
    const avatar = user.avatar ? (
      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
    ) : (
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
        {user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
      </div>
    );
    return (
      <div className="relative">
        {avatar}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${online ? "bg-success" : "bg-zinc-500"}`} style={{ borderColor: "var(--color-surface)" }} />
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-sm">Usuários ({filtered.length})</span>
        </div>
        <div className="flex rounded border border-border overflow-hidden text-xs">
          {([
            { k: "todos", l: "Todos", icon: Users },
            { k: "suporte", l: "Suporte", icon: Headset },
            { k: "admin", l: "Admin", icon: Crown },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setRoleFilter(t.k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-r border-border last:border-r-0 transition ${
                roleFilter === t.k ? "bg-primary text-white" : "text-zinc-400 hover:bg-surface2"
              }`}
            >
              <t.icon size={12} /> {t.l}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-zinc-500">
              <th className="p-3 font-medium">Usuário</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Plano</th>
              <th className="p-3 font-medium">Dados</th>
              <th className="p-3 font-medium">Criado em</th>
              <th className="p-3 font-medium">Última sessão</th>
              {isViewerAdmin && <th className="p-3 font-medium">Cargo</th>}
              <th className="p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const totalItems = u._count.contas + u._count.receitas + u._count.despesas + u._count.cartoes + u._count.investimentos + u._count.consorcios + u._count.bens;
              return (
                <tr key={u.id} className="border-b border-border/50 hover:bg-surface2/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} />
                      <div>
                        <div className="font-medium">{u.nome}</div>
                        <div className="text-xs text-zinc-500">@{u.login}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-zinc-400">{u.email || "—"}</td>
                  <td className="p-3">
                    {isViewerAdmin ? (
                      <div className="relative inline-block">
                        <select
                          value={u.plano}
                          onChange={(e) => updateUser(u.id, { plano: e.target.value })}
                          className={`appearance-none bg-transparent border rounded px-2 py-1 pr-6 text-xs font-medium cursor-pointer ${
                            u.plano === "Premium" ? "border-amber-500/30 text-amber-400" :
                            u.plano === "Pro" ? "border-blue-500/30 text-blue-400" :
                            "border-zinc-600 text-zinc-400"
                          }`}
                        >
                          <option value="Free">Free</option>
                          <option value="Pro">Pro</option>
                          <option value="Premium">Premium</option>
                        </select>
                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                      </div>
                    ) : (
                      <span className={`text-xs font-medium ${
                        u.plano === "Premium" ? "text-amber-400" :
                        u.plano === "Pro" ? "text-blue-400" :
                        "text-zinc-400"
                      }`}>{u.plano}</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-zinc-500">{totalItems} registros</td>
                  <td className="p-3 text-xs text-zinc-500">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-xs">
                    {isOnline(u) ? (
                      <span className="text-success font-medium">Online agora</span>
                    ) : u.lastSeenAt ? (
                      <span className="text-zinc-500">{new Date(u.lastSeenAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    ) : (
                      <span className="text-zinc-600">Nunca acessou</span>
                    )}
                  </td>
                  {isViewerAdmin && (
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (u.id === currentUser?.id && u.isAdmin) { alert("Você não pode remover seu próprio admin."); return; }
                            updateUser(u.id, { isAdmin: !u.isAdmin });
                          }}
                          className={`p-1.5 rounded transition ${u.isAdmin ? "bg-primary/10 text-primary" : "bg-surface2 text-zinc-600 hover:text-primary"}`}
                          title={u.isAdmin ? "Remover admin" : "Tornar admin"}
                        >
                          <Crown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updateUser(u.id, { isSuporte: !u.isSuporte })}
                          className={`p-1.5 rounded transition ${u.isSuporte ? "bg-green-500/10 text-green-400" : "bg-surface2 text-zinc-600 hover:text-green-400"}`}
                          title={u.isSuporte ? "Remover suporte" : "Tornar suporte"}
                        >
                          <Headset className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {!isViewerAdmin && (
                        <button
                          className="p-1.5 rounded bg-surface2 text-zinc-500 hover:text-primary hover:bg-primary/10 transition"
                          title="Enviar email de redefinição de senha"
                          onClick={() => alert("Funcionalidade de email será configurada em breve.")}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isViewerAdmin && u.id !== currentUser?.id && (
                        <>
                          <button
                            className="p-1.5 rounded bg-surface2 text-zinc-500 hover:text-primary hover:bg-primary/10 transition"
                            title="Enviar email de redefinição de senha"
                            onClick={() => alert("Funcionalidade de email será configurada em breve.")}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.nome)}
                            className="p-1.5 rounded bg-surface2 text-zinc-500 hover:text-danger hover:bg-danger/10 transition"
                            title="Excluir usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== AVISOS PANEL =====
const tipoOptions = [
  { value: "info", label: "Informação", icon: Info, color: "text-blue-400" },
  { value: "success", label: "Novidade", icon: CheckCircle2, color: "text-emerald-400" },
  { value: "warning", label: "Atenção", icon: AlertTriangle, color: "text-amber-400" },
  { value: "danger", label: "Urgente", icon: XCircle, color: "text-red-400" },
];

const iconMap: Record<string, React.ReactNode> = {
  info: <Info size={22} />, success: <CheckCircle2 size={22} />, warning: <AlertTriangle size={22} />, danger: <XCircle size={22} />,
};
const colorMap: Record<string, { bg: string; border: string; icon: string; accent: string }> = {
  info: { bg: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20", icon: "text-blue-400", accent: "bg-blue-500" },
  success: { bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20", icon: "text-emerald-400", accent: "bg-emerald-500" },
  warning: { bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20", icon: "text-amber-400", accent: "bg-amber-500" },
  danger: { bg: "from-red-500/10 to-red-600/5", border: "border-red-500/20", icon: "text-red-400", accent: "bg-red-500" },
};

function AvisosPanel({
  avisos, setAvisos, totalUsers, planoCount,
}: {
  avisos: Aviso[];
  setAvisos: React.Dispatch<React.SetStateAction<Aviso[]>>;
  totalUsers: number;
  planoCount: Record<string, number>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [expandedAviso, setExpandedAviso] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("info");
  const [planoAlvo, setPlanoAlvo] = useState<string>("todos");
  const [sending, setSending] = useState(false);

  function getEditorContent() {
    return editorRef.current?.innerHTML || "";
  }

  async function criarAviso() {
    const content = getEditorContent();
    if (!titulo || !content) return;
    setSending(true);
    const res = await fetch("/api/admin/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, mensagem: content, tipo, planoAlvo: planoAlvo === "todos" ? null : planoAlvo }),
    });
    if (res.ok) {
      const aviso = await res.json();
      setAvisos((prev) => [aviso, ...prev]);
      setTitulo("");
      setMensagem("");
      setTipo("info");
      setPlanoAlvo("todos");
      setShowForm(false);
      setShowPreview(false);
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
    setSending(false);
  }

  function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const res = await fetch("/api/admin/avisos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ativo }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAvisos((prev) => prev.map((a) => (a.id === id ? updated : a)));
    }
  }

  async function deletarAviso(id: string) {
    if (!confirm("Excluir este aviso permanentemente?")) return;
    const res = await fetch("/api/admin/avisos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setAvisos((prev) => prev.filter((a) => a.id !== id));
  }

  function getAlcance() {
    if (planoAlvo === "todos") return totalUsers;
    return planoCount[planoAlvo] || 0;
  }

  return (
    <div className="space-y-4">
      {/* Criar aviso */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          <Plus size={15} /> Criar novo aviso
        </button>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Megaphone size={15} className="text-primary" /> Novo Aviso
              </h3>
              <button onClick={() => { setShowForm(false); setShowPreview(false); }} className="text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </div>

            {/* Tipo do aviso */}
            <div className="flex gap-2">
              {tipoOptions.map((t) => {
                const sel = tipo === t.value;
                const colorBg = t.value === "info" ? "bg-blue-500/10" : t.value === "success" ? "bg-emerald-500/10" : t.value === "warning" ? "bg-amber-500/10" : "bg-red-500/10";
                return (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                      sel ? `${colorBg} ${t.color}` : "text-zinc-500 hover:text-zinc-300 bg-surface2/50"
                    }`}
                  >
                    <t.icon size={12} /> {t.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Título</label>
                <input
                  className="input"
                  placeholder="Ex: Nova funcionalidade disponível!"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Público alvo</label>
                <select
                  className="select"
                  value={planoAlvo}
                  onChange={(e) => setPlanoAlvo(e.target.value)}
                >
                  <option value="todos">Todos os usuários</option>
                  <option value="Free">Apenas Free</option>
                  <option value="Pro">Apenas Pro</option>
                  <option value="Premium">Apenas Premium</option>
                </select>
                <div className="mt-1 text-[10px] text-zinc-500">
                  Alcance: <span className="text-primary font-semibold">{getAlcance()} usuário(s)</span>
                </div>
              </div>
            </div>

            {/* Editor de texto rico */}
            <div>
              <label className="label">Mensagem</label>
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-surface2/30 flex-wrap">
                  <button type="button" className="p-1.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition" onClick={() => execCmd("bold")} title="Negrito">
                    <Bold size={14} />
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition" onClick={() => execCmd("italic")} title="Itálico">
                    <Italic size={14} />
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition" onClick={() => execCmd("underline")} title="Sublinhado">
                    <Underline size={14} />
                  </button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <button type="button" className="p-1.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition" onClick={() => execCmd("insertUnorderedList")} title="Lista">
                    <List size={14} />
                  </button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <select
                    className="bg-transparent text-xs text-zinc-400 border-none outline-none cursor-pointer hover:text-zinc-100"
                    onChange={(e) => { execCmd("fontSize", e.target.value); e.target.value = ""; }}
                    defaultValue=""
                  >
                    <option value="" disabled>Tamanho</option>
                    <option value="1">Pequeno</option>
                    <option value="3">Normal</option>
                    <option value="5">Grande</option>
                    <option value="7">Título</option>
                  </select>
                  <div className="w-px h-5 bg-border mx-1" />
                  <button type="button" className="p-1.5 rounded hover:bg-surface2 text-zinc-400 hover:text-zinc-100 transition" onClick={() => execCmd("removeFormat")} title="Limpar formatação">
                    <Redo size={14} />
                  </button>
                </div>
                {/* Editable area */}
                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-[120px] p-3 text-sm text-zinc-200 outline-none [&_b]:font-bold [&_i]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5"
                  onInput={() => setMensagem(editorRef.current?.innerHTML || "")}
                  suppressContentEditableWarning
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="btn btn-ghost" onClick={() => { setShowForm(false); setShowPreview(false); }}>Cancelar</button>
              <button
                className="btn btn-soft"
                disabled={!titulo || !getEditorContent()}
                onClick={() => { setMensagem(getEditorContent()); setShowPreview(true); }}
              >
                <Eye size={14} /> Testar
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={!titulo || !getEditorContent() || sending}
                onClick={criarAviso}
              >
                <Send size={14} /> {sending ? "Enviando..." : "Publicar aviso"}
              </button>
            </div>
          </div>
        </div>

      )}

      {/* Preview do aviso */}
      {showPreview && (() => {
        const colors = colorMap[tipo] || colorMap.info;
        return (
          <div className="modal-backdrop">
            <div className={`modal-panel max-w-lg border ${colors.border} overflow-hidden`}>
              <div className={`h-1 ${colors.accent}`} />
              <div className={`bg-gradient-to-b ${colors.bg} p-6`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-black/20 grid place-items-center ${colors.icon}`}>
                      {iconMap[tipo] || iconMap.info}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-100">{titulo || "Sem título"}</h2>
                      <span className="text-[10px] text-zinc-500">Prévia — não publicado</span>
                    </div>
                  </div>
                  <div className="w-5" />
                </div>
                <div className="text-sm text-zinc-300 leading-relaxed [&_b]:font-bold [&_i]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: mensagem }} />
                <div className="mt-6 flex justify-end">
                  <button className="btn btn-primary btn-sm" onClick={() => setShowPreview(false)}>
                    Fechar prévia
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lista de avisos */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-sm">Avisos publicados ({avisos.length})</span>
        </div>
        {avisos.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Nenhum aviso publicado ainda. Crie o primeiro!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {avisos.map((a) => {
              const tipoInfo = tipoOptions.find((t) => t.value === a.tipo) || tipoOptions[0];
              const TipoIcon = tipoInfo.icon;
              return (
                <div key={a.id} className={`p-4 flex items-start gap-3 ${!a.ativo ? "opacity-50" : ""}`}>
                  <div className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${tipoInfo.color} bg-black/20`}>
                    <TipoIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-zinc-100">{a.titulo}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        a.planoAlvo
                          ? a.planoAlvo === "Premium" ? "border-amber-500/30 text-amber-400"
                          : a.planoAlvo === "Pro" ? "border-blue-500/30 text-blue-400"
                          : "border-zinc-600 text-zinc-400"
                          : "border-purple-500/30 text-purple-400"
                      }`}>
                        {a.planoAlvo || "Todos"}
                      </span>
                      {!a.ativo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-600 text-zinc-500">Inativo</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{a.mensagem}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                      <span>{new Date(a.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      <button
                        className="flex items-center gap-1 hover:text-zinc-300 transition"
                        onClick={() => setExpandedAviso(expandedAviso === a.id ? null : a.id)}
                      >
                        <Eye size={10} /> {a._count.lidos} lido(s)
                        <ChevronDown size={10} className={`transition-transform ${expandedAviso === a.id ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    {/* Lista de quem visualizou */}
                    {expandedAviso === a.id && (
                      <div className="mt-3 border-t border-border pt-3 space-y-2">
                        {!a.lidos || a.lidos.length === 0 ? (
                          <p className="text-xs text-zinc-500">Ninguém visualizou ainda.</p>
                        ) : (
                          a.lidos.map((l) => (
                            <div key={l.user.id} className="flex items-center gap-2 text-xs">
                              {l.user.avatar ? (
                                <img src={l.user.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">
                                  {l.user.nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                                </div>
                              )}
                              <span className="text-zinc-300">{l.user.nome}</span>
                              <span className="text-zinc-600">@{l.user.login}</span>
                              <span className="text-zinc-600 ml-auto">{new Date(l.lidoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleAtivo(a.id, !a.ativo)}
                      className={`p-1.5 rounded ${a.ativo ? "bg-success/10 text-success" : "bg-surface2 text-zinc-600"}`}
                      title={a.ativo ? "Desativar" : "Ativar"}
                    >
                      {a.ativo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => deletarAviso(a.id)}
                      className="p-1.5 rounded bg-surface2 text-zinc-500 hover:text-danger hover:bg-danger/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
