import { Cartao } from "@/lib/store";

export default function CreditCardVisual({
  cartao, usado, selected, onClick,
}: {
  cartao: Cartao;
  usado: number;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-md p-5 h-44 relative overflow-hidden transition border ${
        selected ? "border-primary shadow-glow" : "border-border hover:border-zinc-700"
      }`}
      style={{ background: `linear-gradient(135deg, ${cartao.cor}, #000)` }}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs text-white/60">{cartao.banco}</div>
          <div className="font-semibold text-white">{cartao.nome}</div>
        </div>
        <div className="text-xs font-bold text-white/80 tracking-wider">{cartao.bandeira.toUpperCase()}</div>
      </div>
      <div className="absolute bottom-5 left-5 right-5">
        <div className="text-white/50 text-[10px] tracking-widest">**** **** **** {cartao.id.slice(-4).toUpperCase()}</div>
        <div className="text-white text-sm mt-1 font-mono" data-money>
          R$ {usado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {cartao.limite.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-white/80" style={{ width: `${Math.min(100, (usado / cartao.limite) * 100)}%` }} />
        </div>
      </div>
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/5" />
    </button>
  );
}
