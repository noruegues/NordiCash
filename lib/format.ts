export const brl = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const brlFull = brl;

export const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

// Formata número como string BRL sem o símbolo (ex.: 1.234,56)
export const formatBRLNumber = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Converte string digitada (apenas dígitos) em número (centavos -> reais)
export const parseBRLDigits = (raw: string): number => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
};

// ===== Datas =====
const MESES_CURTOS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// Data de hoje em horário local como "YYYY-MM-DD". Evita o bug de `toISOString()` que devolve UTC.
export function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// "YYYY-MM" → "JAN/26"
export function mesRefBR(mesRef: string): string {
  if (!mesRef) return "";
  const [y, m] = mesRef.split("-");
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return mesRef;
  return `${MESES_CURTOS[idx]}/${y.slice(2)}`;
}

// "YYYY-MM-DD" ou Date → "DD/MM/YYYY"
export function dataBR(input: string | Date | undefined | null): string {
  if (!input) return "";
  if (input instanceof Date) {
    return input.toLocaleDateString("pt-BR");
  }
  // tenta parsear "YYYY-MM-DD" sem deslocamento de timezone
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return d.toLocaleDateString("pt-BR");
}
