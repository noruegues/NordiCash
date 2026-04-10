"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import {
  LineChart, Wallet, CreditCard, TrendingUp, Layers, Shield,
  Check, X, ChevronRight, ArrowRight, Zap, PieChart, Bell,
  Landmark, Star, Crown, ArrowDown, MessageCircle, Globe, BarChart3,
  Sparkles, Users, Lock, Clock,
} from "lucide-react";

export default function Landing() {
  const [view, setView] = useState<"home" | "login" | "signup">("home");

  if (view === "login") return <AuthLayout><LoginForm onSwitch={() => setView("signup")} onBack={() => setView("home")} /></AuthLayout>;
  if (view === "signup") return <AuthLayout><SignupForm onSwitch={() => setView("login")} onBack={() => setView("home")} /></AuthLayout>;

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden selection:bg-blue-100 antialiased" style={{ fontFamily: "'DM Sans', Inter, system-ui, sans-serif" }}>

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 w-full z-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mt-4 flex items-center justify-between h-14 px-5 rounded-2xl bg-white/70 border border-slate-200/60 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4F6EF7] to-[#7C3AED] grid place-items-center text-white font-bold text-sm shadow-[0_2px_12px_rgba(79,110,247,0.35)]">N</div>
              <span className="font-semibold tracking-tight text-slate-900">NordiCash</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-[13px] text-slate-500 font-medium">
              <a href="#features" className="hover:text-slate-900 transition">Funcionalidades</a>
              <a href="#pricing" className="hover:text-slate-900 transition">Precos</a>
              <a href="#numbers" className="hover:text-slate-900 transition">Sobre</a>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[13px] text-slate-500 hover:text-slate-900 font-medium transition px-3 py-1.5" onClick={() => setView("login")}>Entrar</button>
              <button className="text-[13px] font-semibold bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg active:scale-[0.97]" onClick={() => setView("signup")}>Comecar gratis</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 overflow-hidden">
        {/* Soft gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(79,110,247,0.08) 0%, rgba(124,58,237,0.04) 40%, transparent 70%)" }} />
          <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] rounded-full bg-blue-100/40 blur-[120px]" />
          <div className="absolute top-[50%] left-[5%] w-[350px] h-[350px] rounded-full bg-violet-100/30 blur-[100px]" />
        </div>

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 40%, transparent 40%, white 80%)" }} />

        <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white text-[13px] text-slate-500 mb-10 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              Plataforma de gestao financeira inteligente
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl sm:text-6xl md:text-[80px] font-extrabold tracking-[-0.04em] leading-[0.95]">
              <span className="block text-slate-900">Suas financas.</span>
              <span className="block mt-2 bg-gradient-to-r from-[#4F6EF7] via-[#6C5CE7] to-[#7C3AED] bg-clip-text text-transparent pb-2">
                Um unico painel.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-8 text-[18px] md:text-[20px] text-slate-500 leading-relaxed max-w-2xl mx-auto">
              Receitas, despesas, cartoes, investimentos, consorcios e patrimonio —
              tudo conectado com indicadores reais do Banco Central.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-10 flex gap-3 justify-center flex-wrap">
              <button className="group relative h-13 px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-semibold text-[15px] transition-all hover:bg-slate-800 hover:shadow-xl active:scale-[0.97] shadow-[0_4px_20px_rgba(15,23,42,0.15)]" onClick={() => setView("signup")}>
                Comecar gratis
                <ArrowRight size={16} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="h-13 px-8 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-600 font-medium text-[15px] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm" onClick={() => setView("login")}>
                Ja tenho conta
              </button>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-10 flex items-center justify-center gap-8 text-[13px] text-slate-400 flex-wrap">
              <span className="inline-flex items-center gap-2"><Check size={15} className="text-emerald-500" /> Sem cartao de credito</span>
              <span className="inline-flex items-center gap-2"><Lock size={15} className="text-emerald-500" /> Dados 100% privados</span>
              <span className="inline-flex items-center gap-2"><Clock size={15} className="text-emerald-500" /> Cancele quando quiser</span>
            </div>
          </Reveal>

          {/* Dashboard preview */}
          <Reveal delay={500}>
            <Tilt>
              <div className="mt-20 mx-auto max-w-5xl rounded-3xl border border-slate-200/80 bg-white p-2 shadow-[0_25px_80px_-15px_rgba(79,110,247,0.12),0_0_0_1px_rgba(0,0,0,0.03)]">
                <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white p-5 relative overflow-hidden border border-slate-100">
                  {/* Window dots */}
                  <div className="flex gap-1.5 mb-5">
                    <div className="w-3 h-3 rounded-full bg-red-300" />
                    <div className="w-3 h-3 rounded-full bg-amber-300" />
                    <div className="w-3 h-3 rounded-full bg-green-300" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <GlassKpi label="Receitas" value="R$ 7.000" accent="emerald" />
                    <GlassKpi label="Despesas" value="R$ 5.198" accent="red" />
                    <GlassKpi label="Saldo" value="R$ 1.802" accent="blue" />
                    <GlassKpi label="Investido" value="R$ 5.981" accent="purple" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 rounded-xl border border-slate-100 bg-white p-4">
                      <div className="text-[11px] text-slate-400 mb-3 uppercase tracking-widest font-medium">Fluxo mensal</div>
                      <div className="flex items-end gap-1 h-32">
                        {[40, 55, 48, 70, 60, 82, 75, 90, 65, 78, 88, 95].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t transition-all" style={{
                            height: `${h}%`,
                            background: `linear-gradient(to top, rgba(79,110,247,0.15), rgba(79,110,247,0.55))`,
                            borderRadius: "6px 6px 0 0",
                          }} />
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-2 px-0.5 font-medium">
                        {["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map((m) => <span key={m}>{m}</span>)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <div className="text-[11px] text-slate-400 mb-3 uppercase tracking-widest font-medium">Categorias</div>
                      <div className="flex justify-center my-3">
                        <svg viewBox="0 0 36 36" className="w-24 h-24">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4.5" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#4F6EF7" strokeWidth="4.5" strokeDasharray="37 88" strokeDashoffset="0" strokeLinecap="round" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#22C55E" strokeWidth="4.5" strokeDasharray="25 88" strokeDashoffset="-37" strokeLinecap="round" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" strokeWidth="4.5" strokeDasharray="16 88" strokeDashoffset="-62" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div className="space-y-2 text-[12px]">
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#4F6EF7]" /><span className="text-slate-600">Moradia</span></span><span className="text-slate-400 font-medium">42%</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-600">Alimentacao</span></span><span className="text-slate-400 font-medium">28%</span></div>
                        <div className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-slate-600">Transporte</span></span><span className="text-slate-400 font-medium">18%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tilt>
          </Reveal>

          <div className="mt-14 flex justify-center">
            <div className="animate-bounce p-2 rounded-full border border-slate-200 bg-white shadow-sm">
              <ArrowDown size={16} className="text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGOS / SOCIAL PROOF ─── */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-center text-[13px] text-slate-400 font-medium uppercase tracking-wider mb-8">Tecnologias e integraces</p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-40 grayscale">
            <div className="flex items-center gap-2 text-slate-600"><Globe size={24} /> <span className="font-semibold text-sm">Banco Central</span></div>
            <div className="flex items-center gap-2 text-slate-600"><BarChart3 size={24} /> <span className="font-semibold text-sm">Selic / CDI</span></div>
            <div className="flex items-center gap-2 text-slate-600"><TrendingUp size={24} /> <span className="font-semibold text-sm">IPCA</span></div>
            <div className="flex items-center gap-2 text-slate-600"><Shield size={24} /> <span className="font-semibold text-sm">Criptografia</span></div>
            <div className="flex items-center gap-2 text-slate-600"><Lock size={24} /> <span className="font-semibold text-sm">LGPD</span></div>
          </div>
        </div>
      </section>

      {/* ─── NUMBERS ─── */}
      <section id="numbers" className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            <Reveal><CountUp end={8} suffix="+" sub="Modulos integrados" /></Reveal>
            <Reveal delay={80}><CountUp end={100} suffix="%" sub="Dados privados" /></Reveal>
            <Reveal delay={160}><CountUp end={30} suffix="s" sub="Para comecar" /></Reveal>
            <Reveal delay={240}><CountUp end={0} suffix="" sub="Custo no plano Free" custom="R$ 0" /></Reveal>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-28 relative bg-slate-50/50">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-50/80 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Reveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-[13px] text-slate-500 mb-6 shadow-sm font-medium">
                <Sparkles size={13} className="text-[#4F6EF7]" /> Funcionalidades
              </div>
              <h2 className="text-4xl md:text-[52px] font-extrabold tracking-[-0.03em] text-slate-900">Tudo em um lugar.</h2>
              <p className="text-slate-400 mt-5 max-w-xl mx-auto text-lg">Cada modulo pensado para quem leva suas financas a serio.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <TrendingUp size={22} />, title: "Receitas", desc: "Fontes de renda, contas bancarias, evolucao mes a mes com filtros inteligentes.", color: "#22C55E", bg: "#F0FDF4" },
              { icon: <Wallet size={22} />, title: "Despesas", desc: "Categorias automaticas, formas de pagamento, recorrencias e visao macro.", color: "#EF4444", bg: "#FEF2F2" },
              { icon: <CreditCard size={22} />, title: "Cartoes", desc: "Limite em tempo real, fatura por mes, alertas de atraso e liberacao de limite.", color: "#3B82F6", bg: "#EFF6FF" },
              { icon: <LineChart size={22} />, title: "Investimentos", desc: "Benchmark Selic/CDI/IPCA do Banco Central, projecao com desconto de inflacao.", color: "#8B5CF6", bg: "#F5F3FF" },
              { icon: <Layers size={22} />, title: "Consorcios", desc: "Parcela reduzida, contemplacao, simulacao de parcela cheia e edicao inline.", color: "#F59E0B", bg: "#FFFBEB" },
              { icon: <Shield size={22} />, title: "Patrimonio", desc: "Bens com valorizacao/desvalorizacao, simulador futuro com indicadores do BCB.", color: "#06B6D4", bg: "#ECFEFF" },
              { icon: <Landmark size={22} />, title: "Contas bancarias", desc: "Saldo real por conta, entradas e saidas realizadas. Sem inflar com projecoes.", color: "#F97316", bg: "#FFF7ED" },
              { icon: <PieChart size={22} />, title: "Visao macro", desc: "Pivot comparativo por mes, agrupamento por categoria, variacao percentual.", color: "#EC4899", bg: "#FDF2F8" },
              { icon: <Bell size={22} />, title: "Alertas", desc: "Notificacoes de fatura em atraso e limite de cartao no fim. Tudo em tempo real.", color: "#F43F5E", bg: "#FFF1F2" },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 50}>
                <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-400 h-full overflow-hidden cursor-default">
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ background: `radial-gradient(circle at 30% 20%, ${f.bg}, transparent 70%)` }} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl grid place-items-center mb-5 transition-all duration-300" style={{ background: f.bg, color: f.color }}>
                      {f.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 text-[16px]">{f.title}</h3>
                    <p className="text-[14px] text-slate-400 mt-2.5 leading-relaxed group-hover:text-slate-500 transition-colors">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-28 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-[13px] text-slate-500 mb-6 shadow-sm font-medium">
                <Zap size={13} className="text-[#4F6EF7]" /> Como funciona
              </div>
              <h2 className="text-4xl md:text-[52px] font-extrabold tracking-[-0.03em] text-slate-900">Tres passos simples.</h2>
              <p className="text-slate-400 mt-5 max-w-xl mx-auto text-lg">Comece a organizar suas financas em menos de um minuto.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Crie sua conta", desc: "Cadastro rapido, sem cartao de credito. Apenas nome, email e senha.", icon: <Users size={24} /> },
              { step: "02", title: "Adicione seus dados", desc: "Contas bancarias, cartoes e comece a registrar receitas e despesas.", icon: <Wallet size={24} /> },
              { step: "03", title: "Tenha o controle", desc: "Dashboard completo, graficos, alertas e indicadores do Banco Central.", icon: <BarChart3 size={24} /> },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 120}>
                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 grid place-items-center mx-auto mb-6 text-[#4F6EF7] group-hover:bg-[#4F6EF7] group-hover:text-white group-hover:border-[#4F6EF7] group-hover:shadow-[0_8px_30px_rgba(79,110,247,0.25)] transition-all duration-400">
                    {s.icon}
                  </div>
                  <div className="text-[12px] font-bold text-[#4F6EF7] uppercase tracking-widest mb-3">{s.step}</div>
                  <h3 className="text-[18px] font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-[14px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-28 bg-slate-50/50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-[13px] text-slate-500 mb-6 shadow-sm font-medium">
                <MessageCircle size={13} className="text-[#4F6EF7]" /> Depoimentos
              </div>
              <h2 className="text-4xl md:text-[52px] font-extrabold tracking-[-0.03em] text-slate-900">Quem usa, recomenda.</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { quote: "Finalmente consigo ver todas as minhas financas em um so lugar. O dashboard e incrivel e os alertas me salvam todo mes.", name: "Ana Costa", role: "Empreendedora" },
              { quote: "A integracao com indicadores do Banco Central faz toda a diferenca nos meus investimentos. Muito superior a planilhas.", name: "Rafael Mendes", role: "Investidor" },
              { quote: "Interface linda, rapida e funcional. Em 5 minutos ja tinha todas as minhas contas e cartoes cadastrados.", name: "Juliana Silva", role: "Designer" },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-7 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-[15px] text-slate-600 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4F6EF7] to-[#7C3AED] grid place-items-center text-white text-[13px] font-bold">{t.name[0]}</div>
                    <div>
                      <div className="text-[14px] font-semibold text-slate-900">{t.name}</div>
                      <div className="text-[12px] text-slate-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-28 relative bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-violet-50/60 blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <Reveal>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-[13px] text-slate-500 mb-6 shadow-sm font-medium">
                <Crown size={13} className="text-[#4F6EF7]" /> Planos e precos
              </div>
              <h2 className="text-4xl md:text-[52px] font-extrabold tracking-[-0.03em] text-slate-900">Simples e transparente.</h2>
              <p className="text-slate-400 mt-5 max-w-xl mx-auto text-lg">Upgrade ou downgrade quando quiser. Sem multa, sem surpresas.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
            {([
              {
                name: "Free", price: "0", desc: "Para comecar a organizar", popular: false,
                features: [
                  [true, "2 contas bancarias"],
                  [true, "2 cartoes de credito"],
                  [true, "Receitas e despesas"],
                  [true, "Dashboard basico"],
                  [true, "Filtros por mes"],
                  [false, "Investimentos e projecoes"],
                  [false, "Consorcios"],
                  [false, "Patrimonio e simulador"],
                  [false, "Indicadores BCB (Selic/IPCA)"],
                  [false, "Suporte prioritario"],
                ],
              },
              {
                name: "Pro", price: "19", desc: "Para quem leva a serio", popular: true,
                features: [
                  [true, "Contas ilimitadas"],
                  [true, "Cartoes ilimitados"],
                  [true, "Receitas e despesas"],
                  [true, "Dashboard completo"],
                  [true, "Filtros e visao macro"],
                  [true, "Investimentos com projecao"],
                  [true, "Benchmark Selic/CDI/IPCA"],
                  [false, "Consorcios completo"],
                  [false, "Patrimonio e simulador"],
                  [false, "Suporte prioritario"],
                ],
              },
              {
                name: "Premium", price: "39", desc: "Controle total das financas", popular: false,
                features: [
                  [true, "Tudo do Pro incluido"],
                  [true, "Consorcios completo"],
                  [true, "Patrimonio e simulador"],
                  [true, "Valorizacao / desvalorizacao"],
                  [true, "Indicadores BCB em tempo real"],
                  [true, "Graficos avancados"],
                  [true, "Notificacoes inteligentes"],
                  [true, "Contas com saldo real"],
                  [true, "Export de dados"],
                  [true, "Suporte prioritario"],
                ],
              },
            ] as const).map((plan, i) => (
              <Reveal key={plan.name} delay={i * 100}>
                <div className={`relative rounded-2xl h-full flex flex-col transition-all duration-300 ${
                  plan.popular
                    ? "border-2 border-[#4F6EF7] bg-white shadow-[0_8px_40px_rgba(79,110,247,0.12)] scale-[1.02]"
                    : "border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#4F6EF7] to-[#7C3AED] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-[0_4px_15px_rgba(79,110,247,0.35)]">
                        <Star size={12} /> Mais popular
                      </span>
                    </div>
                  )}
                  <div className="p-7 flex-1 flex flex-col">
                    <div className="mb-8">
                      <div className="text-[14px] font-semibold text-slate-500">{plan.name}</div>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-[52px] font-extrabold tracking-tight text-slate-900 leading-none">R${plan.price}</span>
                        <span className="text-[14px] text-slate-400 ml-1">/mes</span>
                      </div>
                      <div className="text-[14px] text-slate-400 mt-2">{plan.desc}</div>
                    </div>

                    <div className="h-px bg-slate-100 mb-7" />

                    <ul className="space-y-3.5 flex-1">
                      {plan.features.map(([ok, text]) => (
                        <li key={text} className={`flex items-start gap-3 text-[13px] leading-snug ${ok ? "text-slate-600" : "text-slate-300"}`}>
                          {ok
                            ? <div className="w-5 h-5 rounded-full bg-emerald-50 grid place-items-center shrink-0 mt-0.5"><Check size={12} className="text-emerald-500" /></div>
                            : <div className="w-5 h-5 rounded-full bg-slate-50 grid place-items-center shrink-0 mt-0.5"><X size={12} className="text-slate-300" /></div>
                          }
                          {text}
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full mt-8 h-12 rounded-xl font-semibold text-[14px] transition-all ${
                        plan.popular
                          ? "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                      onClick={() => setView("signup")}
                    >
                      {plan.price === "0" ? "Comecar gratis" : "Assinar agora"}
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 relative overflow-hidden bg-slate-900">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#4F6EF7]/20 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-[-0.03em] leading-[1.05] text-white">
              Pronto para assumir
              <br />
              <span className="bg-gradient-to-r from-[#60A5FA] via-[#818CF8] to-[#A78BFA] bg-clip-text text-transparent">o controle?</span>
            </h2>
            <p className="text-slate-400 mt-6 text-lg">Crie sua conta em 30 segundos. Sem cartao de credito.</p>
            <button className="mt-10 group relative h-14 px-10 rounded-2xl bg-white text-slate-900 font-bold text-base transition-all hover:shadow-[0_8px_40px_rgba(255,255,255,0.15)] hover:scale-[1.03] active:scale-[0.98]" onClick={() => setView("signup")}>
              Criar minha conta gratis
              <ChevronRight size={18} className="inline ml-1 group-hover:translate-x-1.5 transition-transform" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4F6EF7] to-[#7C3AED] grid place-items-center text-white font-bold text-[10px] shadow-sm">N</div>
              <span className="text-[13px] text-slate-400 font-medium">NordiCash v1.0.0</span>
            </div>
            <div className="flex items-center gap-8 text-[13px] text-slate-400">
              <a href="#features" className="hover:text-slate-600 transition">Funcionalidades</a>
              <a href="#pricing" className="hover:text-slate-600 transition">Precos</a>
              <a href="#" className="hover:text-slate-600 transition">Privacidade</a>
              <a href="#" className="hover:text-slate-600 transition">Termos</a>
            </div>
            <div className="text-[12px] text-slate-300">&copy; 2026 NordiCash. Todos os direitos reservados.</div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.08); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-25px) translateX(12px); }
          66% { transform: translateY(15px) translateX(-18px); }
        }
      `}</style>
    </div>
  );
}

// ═════════════════════════════
// ANIMATION COMPONENTS
// ═════════════════════════════

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.97)",
        filter: visible ? "blur(0)" : "blur(6px)",
        transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform, filter",
      }}
    >{children}</div>
  );
}

function Tilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const handle = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    };
    const reset = () => { el.style.transform = "perspective(1200px) rotateX(0) rotateY(0)"; };
    el.addEventListener("mousemove", handle);
    el.addEventListener("mouseleave", reset);
    return () => { el.removeEventListener("mousemove", handle); el.removeEventListener("mouseleave", reset); };
  }, []);

  return <div ref={ref} className="transition-transform duration-300 ease-out">{children}</div>;
}

function CountUp({ end, prefix, suffix, sub, custom }: { end: number; prefix?: string; suffix?: string; sub: string; custom?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const dur = 1500;
    const step = Math.max(1, Math.ceil(end / (dur / 30)));
    const iv = setInterval(() => {
      setVal((v) => { const next = v + step; if (next >= end) { clearInterval(iv); return end; } return next; });
    }, 30);
    return () => clearInterval(iv);
  }, [started, end]);

  return (
    <div ref={ref}>
      <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">{custom && started ? custom : <>{prefix}{val}<span className="text-[#4F6EF7]">{suffix}</span></>}</div>
      <div className="text-[14px] text-slate-400 mt-2">{sub}</div>
    </div>
  );
}

function GlassKpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  const colors: Record<string, { text: string; bg: string; border: string }> = {
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    red: { text: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
    blue: { text: "text-[#4F6EF7]", bg: "bg-blue-50", border: "border-blue-100" },
    purple: { text: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
  };
  const c = colors[accent] ?? { text: "text-slate-700", bg: "bg-slate-50", border: "border-slate-100" };
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-3.5`}>
      <div className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">{label}</div>
      <div className={`text-xl font-bold mt-1 ${c.text}`}>{value}</div>
    </div>
  );
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 grid lg:grid-cols-2">
      <div className="hidden lg:flex relative p-12 flex-col justify-between overflow-hidden bg-slate-50">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.3]"
            style={{ backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-blue-100/50 blur-[100px]" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 20%, #F8FAFC 70%)" }} />
        </div>
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F6EF7] to-[#7C3AED] grid place-items-center text-white font-bold shadow-[0_2px_12px_rgba(79,110,247,0.35)]">N</div>
          <div>
            <div className="font-semibold tracking-tight text-slate-900">NordiCash</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Finance SaaS</div>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold leading-tight max-w-md tracking-tight text-slate-900">
            Sua vida financeira,
            <br />
            <span className="bg-gradient-to-r from-[#4F6EF7] to-[#7C3AED] bg-clip-text text-transparent">organizada.</span>
          </h2>
          <p className="mt-5 text-slate-400 max-w-md leading-relaxed">Receitas, despesas, cartoes, investimentos e patrimonio em tempo real.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
