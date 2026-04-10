"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import Landing from "@/components/auth/Landing";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import WelcomePopup from "@/components/WelcomePopup";
import AvisosPopup from "@/components/AvisosPopup";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const fetchMe = useAuth((s) => s.fetchMe);
  const loadAll = useStore((s) => s.loadAll);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  // Ao montar, verifica sessão no servidor
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Quando usuário loga, carrega dados do banco
  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  if (!hydrated || loading) {
    return <div className="min-h-screen bg-bg" />;
  }

  if (!user) return <Landing />;

  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  return (
    <div className="md:flex">
      <Sidebar mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />
      <div className="flex-1 min-h-screen min-w-0">
        <Topbar onOpenSidebar={() => setMobileNav(true)} />
        <main className="p-3 sm:p-6 max-w-[1600px] mx-auto">{children}</main>
      </div>
      <WelcomePopup />
      <AvisosPopup />
    </div>
  );
}
