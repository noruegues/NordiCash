"use client";
import { useState, useRef, useEffect } from "react";
import { Download, FileText, Table } from "lucide-react";

export default function ExportButton({ onExportPDF, onExportExcel }: {
  onExportPDF: () => void;
  onExportExcel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button className="btn btn-soft" onClick={() => setOpen(!open)}>
        <Download size={15} /> Exportar
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded shadow-lg z-30 min-w-[140px]">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-surface2 transition-colors"
            onClick={() => { onExportPDF(); setOpen(false); }}
          >
            <FileText size={14} className="text-red-400" /> PDF
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-surface2 transition-colors"
            onClick={() => { onExportExcel(); setOpen(false); }}
          >
            <Table size={14} className="text-green-400" /> Excel
          </button>
        </div>
      )}
    </div>
  );
}
