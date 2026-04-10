"use client";
import { useEffect, useState } from "react";

// BCB SGS API — séries públicas
// 432 = Selic meta (% a.a.)
// 433 = IPCA mensal (%)
// 12  = CDI diário (% a.d.)
// 189 = IGPM mensal (%)

const BCB = (code: number) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/12?formato=json`;

export type Indicadores = {
  selic: number;       // % a.a.
  ipca: number;        // % a.a. (acumulado 12m)
  cdi: number;         // % a.a.
  igpm: number;        // % a.a. (acumulado 12m)
  poupanca: number;    // % a.a. (regra: 70% Selic quando Selic ≤ 8.5%, senão 0.5% a.m + TR)
  updatedAt: string | null;
  loading: boolean;
  error?: string;
};

// Defaults razoáveis (cache inicial — sobrescrito após fetch)
const FALLBACK: Indicadores = {
  selic: 10.5,
  ipca: 4.2,
  cdi: 10.4,
  igpm: 3.8,
  poupanca: 6.17,
  updatedAt: null,
  loading: true,
};

const CACHE_KEY = "nordicash-indicadores";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function calcPoupanca(selic: number): number {
  // Regra Poupança pós-2012:
  // Selic > 8.5% a.a. → 0.5% a.m. + TR ≈ 6.17% a.a.
  // Selic ≤ 8.5% a.a. → 70% da Selic + TR
  if (selic > 8.5) return 6.17;
  return 0.7 * selic;
}

async function fetchSerie(code: number): Promise<number[]> {
  const r = await fetch(BCB(code), { cache: "no-store" });
  if (!r.ok) throw new Error(`BCB ${code}: ${r.status}`);
  const data = (await r.json()) as { data: string; valor: string }[];
  return data.map((x) => parseFloat(x.valor));
}

export function useIndicadores(): Indicadores {
  const [state, setState] = useState<Indicadores>(() => {
    if (typeof window === "undefined") return FALLBACK;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as Indicadores;
        if (cached.updatedAt && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_TTL_MS) {
          return { ...cached, loading: false };
        }
      }
    } catch {}
    return FALLBACK;
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Selic meta (última leitura = valor atual)
        const [selicSerie, ipcaSerie, igpmSerie] = await Promise.all([
          fetchSerie(432),
          fetchSerie(433),
          fetchSerie(189),
        ]);
        const selic = selicSerie.at(-1) ?? FALLBACK.selic;
        // IPCA/IGPM: acumulado 12m (multiplicativo)
        const ipca12 = (ipcaSerie.reduce((acc, v) => acc * (1 + v / 100), 1) - 1) * 100;
        const igpm12 = (igpmSerie.reduce((acc, v) => acc * (1 + v / 100), 1) - 1) * 100;
        // CDI tende a ficar ~0.1 pp abaixo da Selic
        const cdi = Math.max(0, selic - 0.1);
        const poupanca = calcPoupanca(selic);
        const next: Indicadores = {
          selic,
          ipca: ipca12,
          cdi,
          igpm: igpm12,
          poupanca,
          updatedAt: new Date().toISOString(),
          loading: false,
        };
        if (!alive) return;
        setState(next);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
      } catch (err: any) {
        if (!alive) return;
        setState((s) => ({ ...s, loading: false, error: err?.message ?? "erro" }));
      }
    })();
    return () => { alive = false; };
  }, []);

  return state;
}
