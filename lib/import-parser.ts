"use client";

export type ParsedRow = {
  date: string;       // YYYY-MM-DD
  description: string;
  value: number;      // positivo = receita, negativo = despesa
  type: "receita" | "despesa";
  category: string;
  selected: boolean;
};

/** Detecta separador CSV (`;` ou `,`) */
function detectSeparator(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

/** Normaliza data brasileira ou ISO para YYYY-MM-DD */
function normalizeDate(raw: string): string {
  const trimmed = raw.trim();
  // DD/MM/YYYY
  const brMatch = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed);
  if (brMatch) return `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`;
  // YYYY-MM-DD (ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  // YYYYMMDD
  const compactMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(trimmed);
  if (compactMatch) return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;
  return trimmed;
}

/** Normaliza valor monetário brasileiro */
function normalizeValue(raw: string): number {
  let cleaned = raw.trim();
  // Remove R$ e espaços
  cleaned = cleaned.replace(/R\$\s*/gi, "").trim();
  // Formato brasileiro: 1.234,56 → 1234.56
  if (/\d\.\d{3}/.test(cleaned) && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",") && !cleaned.includes(".")) {
    // 1234,56 → 1234.56
    cleaned = cleaned.replace(",", ".");
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/** Tenta adivinhar categoria baseado na descrição */
function guessCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/uber|99|taxi|cabify|estacion/i.test(d)) return "Transporte";
  if (/ifood|rappi|uber\s*eats|restaur|lanch|pizza|burger|mcdonald|subway/i.test(d)) return "Alimentação";
  if (/supermercado|mercado|pao de acucar|carrefour|assai|atacadao/i.test(d)) return "Supermercado";
  if (/netflix|spotify|disney|hbo|prime|youtube|gaming|steam/i.test(d)) return "Assinaturas";
  if (/farmacia|drogaria|saude|medic|hospital|consulta|exame/i.test(d)) return "Saúde";
  if (/luz|energia|agua|gas|internet|telefone|celular|claro|vivo|tim/i.test(d)) return "Moradia";
  if (/salario|salário|pagamento|remuneração|prolabore/i.test(d)) return "Salário";
  if (/pix recebido|transferencia recebida|ted recebida/i.test(d)) return "Transferência";
  return "Outros";
}

/** Detecta colunas automaticamente */
function detectColumns(headers: string[]): { dateIdx: number; descIdx: number; valueIdx: number; creditIdx: number; debitIdx: number } {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const dateIdx = lower.findIndex((h) => /data|date|dt/.test(h));
  const descIdx = lower.findIndex((h) => /descri|hist[oó]rico|memo|detail|lancamento|lançamento/.test(h));
  const valueIdx = lower.findIndex((h) => /valor|value|amount|quantia/.test(h));
  const creditIdx = lower.findIndex((h) => /cr[eé]dito|credit|entrada/.test(h));
  const debitIdx = lower.findIndex((h) => /d[eé]bito|debit|sa[ií]da/.test(h));

  return {
    dateIdx: dateIdx >= 0 ? dateIdx : 0,
    descIdx: descIdx >= 0 ? descIdx : 1,
    valueIdx: valueIdx >= 0 ? valueIdx : (creditIdx >= 0 ? -1 : 2),
    creditIdx,
    debitIdx,
  };
}

export function parseCSV(text: string): ParsedRow[] {
  const sep = detectSeparator(text);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(sep);
  const cols = detectColumns(headers);
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep);
    if (cells.length < 2) continue;

    const date = normalizeDate(cells[cols.dateIdx] ?? "");
    const description = (cells[cols.descIdx] ?? "").trim().replace(/^"|"$/g, "");
    if (!description) continue;

    let value: number;
    if (cols.valueIdx >= 0) {
      value = normalizeValue(cells[cols.valueIdx] ?? "0");
    } else {
      const credit = normalizeValue(cells[cols.creditIdx] ?? "0");
      const debit = normalizeValue(cells[cols.debitIdx] ?? "0");
      value = credit > 0 ? credit : -Math.abs(debit);
    }

    if (value === 0) continue;

    rows.push({
      date,
      description,
      value: Math.abs(value),
      type: value >= 0 ? "receita" : "despesa",
      category: guessCategory(description),
      selected: true,
    });
  }

  return rows;
}

export function parseOFX(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];

  // Extrai transações OFX (SGML ou XML)
  const txnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  while ((match = txnRegex.exec(text)) !== null) {
    const block = match[1];
    const getField = (name: string) => {
      const re = new RegExp(`<${name}>([^<\\n]+)`, "i");
      const m = re.exec(block);
      return m ? m[1].trim() : "";
    };

    const dtPosted = getField("DTPOSTED");
    const trnAmt = getField("TRNAMT");
    const memo = getField("MEMO") || getField("NAME");

    const date = dtPosted.length >= 8
      ? `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`
      : "";

    const value = parseFloat(trnAmt.replace(",", "."));
    if (!date || isNaN(value) || value === 0) continue;

    rows.push({
      date,
      description: memo,
      value: Math.abs(value),
      type: value >= 0 ? "receita" : "despesa",
      category: guessCategory(memo),
      selected: true,
    });
  }

  return rows;
}

export function parseFile(text: string, filename: string): ParsedRow[] {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "ofx" || ext === "qfx") return parseOFX(text);
  return parseCSV(text);
}
