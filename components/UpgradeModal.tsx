"use client";
import Modal from "@/components/ui/Modal";
import { useAuth, type Plano } from "@/lib/auth";
import { Crown, Check } from "lucide-react";

export default function UpgradeModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const { setPlano } = useAuth();
  const planos: { key: Plano; price: string; features: string[]; popular?: boolean }[] = [
    { key: "Pro", price: "R$ 19", features: ["Contas ilimitadas", "Cartões ilimitados", "Investimentos & projeções"], popular: true },
    { key: "Premium", price: "R$ 39", features: ["Tudo do Pro", "Consórcios e patrimônio", "Suporte prioritário"] },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Faça upgrade do seu plano" size="lg">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary grid place-items-center mx-auto mb-3">
          <Crown size={26} />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">Limite do plano Free atingido</h3>
        <p className="text-sm text-zinc-400 mt-1">
          {reason ?? "O plano Free permite apenas 2 contas e 2 cartões. Faça upgrade para continuar."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planos.map((p) => (
          <div key={p.key} className={`border rounded p-5 relative ${p.popular ? "border-primary bg-primary/5" : "border-border"}`}>
            {p.popular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 pill pill-info bg-primary text-white border-primary">
                Recomendado
              </div>
            )}
            <div className="text-xl font-semibold text-zinc-100">{p.key}</div>
            <div className="mt-1">
              <span className="text-3xl font-bold text-primary">{p.price}</span>
              <span className="text-sm text-zinc-500">/mês</span>
            </div>
            <ul className="mt-4 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="text-sm text-zinc-300 flex items-center gap-2">
                  <Check size={14} className="text-success shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-5 btn w-full ${p.popular ? "btn-primary" : "btn-soft"}`}
              onClick={() => { setPlano(p.key); onClose(); }}
            >
              Fazer upgrade para {p.key}
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost w-full mt-4" onClick={onClose}>Agora não</button>
    </Modal>
  );
}
