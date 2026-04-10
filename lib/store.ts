"use client";
import { create } from "zustand";

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
  mesRef: string;
  recorrencia: "Mensal" | "Única";
};

export type Despesa = {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  mesRef: string;
  forma: FormaPagamento;
  contaId?: string;
  cartaoId?: string;
  recorrencia: RecorrenciaTipo;
  recorrenciaMeses?: number;
  emprestado?: boolean;
  pago?: boolean;
};

export type Cartao = {
  id: string;
  nome: string;
  banco: string;
  bandeira: Bandeira;
  cor: string;
  limite: number;
  diaVencimento: number;
  faturaPagaMes?: string;
};

export type Investimento = {
  id: string;
  nome: string;
  tipo: "Renda Fixa" | "Ações" | "FIIs" | "Cripto" | "Tesouro" | "Fundo";
  valorInicial: number;
  aporteMensal: number;
  saldoAtual: number;
  inicio: string;
  taxaMensal?: number;
};

export type ParcelaConsorcio = {
  id?: string;
  numero: number;
  valor: number;
  dataVenc?: string;
  mesRef?: string;
  status?: StatusParcela;
  paga?: boolean;
  contemplado?: boolean;
};

export type Consorcio = {
  id: string;
  bem: string;
  administradora: string;
  valorCarta: number;
  prazoMeses: number;
  parcelaCheia: number;
  taxaAdmin: number;
  inicio: string;
  diaVencimento: number;
  debitoAutomatico: boolean;
  contaId?: string;
  contemplado: boolean;
  pagamentoReduzido?: boolean;
  percentualReducao?: number;
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
  taxaAnual?: number;
  comportamento?: "valoriza" | "desvaloriza";
};

// ===== Helpers =====
async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const opts: RequestInit = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// ===== State =====
type State = {
  contas: ContaBancaria[];
  receitas: Receita[];
  despesas: Despesa[];
  cartoes: Cartao[];
  investimentos: Investimento[];
  consorcios: Consorcio[];
  bens: Bem[];
  loaded: boolean;

  loadAll: () => Promise<void>;
  clearAll: () => void;

  addConta: (c: Omit<ContaBancaria, "id">) => Promise<void>;
  updateConta: (id: string, c: Partial<ContaBancaria>) => Promise<void>;
  removeConta: (id: string) => Promise<void>;

  addReceita: (r: Omit<Receita, "id">) => Promise<void>;
  updateReceita: (id: string, r: Partial<Receita>) => Promise<void>;
  removeReceita: (id: string) => Promise<void>;

  addDespesa: (d: Omit<Despesa, "id">) => Promise<void>;
  updateDespesa: (id: string, d: Partial<Despesa>) => Promise<void>;
  removeDespesa: (id: string) => Promise<void>;

  addCartao: (c: Omit<Cartao, "id">) => Promise<void>;
  updateCartao: (id: string, c: Partial<Cartao>) => Promise<void>;
  removeCartao: (id: string) => Promise<void>;
  marcarFaturaPaga: (id: string, mes: string) => Promise<void>;

  addInvestimento: (i: Omit<Investimento, "id">) => Promise<void>;
  updateInvestimento: (id: string, i: Partial<Investimento>) => Promise<void>;
  removeInvestimento: (id: string) => Promise<void>;

  addConsorcio: (c: Omit<Consorcio, "id">) => Promise<void>;
  updateConsorcio: (id: string, c: Partial<Consorcio>) => Promise<void>;
  removeConsorcio: (id: string) => Promise<void>;
  updateParcela: (consorcioId: string, numero: number, p: Partial<ParcelaConsorcio>) => void;
  desmarcarContempladosTodos: (consorcioId: string) => void;

  addBem: (b: Omit<Bem, "id">) => Promise<void>;
  updateBem: (id: string, b: Partial<Bem>) => Promise<void>;
  removeBem: (id: string) => Promise<void>;
};

