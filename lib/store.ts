"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ===== Types =====
export type Bandeira = "Visa" | "Mastercard" | "Elo" | "Amex" | "Hipercard";
export type FormaPagamento = "Pix" | "Débito" | "Dinheiro" | "Boleto" | "Cartão";
export type RecorrenciaTipo = "Única" | "Periódica" | "Indeterminada";
export type StatusParcela = "Pago" | "Pendente" | "Futuro";

export type ContaBancaria = {
  id: string;
  nome: string;
  banco: string;
  tipo: "Corrente" | "Poupança" | "Pagamento";
  saldoInicial: number;
  cor: string;
};

export type Receita = {
  id: string;
  fonte: string;
  categoria: string;
  valor: number;
  contaId?: string;
  mesRef: string; // YYYY-MM
  recorrencia: "Mensal" | "Única";
};

export type Despesa = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;          // YYYY-MM-DD
  mesRef: string;        // YYYY-MM
  forma: FormaPagamento;
  contaId?: string;      // se Pix/Débito
  cartaoId?: string;     // se Cartão
  recorrencia: RecorrenciaTipo;
  recorrenciaMeses?: number; // se Periódica
  emprestado?: boolean;
  pago?: boolean; // para despesas de cartão: marca como já paga (libera limite)
};

export type Cartao = {
  id: string;
  nome: string;
  banco: string;
  bandeira: Bandeira;
  cor: string;
  limite: number;
  diaVencimento: number; // 1-31
  faturaPagaMes?: string; // YYYY-MM da última fatura paga
};

export type Investimento = {
  id: string;
  nome: string;
  tipo: "Renda Fixa" | "Ações" | "FIIs" | "Cripto" | "Tesouro" | "Fundo";
  valorInicial: number;
  aporteMensal: number;
  saldoAtual: number;
  inicio: string;
  taxaMensal?: number; // % esperado
};

export type ParcelaConsorcio = {
  numero: number;
  valor: number;
  dataVenc: string;
  status: StatusParcela;
  contemplado: boolean;
};

export type Consorcio = {
  id: string;
  bem: string;
  administradora: string;
  valorCarta: number;
  prazoMeses: number;
  parcelaCheia: number;
  taxaAdmin: number; // %
  inicio: string;
  diaVencimento: number;
  debitoAutomatico: boolean;
  contaId?: string;
  contemplado: boolean;
  pagamentoReduzido?: boolean;     // true = paga 50% até a contemplação
  percentualReducao?: number;      // 0.5 = 50%
  parcelas: ParcelaConsorcio[];
};

export type Bem = {
  id: string;
  nome: string;
  tipo: "Imóvel" | "Veículo" | "Moto" | "Outros";
  valorCompra: number;
  valorMercado: number;
  anosUso: number;
  dividaRestante: number;
  // Valorização/desvalorização anual em % (positivo = valoriza, negativo = desvaloriza)
  taxaAnual?: number;
  comportamento?: "valoriza" | "desvaloriza";
};

// ===== Helpers =====
const uid = () => Math.random().toString(36).slice(2, 10);

// ===== State =====
type State = {
  contas: ContaBancaria[];
  receitas: Receita[];
  despesas: Despesa[];
  cartoes: Cartao[];
  investimentos: Investimento[];
  consorcios: Consorcio[];
  bens: Bem[];

  // CRUD generic actions
  addConta: (c: Omit<ContaBancaria, "id">) => void;
  updateConta: (id: string, c: Partial<ContaBancaria>) => void;
  removeConta: (id: string) => void;

  addReceita: (r: Omit<Receita, "id">) => void;
  updateReceita: (id: string, r: Partial<Receita>) => void;
  removeReceita: (id: string) => void;

  addDespesa: (d: Omit<Despesa, "id">) => void;
  updateDespesa: (id: string, d: Partial<Despesa>) => void;
  removeDespesa: (id: string) => void;

  addCartao: (c: Omit<Cartao, "id">) => void;
  updateCartao: (id: string, c: Partial<Cartao>) => void;
  removeCartao: (id: string) => void;
  marcarFaturaPaga: (id: string, mes: string) => void;

  addInvestimento: (i: Omit<Investimento, "id">) => void;
  updateInvestimento: (id: string, i: Partial<Investimento>) => void;
  removeInvestimento: (id: string) => void;

  addConsorcio: (c: Omit<Consorcio, "id" | "parcelas"> & { parcelas?: ParcelaConsorcio[] }) => void;
  updateConsorcio: (id: string, c: Partial<Consorcio>) => void;
  removeConsorcio: (id: string) => void;
  updateParcela: (consorcioId: string, numero: number, p: Partial<ParcelaConsorcio>) => void;
  desmarcarContempladosTodos: (consorcioId: string) => void;

  addBem: (b: Omit<Bem, "id">) => void;
  updateBem: (id: string, b: Partial<Bem>) => void;
  removeBem: (id: string) => void;

  resetSeed: () => void;
};

