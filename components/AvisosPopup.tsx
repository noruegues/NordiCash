"use client";
import { useEffect, useState, useCallback } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  criadoEm: string;
};

const iconMap: Record<string, React.ReactNode> = {
  info: <Info size={22} />,
  success: <CheckCircle2 size={22} />,
  warning: <AlertTriangle size={22} />,
  danger: <XCircle size={22} />,
};

const colorMap: Record<string, { bg: string; border: string; icon: string; accent: string }> = {
  info: { bg: "from-blue-500/10 to-blue-600/5", border: "border-blue-500/20", icon: "text-blue-400", accent: "bg-blue-500" },
  success: { bg: "from-emerald-500/10 to-emerald-600/5", border: "border-emerald-500/20", icon: "text-emerald-400", accent: "bg-emerald-500" },
  warning: { bg: "from-amber-500/10 to-amber-600/5", border: "border-amber-500/20", icon: "text-amber-400", accent: "bg-amber-500" },
  danger: { bg: "from-red-500/10 to-red-600/5", border: "border-red-500/20", icon: "text-red-400", accent: "bg-red-500" },
};

export default function AvisosPopup() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [current, setCurrent] = useState(0);

  const fetchAvisos = useCallback(async () => {
    try {
      const res = await fetch("/api/avisos");
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) setAvisos(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchAvisos();
    // Poll a cada 30s para avisos novos em tempo real
    const interval = setInterval(fetchAvisos, 30000);
    return () => clearInterval(interval);
  }, [fetchAvisos]);

  async function dismiss(avisoId: string) {
    await fetch("/api/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avisoId }),
    });
    setAvisos((prev) => {
      const next = prev.filter((a) => a.id !== avisoId);
      if (current >= next.length && next.length > 0) setCurrent(next.length - 1);
      return next;
    });
  }

  if (avisos.length === 0) return null;

  const aviso = avisos[current];
  const colors = colorMap[aviso.tipo] || colorMap.info;

  return (
    <div className="modal-backdrop">
      <div className={`modal-panel max-w-lg border ${colors.border} overflow-hidden`}>
        {/* Accent bar */}
        <div className={`h-1 ${colors.accent}`} />

        <div className={`bg-gradient-to-b ${colors.bg} p-6`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-black/20 grid place-items-center ${colors.icon}`}>
                {iconMap[aviso.tipo] || iconMap.info}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{aviso.titulo}</h2>
                <span className="text-[10px] text-zinc-500">
                  {new Date(aviso.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
            <div className="w-5" />
          </div>

          {/* Mensagem */}
          <div className="text-sm text-zinc-300 leading-relaxed [&_b]:font-bold [&_i]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: aviso.mensagem }} />

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            {/* Paginação */}
            {avisos.length > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="btn btn-ghost btn-icon btn-sm disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-zinc-500">
                  {current + 1} de {avisos.length}
                </span>
                <button
                  onClick={() => setCurrent((c) => Math.min(avisos.length - 1, c + 1))}
                  disabled={current === avisos.length - 1}
                  className="btn btn-ghost btn-icon btn-sm disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div />
            )}

            <button
              onClick={() => dismiss(aviso.id)}
              className="btn btn-primary btn-sm"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
