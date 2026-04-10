"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import Landing from "@/components/auth/Landing";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import WelcomePopup from "@/components/WelcomePopup";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const currentLogin = useAuth((s) => s.currentLogin);
  const setUser = useStore((s) => s.setUser);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  // Sincroniza o store de dados com o usuário logado
  useEffect(() => {
    setUser(currentLogin);
  }, [currentLogin, setUser]);

  if (!hydrated) {
    return <div className="min-h-screen bg-bg" />;
  }

  if (!currentLogin) return <Landing />;

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
    </div>
  );
}