// Seed real (Planilha Financeiro Pessoal Victor Hugo) — ano completo 2026
const MESES_2026 = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`);

type DespesaRow = {
  descricao: string;
  categoria: string;
  forma: FormaPagamento;
  cartaoId?: string;
  contaId?: string;
  recorrencia: RecorrenciaTipo;
  recorrenciaMeses?: number;
  emprestado?: boolean;
  diaVenc: number;
  vals: number[]; // 12 meses
};

function gerarDespesas(prefix: string, rows: DespesaRow[]): Despesa[] {
  const out: Despesa[] = [];
  rows.forEach((r, ri) => {
    r.vals.forEach((v, mi) => {
      if (!v) return;
      const mes = MESES_2026[mi];
      out.push({
        id: `${prefix}${ri}_${mi}`,
        descricao: r.descricao,
        categoria: r.categoria,
        valor: v,
        data: `${mes}-${String(r.diaVenc).padStart(2, "0")}`,
        mesRef: mes,
        forma: r.forma,
        cartaoId: r.cartaoId,
        contaId: r.contaId,
        recorrencia: r.recorrencia,
        recorrenciaMeses: r.recorrenciaMeses,
        emprestado: r.emprestado,
      });
    });
  });
  return out;
}

const despesasRows: DespesaRow[] = [
  // ===== DESPESAS FIXAS (Débito) =====
  { descricao: "CEMIG",            categoria: "Contas",      forma: "Débito", contaId: "c1", recorrencia: "Indeterminada", diaVenc: 5,  vals: [225.5,270,270,270,270,270,270,270,270,270,270,270] },
  { descricao: "TIM/VIVO",         categoria: "Contas",      forma: "Débito", contaId: "c1", recorrencia: "Indeterminada", diaVenc: 8,  vals: [160,160,160,160,300,300,300,300,300,300,300,300] },
  { descricao: "SALÃO",            categoria: "Pessoal",     forma: "Débito", contaId: "c1", recorrencia: "Indeterminada", diaVenc: 6,  vals: [310,320,320,320,320,320,320,320,320,320,320,320] },
  { descricao: "INTERNET",         categoria: "Contas",      forma: "Débito", contaId: "c1", recorrencia: "Indeterminada", diaVenc: 10, vals: [122.9,122.9,122.9,122.9,122.9,122.9,122.9,122.9,122.9,122.9,122.9,122.9] },
  { descricao: "PLANO FUNERÁRIO",  categoria: "Saúde",       forma: "Débito", contaId: "c1", recorrencia: "Indeterminada", diaVenc: 12, vals: [111.13,111.13,111.13,111.13,111.13,111.13,111.13,111.13,0,0,0,0] },

  // ===== CARTÃO INTER =====
  { descricao: "SPOTIFY",          categoria: "Lazer",       forma: "Cartão", cartaoId: "k1", recorrencia: "Indeterminada", diaVenc: 2,  vals: [40.9,40.9,40.9,40.9,40.9,40.9,40.9,40.9,40.9,40.9,40.9,40.9] },
  { descricao: "PADARIA",          categoria: "Alimentação", forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 3,  vals: [79.37,79.37,79.37,79.37,41.66,0,0,0,0,0,0,0] },
  { descricao: "FARMÁCIA",         categoria: "Saúde",       forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 4,  vals: [29.68,29.68,29.68,29.68,0,0,0,0,0,0,0,0] },
  { descricao: "BH",               categoria: "Moradia",     forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 5,  vals: [70.98,70.98,70.98,70.98,700,0,0,0,0,0,0,0] },
  { descricao: "GASOLINA",         categoria: "Transporte",  forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 6,  vals: [82.48,82.48,82.48,82.48,140,0,0,0,0,0,0,0] },
  { descricao: "ALMOÇO",           categoria: "Alimentação", forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 7,  vals: [191.08,191.08,191.08,191.08,0,0,0,0,0,0,0,0] },
  { descricao: "LAZER/ROLÊ/VIAGEM",categoria: "Lazer",       forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 13, vals: [606.33,606.33,606.33,606.33,0,0,0,0,0,0,0,0] },
  { descricao: "i9TECNOLOGIA",     categoria: "Tecnologia",  forma: "Cartão", cartaoId: "k1", recorrencia: "Periódica", recorrenciaMeses: 3, diaVenc: 10, vals: [333.34,333.34,333.34,0,0,0,0,0,0,0,0,0] },
  { descricao: "CASA",             categoria: "Outros",      forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 14, vals: [0,0,0,0,29.95,0,0,0,0,0,0,0] },
  { descricao: "PRESENTE GIZELE",  categoria: "Outros",      forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 15, vals: [40,40,40,0,0,0,0,0,0,0,0,0] },
  { descricao: "ROUPA",            categoria: "Vestuário",   forma: "Cartão", cartaoId: "k1", recorrencia: "Única",         diaVenc: 16, vals: [0,0,0,123.29,123.29,123.29,0,0,0,0,0,0] },
  { descricao: "CARDIOLOGISTA",    categoria: "Saúde",       forma: "Cartão", cartaoId: "k1", recorrencia: "Periódica", recorrenciaMeses: 6, diaVenc: 17, vals: [766.71,766.71,766.71,0,713.33,713.33,713.33,0,0,0,0,0] },
  { descricao: "OFICINA",          categoria: "Transporte",  forma: "Cartão", cartaoId: "k1", recorrencia: "Periódica", recorrenciaMeses: 6, diaVenc: 18, vals: [0,0,237.83,237.83,237.83,237.83,237.83,237.83,0,0,0,0] },

  // ===== CARTÃO ITAÚ =====
  { descricao: "IPHONE 16 PRO MAX",categoria: "Tecnologia",  forma: "Cartão", cartaoId: "k2", recorrencia: "Periódica", recorrenciaMeses: 5, diaVenc: 15, vals: [440.27,440.27,440.27,440.27,440.27,0,0,0,0,0,0,0] },
  { descricao: "OFICINA (Itaú)",   categoria: "Transporte",  forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 8,  vals: [65,65,65,65,0,0,0,0,0,0,0,0] },
  { descricao: "UBER",             categoria: "Transporte",  forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 9,  vals: [298.82,298.82,298.82,298.82,0,0,0,0,0,0,0,0] },
  { descricao: "FARMÁCIA (Itaú)",  categoria: "Saúde",       forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 11, vals: [83.73,83.73,83.73,83.73,0,0,0,0,0,0,0,0] },
  { descricao: "ACADEMIA (Itaú)",  categoria: "Saúde",       forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 12, vals: [666.25,666.25,666.25,666.25,0,0,0,0,0,0,0,0] },
  { descricao: "THE WALKING DEAD", categoria: "Lazer",       forma: "Cartão", cartaoId: "k2", recorrencia: "Indeterminada", diaVenc: 20, vals: [72.98,72.98,72.98,72.98,0,0,0,0,0,0,0,0] },
  { descricao: "SUPERMERCADO",     categoria: "Alimentação", forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 14, vals: [212.9,212.9,212.9,212.9,0,0,0,0,0,0,0,0] },
  { descricao: "EPA (Itaú)",       categoria: "Alimentação", forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 18, vals: [197.78,197.78,197.78,197.78,0,0,0,0,0,0,0,0] },
  { descricao: "PADARIA (Itaú)",   categoria: "Alimentação", forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 19, vals: [72.25,72.25,72.25,72.25,0,0,0,0,0,0,0,0] },
  { descricao: "IFOOD/LANCHE",     categoria: "Alimentação", forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 20, vals: [312.22,312.22,312.22,312.22,0,0,0,0,0,0,0,0] },
  { descricao: "ALMOÇO (Itaú)",    categoria: "Alimentação", forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 21, vals: [251.68,251.68,251.68,251.68,0,0,0,0,0,0,0,0] },
  { descricao: "PAPAGUETI",        categoria: "Alimentação", forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 22, vals: [63.76,63.76,63.76,63.76,0,0,0,0,0,0,0,0] },
  { descricao: "LAZER",            categoria: "Lazer",       forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 23, vals: [502.21,502.21,502.21,502.21,0,0,0,0,0,0,0,0] },
  { descricao: "YOUTUBE PREMIUM",  categoria: "Lazer",       forma: "Cartão", cartaoId: "k2", recorrencia: "Indeterminada", diaVenc: 24, vals: [26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9,26.9] },
  { descricao: "MERCADO LIVRE",    categoria: "Tecnologia",  forma: "Cartão", cartaoId: "k2", recorrencia: "Única",         diaVenc: 25, vals: [94.45,94.45,94.45,0,0,0,0,0,0,0,0,0] },
  { descricao: "ANUIDADE",         categoria: "Tarifas",     forma: "Cartão", cartaoId: "k2", recorrencia: "Indeterminada", diaVenc: 15, vals: [80,80,80,80,80,80,80,80,0,0,0,0] },

  // ===== CARTÃO EMPRESTADO 💗 =====
  { descricao: "CELULAR GIZELE",     categoria: "Empréstimos", forma: "Cartão", cartaoId: "k3", recorrencia: "Periódica", recorrenciaMeses: 7, diaVenc: 10, emprestado: true, vals: [357.4,357.4,357.4,357.4,357.4,357.4,357.4,0,0,0,0,0] },
  { descricao: "ADOBE - NORUEGUÊS",  categoria: "Empréstimos", forma: "Cartão", cartaoId: "k3", recorrencia: "Indeterminada", diaVenc: 11, emprestado: true, vals: [189,189,189,189,189,189,189,189,189,189,189,189] },
  { descricao: "LUDS - CADEIRA GAMER", categoria: "Empréstimos", forma: "Cartão", cartaoId: "k3", recorrencia: "Periódica", recorrenciaMeses: 4, diaVenc: 12, emprestado: true, vals: [0,0,377.05,377.05,377.05,377.05,0,0,0,0,0,0] },
];

const seed = {
  contas: [
    { id: "c1", nome: "Conta Principal", banco: "Itaú", tipo: "Corrente", saldoInicial: 0, cor: "#EC7000" },
  ] as ContaBancaria[],
  receitas: MESES_2026.map((m, i) => ({
    id: `r${i + 1}`, fonte: "Salário", categoria: "Salário", valor: 7000, contaId: "c1", mesRef: m, recorrencia: "Mensal" as const,
  })),
  cartoes: [
    { id: "k1", nome: "Cartão Inter", banco: "Inter", bandeira: "Mastercard", cor: "#FF7A00", limite: 5000, diaVencimento: 10 },
    { id: "k2", nome: "Cartão Itaú", banco: "Itaú", bandeira: "Visa", cor: "#0F2A5F", limite: 8000, diaVencimento: 15 },
    { id: "k3", nome: "Cartão Emprestado", banco: "Nubank", bandeira: "Mastercard", cor: "#820AD1", limite: 3000, diaVencimento: 5 },
  ] as Cartao[],
  despesas: gerarDespesas("d", despesasRows),
  investimentos: [
    { id: "i1", nome: "Bradesco Zup", tipo: "Renda Fixa", valorInicial: 5981.50, aporteMensal: 1000, saldoAtual: 5981.50, inicio: "2024-01-01", taxaMensal: 1.0 },
  ] as Investimento[],
  consorcios: [
    {
      id: "cs1",
      bem: "Imóvel",
      administradora: "Porto Seguro",
      valorCarta: 200000,
      prazoMeses: 200,
      parcelaCheia: 1220,
      taxaAdmin: 22,
      inicio: "2024-01-10",
      diaVencimento: 10,
      debitoAutomatico: false,
      contemplado: false,
      pagamentoReduzido: true,
      percentualReducao: 0.5,
      parcelas: gerarParcelas({ prazoMeses: 200, parcelaCheia: 1220, inicio: "2024-01-10", diaVencimento: 10, pagamentoReduzido: true, percentualReducao: 0.5 }),
    },
    {
      id: "cs2",
      bem: "Veículo",
      administradora: "Ademicon",
      valorCarta: 100000,
      prazoMeses: 120,
      parcelaCheia: 1017,
      taxaAdmin: 22,
      inicio: "2024-06-15",
      diaVencimento: 15,
      debitoAutomatico: false,
      contemplado: false,
      pagamentoReduzido: true,
      percentualReducao: 0.5,
      parcelas: gerarParcelas({ prazoMeses: 120, parcelaCheia: 1017, inicio: "2024-06-15", diaVencimento: 15, pagamentoReduzido: true, percentualReducao: 0.5 }),
    },
  ] as Consorcio[],
  bens: [
    { id: "b1", nome: "LUDS - Cadeira Gamer", tipo: "Outros", valorCompra: 18000, valorMercado: 17500, anosUso: 1, dividaRestante: 0 },
  ] as Bem[],
};

// Helper to generate parcelas for consorcio
export function gerarParcelas(
  c: Pick<Consorcio, "prazoMeses" | "parcelaCheia" | "inicio" | "diaVencimento"> & {
    pagamentoReduzido?: boolean;
    percentualReducao?: number;
  }
): ParcelaConsorcio[] {
  const out: ParcelaConsorcio[] = [];
  const start = new Date(c.inicio);
  const reducao = c.pagamentoReduzido === false ? 1 : (c.percentualReducao ?? 0.5);
  const valorReduzido = c.parcelaCheia * reducao;
  for (let i = 0; i < c.prazoMeses; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, c.diaVencimento);
    out.push({
      numero: i + 1,
      valor: valorReduzido,
      dataVenc: d.toISOString().slice(0, 10),
      status: "Futuro",
      contemplado: false,
    });
  }
  return out;
}

// ===== Bucket: dados por usuário =====
type Bucket = {
  contas: ContaBancaria[];
  receitas: Receita[];
  despesas: Despesa[];
  cartoes: Cartao[];
  investimentos: Investimento[];
  consorcios: Consorcio[];
  bens: Bem[];
};

const emptyBucket = (): Bucket => ({
  contas: [], receitas: [], despesas: [], cartoes: [], investimentos: [], consorcios: [], bens: [],
});

const victorBucket: Bucket = {
  contas: seed.contas,
  receitas: seed.receitas,
  despesas: seed.despesas,
  cartoes: seed.cartoes,
  investimentos: seed.investimentos,
  consorcios: seed.consorcios,
  bens: seed.bens,
};

type StateExt = State & {
  _buckets: Record<string, Bucket>;
  _active: string | null;
  setUser: (login: string | null) => void;
};

// Helper para atualizar topo + bucket
function withBucket<K extends keyof Bucket>(s: StateExt, key: K, val: Bucket[K]): Partial<StateExt> {
  if (!s._active) return { [key]: val } as any;
  return {
    [key]: val,
    _buckets: { ...s._buckets, [s._active]: { ...(s._buckets[s._active] ?? emptyBucket()), [key]: val } },
  } as any;
}

export const useStore = create<StateExt>()(
  persist(
    (set, get) => ({
      contas: [],
      receitas: [],
      despesas: [],
      cartoes: [],
      investimentos: [],
      consorcios: [],
      bens: [],

      _buckets: { victor: victorBucket },
      _active: null,

      setUser: (login) => {
        const s = get();
        // Salvar dados atuais no bucket atual
        const buckets = { ...s._buckets };
        if (s._active) {
          buckets[s._active] = {
            contas: s.contas, receitas: s.receitas, despesas: s.despesas,
            cartoes: s.cartoes, investimentos: s.investimentos, consorcios: s.consorcios, bens: s.bens,
          };
        }
        if (login === null) {
          set({ _buckets: buckets, _active: null });
          return;
        }
        // Carregar bucket do novo usuário (vazio se não existir)
        const target = buckets[login] ?? emptyBucket();
        buckets[login] = target;
        set({
          _buckets: buckets,
          _active: login,
          contas: target.contas,
          receitas: target.receitas,
          despesas: target.despesas,
          cartoes: target.cartoes,
          investimentos: target.investimentos,
          consorcios: target.consorcios,
          bens: target.bens,
        });
      },

      addConta: (c) => set((s) => withBucket(s, "contas", [...s.contas, { ...c, id: uid() }])),
      updateConta: (id, c) => set((s) => withBucket(s, "contas", s.contas.map((x) => (x.id === id ? { ...x, ...c } : x)))),
      removeConta: (id) => set((s) => withBucket(s, "contas", s.contas.filter((x) => x.id !== id))),

      addReceita: (r) => set((s) => withBucket(s, "receitas", [...s.receitas, { ...r, id: uid() }])),
      updateReceita: (id, r) => set((s) => withBucket(s, "receitas", s.receitas.map((x) => (x.id === id ? { ...x, ...r } : x)))),
      removeReceita: (id) => set((s) => withBucket(s, "receitas", s.receitas.filter((x) => x.id !== id))),

      addDespesa: (d) => set((s) => withBucket(s, "despesas", [...s.despesas, { ...d, id: uid() }])),
      updateDespesa: (id, d) => set((s) => withBucket(s, "despesas", s.despesas.map((x) => (x.id === id ? { ...x, ...d } : x)))),
      removeDespesa: (id) => set((s) => withBucket(s, "despesas", s.despesas.filter((x) => x.id !== id))),

      addCartao: (c) => set((s) => withBucket(s, "cartoes", [...s.cartoes, { ...c, id: uid() }])),
      updateCartao: (id, c) => set((s) => withBucket(s, "cartoes", s.cartoes.map((x) => (x.id === id ? { ...x, ...c } : x)))),
      removeCartao: (id) => set((s) => withBucket(s, "cartoes", s.cartoes.filter((x) => x.id !== id))),
      marcarFaturaPaga: (id, mes) =>
        set((s) => withBucket(s, "cartoes", s.cartoes.map((x) => (x.id === id ? { ...x, faturaPagaMes: mes } : x)))),

      addInvestimento: (i) => set((s) => withBucket(s, "investimentos", [...s.investimentos, { ...i, id: uid() }])),
      updateInvestimento: (id, i) => set((s) => withBucket(s, "investimentos", s.investimentos.map((x) => (x.id === id ? { ...x, ...i } : x)))),
      removeInvestimento: (id) => set((s) => withBucket(s, "investimentos", s.investimentos.filter((x) => x.id !== id))),

      addConsorcio: (c) => {
        const parcelas = c.parcelas ?? gerarParcelas(c);
        set((s) => withBucket(s, "consorcios", [...s.consorcios, { ...c, id: uid(), parcelas }]));
      },
      updateConsorcio: (id, c) =>
        set((s) =>
          withBucket(
            s,
            "consorcios",
            s.consorcios.map((x) => {
              if (x.id !== id) return x;
              const merged: Consorcio = { ...x, ...c };

              // Se mudou valorCarta, parcelaCheia, taxaAdmin, percentualReducao ou pagamentoReduzido,
              // recalcula o valor das parcelas NÃO pagas — preservando o valor histórico das pagas.
              const fieldsThatRecalc: (keyof Consorcio)[] = [
                "valorCarta",
                "parcelaCheia",
                "taxaAdmin",
                "percentualReducao",
                "pagamentoReduzido",
                "contemplado",
              ];
              const mudou = fieldsThatRecalc.some((k) => k in c && (c as any)[k] !== (x as any)[k]);
              if (!mudou) return merged;

              const reducao = merged.pagamentoReduzido === false ? 1 : (merged.percentualReducao ?? 0.5);

              // Se já contemplado: parcelas restantes valem (totalDevido - pago) / restantes
              // Caso contrário: valor reduzido = parcelaCheia * reducao
              const pagas = merged.parcelas.filter((p) => p.status === "Pago");
              const totalPago = pagas.reduce((acc, p) => acc + p.valor, 0);
              const restantes = merged.parcelas.filter((p) => p.status !== "Pago");

              let novoValorNaoPaga: number;
              if (merged.contemplado && restantes.length > 0) {
                const totalDevido = merged.valorCarta * (1 + merged.taxaAdmin / 100);
                novoValorNaoPaga = Math.max(0, (totalDevido - totalPago) / restantes.length);
              } else {
                novoValorNaoPaga = merged.parcelaCheia * reducao;
              }

              merged.parcelas = merged.parcelas.map((p) =>
                p.status === "Pago" ? p : { ...p, valor: novoValorNaoPaga }
              );
              return merged;
            })
          )
        ),
      removeConsorcio: (id) => set((s) => withBucket(s, "consorcios", s.consorcios.filter((x) => x.id !== id))),
      updateParcela: (consorcioId, numero, p) =>
        set((s) => withBucket(
          s,
          "consorcios",
          s.consorcios.map((c) => {
            if (c.id !== consorcioId) return c;
            const propagaContemplado = p.contemplado === true;
            let novasParcelas = c.parcelas.map((pp) => {
              if (pp.numero === numero) return { ...pp, ...p };
              if (propagaContemplado && pp.numero > numero) return { ...pp, contemplado: true };
              return pp;
            });

            // Se contemplou agora: recalcular valor das parcelas restantes
            // novoValor = (totalDevido - totalJaPago) / parcelasRestantes
            if (propagaContemplado) {
              const totalDevido = c.valorCarta * (1 + c.taxaAdmin / 100);
              const pagas = novasParcelas.filter((x) => x.status === "Pago");
              const totalPago = pagas.reduce((acc, x) => acc + x.valor, 0);
              const restantes = novasParcelas.filter((x) => x.status !== "Pago");
              if (restantes.length > 0) {
                const novoValor = Math.max(0, (totalDevido - totalPago) / restantes.length);
                novasParcelas = novasParcelas.map((x) =>
                  x.status !== "Pago" ? { ...x, valor: novoValor } : x
                );
              }
            }
            return {
              ...c,
              parcelas: novasParcelas,
              contemplado: propagaContemplado ? true : c.contemplado,
            };
          })
        )),

      desmarcarContempladosTodos: (consorcioId) =>
        set((s) => withBucket(
          s,
          "consorcios",
          s.consorcios.map((c) => {
            if (c.id !== consorcioId) return c;
            const reducao = c.pagamentoReduzido === false ? 1 : (c.percentualReducao ?? 0.5);
            const valorReduzido = c.parcelaCheia * reducao;
            return {
              ...c,
              contemplado: false,
              parcelas: c.parcelas.map((p) => ({
                ...p,
                contemplado: false,
                // restaura valor reduzido apenas para parcelas ainda não pagas
                valor: p.status === "Pago" ? p.valor : valorReduzido,
              })),
            };
          })
        )),

      addBem: (b) => set((s) => withBucket(s, "bens", [...s.bens, { ...b, id: uid() }])),
      updateBem: (id, b) => set((s) => withBucket(s, "bens", s.bens.map((x) => (x.id === id ? { ...x, ...b } : x)))),
      removeBem: (id) => set((s) => withBucket(s, "bens", s.bens.filter((x) => x.id !== id))),

      resetSeed: () => {
        const s = get();
        if (s._active === "victor") {
          set({
            ...victorBucket,
            _buckets: { ...s._buckets, victor: victorBucket },
          });
        }
      },
    }),
    {
      name: "finance-saas-store",
      version: 7,
      migrate: (persisted: any, version) => {
        if (version < 7) {
          // força reseed do bucket victor com dados completos de 2026
          persisted._buckets = { ...(persisted?._buckets ?? {}), victor: victorBucket };
          if (persisted?._active === "victor") {
            Object.assign(persisted, victorBucket);
          }
        }
        return persisted;
      },
      // Sempre garantir que Victor tenha seed após reidratar
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state._buckets || !state._buckets.victor) {
          state._buckets = { ...(state._buckets ?? {}), victor: victorBucket };
        }
      },
    }
  )
);

// ===== Selectors / derived =====
export function usoCartao(cartaoId: string, despesas: Despesa[], cartaoFaturaPaga?: string) {
  return despesas
    .filter((d) => d.cartaoId === cartaoId)
    .filter((d) => !d.pago)
    .filter((d) => !cartaoFaturaPaga || d.mesRef > cartaoFaturaPaga)
    .reduce((s, d) => s + d.valor, 0);
}
