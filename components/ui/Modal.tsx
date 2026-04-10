"use client";
import { ReactNode } from "react";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="modal-backdrop">
      <div className={`modal-panel ${sizes[size]}`}>
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100"><X size={18} /></button>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}
