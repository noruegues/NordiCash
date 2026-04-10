"use client";
import { useAuth, useCurrentUser } from "@/lib/auth";
import { Sparkles, TrendingUp, CreditCard, LineChart, Wallet } from "lucide-react";

export default function WelcomePopup() {
  const { showWelcome, dismissWelcome } = useAuth();
  const user = useCurrentUser();
  if (!showWelcome || !user) return null;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="modal-backdrop" onClick={dismissWelcome}>
      <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="card-body !p-0 relative overflow-hidden">
          <div className="bg-gradient-to-br from-primary via-primary2 to-primary p-8 text-white relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-medium mb-3">
                <Sparkles size={14} /> Bem-vindo
              </div>
              <h2 className="text-3xl font-semibold tracking-tight">{saudacao}, {user.nome.split(" ")[0]}! 👋</h2>
              <p className="mt-2 text-white/85">Seu painel financeiro está pronto. Vamos começar?</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <Item icon={<TrendingUp size={16} />} title="Cadastre suas receitas" desc="Salário, freelas, dividendos e mais" />
            <Item icon={<CreditCard size={16} />} title="Controle seus cartões" desc="Limite, vencimento e fatura" />
            <Item icon={<LineChart size={16} />} title="Acompanhe investimentos" desc="Projete seu crescimento ao longo do tempo" />
            <Item icon={<Wallet size={16} />} title="Visão de patrimônio" desc="Bens, dívidas e simulação de futuro" />
          </div>
          <div className="p-6 pt-0">
            <button className="btn btn-primary w-full" onClick={dismissWelcome}>Começar agora</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded grid place-items-center bg-primary/10 text-primary shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-zinc-100">{title}</div>
        <div className="text-xs text-zinc-500">{desc}</div>
      </div>
    </div>
  );
}
