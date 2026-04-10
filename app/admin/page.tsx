"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Shield, Users, Crown, Trash2, ChevronDown, Megaphone, Plus, X,
  Info, CheckCircle2, AlertTriangle, XCircle, Eye, EyeOff, Send,
} from "lucide-react";

type AdminUser = {
  id: string;
  login: string;
  nome: string;
  email: string | null;
  plano: string;
  isAdmin: boolean;
  createdAt: string;
  _count: { contas: number; receitas: number; despesas: number; cartoes: number; investimentos: number; consorcios: number; bens: number };
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

  if (!currentUser?.isAdmin) {
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

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="text-zinc-400">Carregando...</div></div>;
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
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
        <button
          onClick={() => setTab("avisos")}
          className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${
            tab === "avisos" ? "bg-primary/10 text-primary" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Megaphone size={15} /> Avisos
        </button>
      </div>

      {tab === "users" && (
        <UsersTable users={users} currentUser={currentUser} updateUser={updateUser} deleteUser={deleteUser} />
      )}
      {tab === "avisos" && (
        <AvisosPanel avisos={avisos} setAvisos={setAvisos} totalUsers={totalUsers} planoCount={planoCount} />
      )}
    </div>
  );
}

// ===== USERS TABLE =====
function UsersTable({
  users, currentUser, updateUser, deleteUser,
}: {
  users: AdminUser[];
  currentUser: { id: string } | null;
  updateUser: (id: string, data: Record<string, unknown>) => void;
  deleteUser: (id: string, nome: string) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Users className="w-4 h-4 text-zinc-400" />
        <span className="font-semibold text-sm">Usuários ({users.length})</span>
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
              <th className="p-3 font-medium">Admin</th>
              <th className="p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const totalItems = u._count.contas + u._count.receitas + u._count.despesas + u._count.cartoes + u._count.investimentos + u._count.consorcios + u._count.bens;
              return (
                <tr key={u.id} className="border-b border-border/50 hover:bg-surface2/50">
                  <td className="p-3">
                    <div className="font-medium">{u.nome}</div>
                    <div className="text-xs text-zinc-500">@{u.login}</div>
                  </td>
                  <td className="p-3 text-zinc-400">{u.email || "—"}</td>
                  <td className="p-3">
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
                  </td>
                  <td className="p-3 text-xs text-zinc-500">{totalItems} registros</td>
                  <td className="p-3 text-xs text-zinc-500">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3">
                    <button
                      onClick={() => updateUser(u.id, { isAdmin: !u.isAdmin })}
                      className={`p-1.5 rounded ${u.isAdmin ? "bg-primary/10 text-primary" : "bg-surface2 text-zinc-600"}`}
                      title={u.isAdmin ? "Remover admin" : "Tornar admin"}
                    >
                      <Crown className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="p-3">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => deleteUser(u.id, u.nome)}
                        className="p-1.5 rounded bg-surface2 text-zinc-500 hover:text-danger hover:bg-danger/10"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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

function AvisosPanel({
  avisos, setAvisos, totalUsers, planoCount,
}: {
  avisos: Aviso[];
  setAvisos: React.Dispatch<React.SetStateAction<Aviso[]>>;
  totalUsers: number;
  planoCount: Record<string, number>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("info");
  const [planoAlvo, setPlanoAlvo] = useState<string>("todos");
  const [sending, setSending] = useState(false);

  async function criarAviso() {
    if (!titulo || !mensagem) return;
    setSending(true);
    const res = await fetch("/api/admin/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, mensagem, tipo, planoAlvo: planoAlvo === "todos" ? null : planoAlvo }),
    });
    if (res.ok) {
      const aviso = await res.json();
      setAvisos((prev) => [aviso, ...prev]);
      setTitulo("");
      setMensagem("");
      setTipo("info");
      setPlanoAlvo("todos");
      setShowForm(false);
    }
    setSending(false);
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
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Megaphone size={15} className="text-primary" /> Novo Aviso
            </h3>
            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-300">
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="label">Título</label>
            <input
              className="input"
              placeholder="Ex: Nova funcionalidade disponível!"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Mensagem</label>
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder="Descreva o aviso em detalhes..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {tipoOptions.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded border text-xs font-medium transition ${
                      tipo === t.value
                        ? `border-primary bg-primary/10 ${t.color}`
                        : "border-border text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Público alvo</label>
              <div className="space-y-2">
                {[
                  { value: "todos", label: "Todos os usuários" },
                  { value: "Free", label: "Apenas Free" },
                  { value: "Pro", label: "Apenas Pro" },
                  { value: "Premium", label: "Apenas Premium" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded border text-xs cursor-pointer transition ${
                      planoAlvo === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="planoAlvo"
                      value={opt.value}
                      checked={planoAlvo === opt.value}
                      onChange={(e) => setPlanoAlvo(e.target.value)}
                      className="hidden"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-zinc-500">
                Alcance estimado: <span className="text-primary font-semibold">{getAlcance()} usuário(s)</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button className="btn btn-ghost flex-1" onClick={() => setShowForm(false)}>Cancelar</button>
            <button
              className="btn btn-primary flex-1"
              disabled={!titulo || !mensagem || sending}
              onClick={criarAviso}
            >
              <Send size={14} /> {sending ? "Enviando..." : "Publicar aviso"}
            </button>
          </div>
        </div>
      )}

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
                      <span className="flex items-center gap-1"><Eye size={10} /> {a._count.lidos} lido(s)</span>
                    </div>
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
