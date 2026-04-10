"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { ArrowLeft, ArrowRight, Plus, Trash2 } from "lucide-react";

type Step = "conta" | "contas-bancarias" | "cartoes" | "fim";

export default function SignupForm({ onSwitch, onBack }: { onSwitch: () => void; onBack: () => void }) {
  const { signup } = useAuth();
  const { addConta, addCartao } = useStore();

  const [step, setStep] = useState<Step>("conta");
  const [err, setErr] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [contas, setContas] = useState<{ nome: string; banco: string; saldo: number; cor: string }[]>([]);
  const [cartoes, setCartoes] = useState<{ nome: string; banco: string; limite: number; dia: number; cor: string }[]>([]);

  function handleSignup() {
    setErr("");
    if (!nome || !usuario || !senha) {
      setErr("Preencha todos os campos");
      return;
    }
    if (senha.length < 4) {
      setErr("Senha muito curta (mín. 4 caracteres)");
      return;
    }
    const r = signup({ nome, email, login: usuario, senha, plano: "Free" });
    if (!r.ok) {
      setErr(r.error ?? "Erro");
      return;
    }
    setStep("contas-bancarias");
  }

  function finalizar() {
    contas.forEach((c) =>
      addConta({ nome: c.nome, banco: c.banco, tipo: "Corrente", saldoInicial: c.saldo, cor: c.cor })
    );
    cartoes.forEach((c) =>
      addCartao({ nome: c.nome, banco: c.banco, bandeira: "Mastercard", limite: c.limite, diaVencimento: c.dia, cor: c.cor })
    );
    setStep("fim");
    setTimeout(() => location.reload(), 600);
  }

  return (
    <div className="w-full max-w-md">
      <button className="text-sm text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1 mb-6" onClick={onBack}>
        <ArrowLeft size={14} /> Voltar
      </button>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {(["conta", "contas-bancarias", "cartoes"] as Step[]).map((s, i) => {
          const order = ["conta", "contas-bancarias", "cartoes"];
          const cur = order.indexOf(step);
          const idx = order.indexOf(s);
          const done = cur > idx;
          const active = cur === idx;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold ${
                done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-surface2 text-zinc-500"
              }`}>{i + 1}</div>
              {i < 2 && <div className={`flex-1 h-0.5 ${done ? "bg-success" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      {step === "conta" && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
          <p className="text-sm text-zinc-400 mt-1">Vamos começar pelo básico</p>
          <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSignup(); }}>
            <div>
              <label className="label">Nome completo</label>
              <input className="input" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Usuário (login)</label>
              <input className="input" required value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            </div>
            <div>
              <label className="label">Senha</label>
              <input type="password" className="input" required value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            {err && <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded p-2">{err}</div>}
            <button type="submit" className="btn btn-primary w-full">Continuar <ArrowRight size={14} /></button>
          </form>
        </>
      )}

      {step === "contas-bancarias" && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Suas contas bancárias</h1>
          <p className="text-sm text-zinc-400 mt-1">Adicione onde você guarda seu dinheiro (você pode pular)</p>
          <div className="mt-6 space-y-3">
            {contas.map((c, i) => (
              <div key={i} className="border border-border rounded p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded grid place-items-center text-white font-bold" style={{ background: c.cor }}>{c.banco[0] || "?"}</div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{c.nome}</div>
                  <div className="text-xs text-zinc-500">{c.banco} · R$ {c.saldo.toLocaleString("pt-BR")}</div>
                </div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setContas(contas.filter((_, j) => j !== i))}><Trash2 size={13} /></button>
              </div>
            ))}
            <ContaInline onAdd={(c) => setContas([...contas, c])} />
          </div>
          <div className="flex gap-2 mt-6">
            <button className="btn btn-ghost flex-1" onClick={() => setStep("cartoes")}>Pular</button>
            <button className="btn btn-primary flex-1" onClick={() => setStep("cartoes")}>Continuar <ArrowRight size={14} /></button>
          </div>
        </>
      )}

      {step === "cartoes" && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Seus cartões de crédito</h1>
          <p className="text-sm text-zinc-400 mt-1">Adicione seus cartões para controlar o limite</p>
          <div className="mt-6 space-y-3">
            {cartoes.map((c, i) => (
              <div key={i} className="border border-border rounded p-3 flex items-center gap-3">
                <div className="w-10 h-7 rounded" style={{ background: `linear-gradient(135deg, ${c.cor}, #000)` }} />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{c.nome}</div>
                  <div className="text-xs text-zinc-500">{c.banco} · R$ {c.limite.toLocaleString("pt-BR")} · venc. dia {c.dia}</div>
                </div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCartoes(cartoes.filter((_, j) => j !== i))}><Trash2 size={13} /></button>
              </div>
            ))}
            <CartaoInline onAdd={(c) => setCartoes([...cartoes, c])} />
          </div>
          <div className="flex gap-2 mt-6">
            <button className="btn btn-ghost flex-1" onClick={finalizar}>Pular</button>
            <button className="btn btn-primary flex-1" onClick={finalizar}>Finalizar</button>
          </div>
        </>
      )}

      {step === "fim" && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success grid place-items-center mx-auto mb-4 text-3xl">✓</div>
          <h2 className="text-xl font-semibold">Tudo pronto!</h2>
          <p className="text-sm text-zinc-400 mt-2">Carregando seu painel...</p>
        </div>
      )}

      {step === "conta" && (
        <div className="mt-6 text-center text-sm text-zinc-400">
          Já tem conta?{" "}
          <button onClick={onSwitch} className="text-primary hover:underline font-medium">Entrar</button>
        </div>
      )}
    </div>
  );
}

