"use client";
import { useCallback, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import { brl } from "@/lib/format";
import { parseFile, type ParsedRow } from "@/lib/import-parser";
import ComboboxCategoria from "@/components/ui/ComboboxCategoria";
import { Upload, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [filename, setFilename] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { addDespesa, addReceita, despesas, receitas } = useStore();

  const existingCategories = [...new Set([
    ...despesas.map((d) => d.categoria),
    ...receitas.map((r) => r.categoria),
  ])];

  const handleFile = useCallback((file: File) => {
    setError("");
    setDone(false);
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseFile(text, file.name);
      if (parsed.length === 0) {
        setError("Nenhuma transação encontrada no arquivo. Verifique o formato.");
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const toggleRow = (idx: number) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const toggleAll = () => {
    const allSelected = rows.every((r) => r.selected);
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const updateCategory = (idx: number, category: string) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, category } : r));
  };

  const selectedRows = rows.filter((r) => r.selected);
  const totalDespesas = selectedRows.filter((r) => r.type === "despesa").reduce((s, r) => s + r.value, 0);
  const totalReceitas = selectedRows.filter((r) => r.type === "receita").reduce((s, r) => s + r.value, 0);

  const handleImport = async () => {
    setImporting(true);
    try {
      for (const row of selectedRows) {
        const mesRef = row.date.slice(0, 7);
        if (row.type === "despesa") {
          await addDespesa({
            descricao: row.description,
            categoria: row.category,
            valor: row.value,
            data: row.date,
            mesRef,
            forma: "Pix",
            recorrencia: "Única",
            pago: true,
          });
        } else {
          await addReceita({
            fonte: row.description,
            categoria: row.category,
            valor: row.value,
            mesRef,
            recorrencia: "Única",
          });
        }
      }
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao importar");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setRows([]);
    setFilename("");
    setDone(false);
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Importar extrato" size="xl">
      {!rows.length && !done && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={32} className="mx-auto text-zinc-500 mb-3" />
          <p className="text-sm text-zinc-300 font-medium">Arraste seu extrato aqui ou clique para selecionar</p>
          <p className="text-xs text-zinc-500 mt-1">Formatos aceitos: CSV, OFX</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.ofx,.qfx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-danger bg-danger/10 rounded p-3 mt-3">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {done && (
        <div className="text-center py-8">
          <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
          <p className="text-lg font-semibold text-zinc-100">{selectedRows.length} lançamentos importados</p>
          <p className="text-sm text-zinc-500 mt-1">Os dados já aparecem nos módulos de despesas e receitas</p>
          <button className="btn btn-primary mt-4" onClick={handleClose}>Fechar</button>
        </div>
      )}

      {rows.length > 0 && !done && (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <FileText size={14} /> {filename} — {rows.length} transações
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-danger">{selectedRows.filter((r) => r.type === "despesa").length} despesas: {brl(totalDespesas)}</span>
              <span className="text-success">{selectedRows.filter((r) => r.type === "receita").length} receitas: {brl(totalReceitas)}</span>
            </div>
          </div>

          <div className="max-h-96 overflow-auto border border-border rounded">
            <table className="t">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={rows.every((r) => r.selected)} onChange={toggleAll} /></th>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className={row.selected ? "" : "opacity-40"}>
                    <td><input type="checkbox" checked={row.selected} onChange={() => toggleRow(idx)} /></td>
                    <td className="whitespace-nowrap text-xs">{row.date}</td>
                    <td className="text-sm max-w-[200px] truncate" title={row.description}>{row.description}</td>
                    <td>
                      <ComboboxCategoria
                        value={row.category}
                        onChange={(v) => updateCategory(idx, v)}
                        options={existingCategories}
                      />
                    </td>
                    <td>
                      <span className={`pill ${row.type === "despesa" ? "pill-danger" : "pill-success"}`}>
                        {row.type === "despesa" ? "Despesa" : "Receita"}
                      </span>
                    </td>
                    <td className={`text-right font-medium ${row.type === "despesa" ? "text-danger" : "text-success"}`}>
                      {brl(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <button className="btn btn-ghost" onClick={() => { setRows([]); setFilename(""); }}>Voltar</button>
            <button
              className="btn btn-primary"
              disabled={importing || selectedRows.length === 0}
              onClick={handleImport}
            >
              {importing ? "Importando..." : `Importar ${selectedRows.length} lançamentos`}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