export const useStore = create<State>()((set, get) => ({
  contas: [],
  receitas: [],
  despesas: [],
  cartoes: [],
  investimentos: [],
  consorcios: [],
  bens: [],
  loaded: false,

  loadAll: async () => {
    const [contas, receitas, despesas, cartoes, investimentos, consorcios, bens] = await Promise.all([
      api<ContaBancaria[]>("/api/contas"),
      api<Receita[]>("/api/receitas"),
      api<Despesa[]>("/api/despesas"),
      api<Cartao[]>("/api/cartoes"),
      api<Investimento[]>("/api/investimentos"),
      api<Consorcio[]>("/api/consorcios"),
      api<Bem[]>("/api/bens"),
    ]);
    set({ contas, receitas, despesas, cartoes, investimentos, consorcios, bens, loaded: true });
  },

  clearAll: () => set({ contas: [], receitas: [], despesas: [], cartoes: [], investimentos: [], consorcios: [], bens: [], loaded: false }),

  // Contas
  addConta: async (c) => {
    const conta = await api<ContaBancaria>("/api/contas", "POST", c);
    set((s) => ({ contas: [conta, ...s.contas] }));
  },
  updateConta: async (id, c) => {
    await api("/api/contas", "PATCH", { id, ...c });
    set((s) => ({ contas: s.contas.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  },
  removeConta: async (id) => {
    await api("/api/contas", "DELETE", { id });
    set((s) => ({ contas: s.contas.filter((x) => x.id !== id) }));
  },

  // Receitas
  addReceita: async (r) => {
    const receita = await api<Receita>("/api/receitas", "POST", r);
    set((s) => ({ receitas: [receita, ...s.receitas] }));
  },
  updateReceita: async (id, r) => {
    await api("/api/receitas", "PATCH", { id, ...r });
    set((s) => ({ receitas: s.receitas.map((x) => (x.id === id ? { ...x, ...r } : x)) }));
  },
  removeReceita: async (id) => {
    await api("/api/receitas", "DELETE", { id });
    set((s) => ({ receitas: s.receitas.filter((x) => x.id !== id) }));
  },

  // Despesas
  addDespesa: async (d) => {
    const despesa = await api<Despesa>("/api/despesas", "POST", d);
    set((s) => ({ despesas: [despesa, ...s.despesas] }));
  },
  updateDespesa: async (id, d) => {
    await api("/api/despesas", "PATCH", { id, ...d });
    set((s) => ({ despesas: s.despesas.map((x) => (x.id === id ? { ...x, ...d } : x)) }));
  },
  removeDespesa: async (id) => {
    await api("/api/despesas", "DELETE", { id });
    set((s) => ({ despesas: s.despesas.filter((x) => x.id !== id) }));
  },

  // Cartões
  addCartao: async (c) => {
    const cartao = await api<Cartao>("/api/cartoes", "POST", c);
    set((s) => ({ cartoes: [cartao, ...s.cartoes] }));
  },
  updateCartao: async (id, c) => {
    await api("/api/cartoes", "PATCH", { id, ...c });
    set((s) => ({ cartoes: s.cartoes.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  },
  removeCartao: async (id) => {
    await api("/api/cartoes", "DELETE", { id });
    set((s) => ({ cartoes: s.cartoes.filter((x) => x.id !== id) }));
  },
  marcarFaturaPaga: async (id, mes) => {
    await api("/api/cartoes", "PATCH", { id, faturaPagaMes: mes });
    set((s) => ({ cartoes: s.cartoes.map((x) => (x.id === id ? { ...x, faturaPagaMes: mes } : x)) }));
  },

  // Investimentos
  addInvestimento: async (i) => {
    const inv = await api<Investimento>("/api/investimentos", "POST", i);
    set((s) => ({ investimentos: [inv, ...s.investimentos] }));
  },
  updateInvestimento: async (id, i) => {
    await api("/api/investimentos", "PATCH", { id, ...i });
    set((s) => ({ investimentos: s.investimentos.map((x) => (x.id === id ? { ...x, ...i } : x)) }));
  },
  removeInvestimento: async (id) => {
    await api("/api/investimentos", "DELETE", { id });
    set((s) => ({ investimentos: s.investimentos.filter((x) => x.id !== id) }));
  },

  // Consórcios
  addConsorcio: async (c) => {
    const consorcio = await api<Consorcio>("/api/consorcios", "POST", c);
    set((s) => ({ consorcios: [consorcio, ...s.consorcios] }));
  },
  updateConsorcio: async (id, c) => {
    await api("/api/consorcios", "PATCH", { id, ...c });
    set((s) => ({ consorcios: s.consorcios.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
  },
  removeConsorcio: async (id) => {
    await api("/api/consorcios", "DELETE", { id });
    set((s) => ({ consorcios: s.consorcios.filter((x) => x.id !== id) }));
  },
  updateParcela: (consorcioId, numero, p) => {
    set((s) => ({
      consorcios: s.consorcios.map((c) => {
        if (c.id !== consorcioId) return c;
        return { ...c, parcelas: c.parcelas.map((pp) => (pp.numero === numero ? { ...pp, ...p } : pp)) };
      }),
    }));
    // Sync to API
    const consorcio = get().consorcios.find((c) => c.id === consorcioId);
    if (consorcio) api("/api/consorcios", "PATCH", { id: consorcioId, parcelas: consorcio.parcelas });
  },
  desmarcarContempladosTodos: (consorcioId) => {
    set((s) => ({
      consorcios: s.consorcios.map((c) => {
        if (c.id !== consorcioId) return c;
        return {
          ...c,
          contemplado: false,
          parcelas: c.parcelas.map((p) => ({ ...p, contemplado: false })),
        };
      }),
    }));
    const consorcio = get().consorcios.find((c) => c.id === consorcioId);
    if (consorcio) api("/api/consorcios", "PATCH", { id: consorcioId, contemplado: false, parcelas: consorcio.parcelas });
  },

  // Bens
  addBem: async (b) => {
    const bem = await api<Bem>("/api/bens", "POST", b);
    set((s) => ({ bens: [bem, ...s.bens] }));
  },
  updateBem: async (id, b) => {
    await api("/api/bens", "PATCH", { id, ...b });
    set((s) => ({ bens: s.bens.map((x) => (x.id === id ? { ...x, ...b } : x)) }));
  },
  removeBem: async (id) => {
    await api("/api/bens", "DELETE", { id });
    set((s) => ({ bens: s.bens.filter((x) => x.id !== id) }));
  },
}));

// ===== Helpers mantidos =====
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
      mesRef: d.toISOString().slice(0, 7),
      paga: false,
      contemplado: false,
    });
  }
  return out;
}

// ===== Selectors / derived =====
export function usoCartao(cartaoId: string, despesas: Despesa[], cartaoFaturaPaga?: string) {
  return despesas
    .filter((d) => d.cartaoId === cartaoId)
    .filter((d) => !d.pago)
    .filter((d) => !cartaoFaturaPaga || d.mesRef > cartaoFaturaPaga)
    .reduce((s, d) => s + d.valor, 0);
}
