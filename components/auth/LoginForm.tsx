"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ArrowLeft } from "lucide-react";

export default function LoginForm({ onSwitch, onBack }: { onSwitch: () => void; onBack: () => void }) {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <button className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 mb-6" onClick={onBack}>
        <ArrowLeft size={14} /> Voltar
      </button>
      <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
      <p className="text-sm text-zinc-400 mt-1">Entre na sua conta para continuar</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          setLoading(true);
          const r = await login(usuario, senha);
          setLoading(false);
          if (!r.ok) setErr(r.error ?? "Erro");
        }}
      >
        <div>
          <label className="label">Usuário</label>
          <input className="input" autoFocus value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="seu usuário" />
        </div>
        <div>
          <label className="label">Senha</label>
          <input type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••" />
        </div>
        {err && <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">{err}</div>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-400">
        Não tem conta?{" "}
        <button onClick={onSwitch} className="text-primary hover:underline font-medium">Criar agora</button>
      </div>
    </div>
  );
}
