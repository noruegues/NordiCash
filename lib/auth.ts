"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Plano = "Free" | "Pro" | "Premium";

export type User = {
  login: string;
  senha: string;
  nome: string;
  email?: string;
  avatar?: string; // dataURL
  plano: Plano;
  createdAt: string;
  welcomeSeen?: boolean;
};

type AuthState = {
  users: User[];
  currentLogin: string | null;
  theme: "dark" | "light";
  showWelcome: boolean;

  login: (login: string, senha: string) => { ok: boolean; error?: string };
  logout: () => void;
  signup: (data: Omit<User, "createdAt">) => { ok: boolean; error?: string };
  updateProfile: (patch: Partial<User>) => void;
  changePassword: (atual: string, nova: string) => { ok: boolean; error?: string };
  changeLogin: (novo: string) => { ok: boolean; error?: string };
  setPlano: (plano: Plano) => void;
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
  dismissWelcome: () => void;
};

const seedUser: User = {
  login: "victor",
  senha: "1234",
  nome: "Victor Hugo",
  email: "victor@nordicash.app",
  avatar: undefined,
  plano: "Premium",
  createdAt: "2026-01-01",
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [seedUser],
      currentLogin: null,
      theme: "dark",
      showWelcome: false,

      login: (login, senha) => {
        const u = get().users.find((x) => x.login === login.trim());
        if (!u) return { ok: false, error: "Usuário não encontrado" };
        if (u.senha !== senha) return { ok: false, error: "Senha incorreta" };
        set({ currentLogin: u.login, showWelcome: !u.welcomeSeen });
        return { ok: true };
      },

      logout: () => set({ currentLogin: null, showWelcome: false }),

      signup: (data) => {
        if (get().users.some((u) => u.login === data.login.trim())) {
          return { ok: false, error: "Usuário já existe" };
        }
        const novo: User = { ...data, createdAt: new Date().toISOString().slice(0, 10) };
        set((s) => ({ users: [...s.users, novo], currentLogin: novo.login, showWelcome: true }));
        return { ok: true };
      },

      updateProfile: (patch) =>
        set((s) => ({
          users: s.users.map((u) => (u.login === s.currentLogin ? { ...u, ...patch } : u)),
        })),

      changePassword: (atual, nova) => {
        const s = get();
        const u = s.users.find((x) => x.login === s.currentLogin);
        if (!u) return { ok: false, error: "Não autenticado" };
        if (u.senha !== atual) return { ok: false, error: "Senha atual incorreta" };
        if (!nova || nova.length < 4) return { ok: false, error: "Senha muito curta" };
        set({ users: s.users.map((x) => (x.login === u.login ? { ...x, senha: nova } : x)) });
        return { ok: true };
      },

      changeLogin: (novo) => {
        const s = get();
        if (!novo.trim()) return { ok: false, error: "Login inválido" };
        if (s.users.some((u) => u.login === novo && u.login !== s.currentLogin)) {
          return { ok: false, error: "Login já em uso" };
        }
        set({
          users: s.users.map((u) => (u.login === s.currentLogin ? { ...u, login: novo } : u)),
          currentLogin: novo,
        });
        return { ok: true };
      },

      setPlano: (plano) =>
        set((s) => ({
          users: s.users.map((u) => (u.login === s.currentLogin ? { ...u, plano } : u)),
        })),

      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("light", t === "light");
        }
      },

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },

      dismissWelcome: () =>
        set((s) => ({
          showWelcome: false,
          users: s.users.map((u) => (u.login === s.currentLogin ? { ...u, welcomeSeen: true } : u)),
        })),
    }),
    {
      name: "finance-saas-auth",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.classList.toggle("light", state.theme === "light");
        }
      },
    }
  )
);

export function useCurrentUser(): User | null {
  const { users, currentLogin } = useAuth();
  return users.find((u) => u.login === currentLogin) ?? null;
}

// Limites por plano
export const PLAN_LIMITS: Record<Plano, { contas: number; cartoes: number }> = {
  Free: { contas: 2, cartoes: 2 },
  Pro: { contas: Infinity, cartoes: Infinity },
  Premium: { contas: Infinity, cartoes: Infinity },
};

export function getPlanLimit(plano: Plano, key: "contas" | "cartoes") {
  return PLAN_LIMITS[plano][key];
}
