"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Plano = "Free" | "Pro" | "Premium";

export type User = {
  id: string;
  login: string;
  nome: string;
  email?: string;
  avatar?: string;
  plano: Plano;
  isAdmin: boolean;
  theme: string;
  welcomeSeen: boolean;
  createdAt: string;
};

type AuthState = {
  user: User | null;
  theme: "dark" | "light";
  showWelcome: boolean;
  loading: boolean;

  login: (login: string, senha: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  signup: (data: { login: string; senha: string; nome: string; email?: string }) => Promise<{ ok: boolean; error?: string }>;
  fetchMe: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
  changePassword: (atual: string, nova: string) => Promise<{ ok: boolean; error?: string }>;
  setPlano: (plano: Plano) => void;
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
  dismissWelcome: () => Promise<void>;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      theme: "dark",
      showWelcome: false,
      loading: true,

      login: async (login, senha) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ login: login.trim(), senha }),
          });
          const data = await res.json();
          if (!res.ok) return { ok: false, error: data.error };
          set({ user: data.user, showWelcome: !data.user.welcomeSeen });
          return { ok: true };
        } catch {
          return { ok: false, error: "Erro de conexão" };
        }
      },

      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        set({ user: null, showWelcome: false });
      },

      signup: async (data) => {
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          if (!res.ok) return { ok: false, error: result.error };
          set({ user: result.user, showWelcome: true });
          return { ok: true };
        } catch {
          return { ok: false, error: "Erro de conexão" };
        }
      },

      fetchMe: async () => {
        try {
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          if (res.ok && data.user) {
            set({ user: data.user, loading: false });
          } else {
            set({ user: null, loading: false });
          }
        } catch {
          set({ user: null, loading: false });
        }
      },

      updateProfile: async (patch) => {
        const res = await fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (res.ok) set({ user: data.user });
      },

      changePassword: async (atual, nova) => {
        try {
          const res = await fetch("/api/auth/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ atual, nova }),
          });
          const data = await res.json();
          if (!res.ok) return { ok: false, error: data.error };
          return { ok: true };
        } catch {
          return { ok: false, error: "Erro de conexão" };
        }
      },

      setPlano: (plano) =>
        set((s) => (s.user ? { user: { ...s.user, plano } } : {})),

      setTheme: (t) => {
        set({ theme: t });
        get().updateProfile({ theme: t } as any);
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("light", t === "light");
        }
      },

      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        get().setTheme(next);
      },

      dismissWelcome: async () => {
        set({ showWelcome: false });
        await get().updateProfile({ welcomeSeen: true } as any);
      },
    }),
    {
      name: "finance-saas-auth",
      version: 2,
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== "undefined") {
          document.documentElement.classList.toggle("light", state.theme === "light");
        }
      },
    }
  )
);

export function useCurrentUser(): User | null {
  return useAuth((s) => s.user);
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