function ContaInline({ onAdd }: { onAdd: (c: { nome: string; banco: string; saldo: number; cor: string }) => void }) {
  const [show, setShow] = useState(false);
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [saldo, setSaldo] = useState(0);
  const [cor, setCor] = useState("#3B82F6");
  if (!show) {
    return <button className="btn btn-ghost w-full" onClick={() => setShow(true)}><Plus size={14} /> Adicionar conta</button>;
  }
  return (
    <div className="border border-border rounded p-3 space-y-2">
      <input className="input" placeholder="Apelido (ex: Conta Principal)" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="input" placeholder="Banco" value={banco} onChange={(e) => setBanco(e.target.value)} />
      <input type="number" className="input" placeholder="Saldo inicial" value={saldo || ""} onChange={(e) => setSaldo(parseFloat(e.target.value) || 0)} />
      <input type="color" className="input !p-1 h-9" value={cor} onChange={(e) => setCor(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn btn-ghost btn-sm flex-1" onClick={() => setShow(false)}>Cancelar</button>
        <button className="btn btn-primary btn-sm flex-1" onClick={() => { if (nome && banco) { onAdd({ nome, banco, saldo, cor }); setShow(false); setNome(""); setBanco(""); setSaldo(0); } }}>Adicionar</button>
      </div>
    </div>
  );
}

function CartaoInline({ onAdd }: { onAdd: (c: { nome: string; banco: string; limite: number; dia: number; cor: string }) => void }) {
  const [show, setShow] = useState(false);
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [limite, setLimite] = useState(0);
  const [dia, setDia] = useState(10);
  const [cor, setCor] = useState("#0F0F0F");
  if (!show) {
    return <button className="btn btn-ghost w-full" onClick={() => setShow(true)}><Plus size={14} /> Adicionar cartão</button>;
  }
  return (
    <div className="border border-border rounded p-3 space-y-2">
      <input className="input" placeholder="Apelido" value={nome} onChange={(e) => setNome(e.target.value)} />
      <input className="input" placeholder="Banco" value={banco} onChange={(e) => setBanco(e.target.value)} />
      <input type="number" className="input" placeholder="Limite" value={limite || ""} onChange={(e) => setLimite(parseFloat(e.target.value) || 0)} />
      <input type="number" min={1} max={31} className="input" placeholder="Dia de vencimento" value={dia} onChange={(e) => setDia(parseInt(e.target.value) || 1)} />
      <input type="color" className="input !p-1 h-9" value={cor} onChange={(e) => setCor(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn btn-ghost btn-sm flex-1" onClick={() => setShow(false)}>Cancelar</button>
        <button className="btn btn-primary btn-sm flex-1" onClick={() => { if (nome && banco) { onAdd({ nome, banco, limite, dia, cor }); setShow(false); setNome(""); setBanco(""); setLimite(0); setDia(10); } }}>Adicionar</button>
      </div>
    </div>
  );
}
