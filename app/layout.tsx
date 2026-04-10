import "./globals.css";
import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "NordiCash · Finance SaaS",
  description: "NordiCash — gestão financeira pessoal completa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-bg text-zinc-100 min-h-screen">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
