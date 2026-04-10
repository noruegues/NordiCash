"use client";
import { brl } from "@/lib/format";

type ExportColumn = { header: string; key: string; format?: "brl" | "date" | "text" };
type ExportOptions = {
  title: string;
  period?: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, number>;
  filename: string;
};

function formatCell(value: unknown, format?: string): string {
  if (value == null) return "";
  if (format === "brl" && typeof value === "number") return brl(value);
  return String(value);
}

export async function exportPDF(opts: ExportOptions) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();

  // Header
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(`NordiCash — ${opts.title}`, 14, 18);

  if (opts.period) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Período: ${opts.period}`, 14, 26);
  }

  const startY = opts.period ? 32 : 26;

  const headers = opts.columns.map((c) => c.header);
  const body = opts.rows.map((row) =>
    opts.columns.map((c) => formatCell(row[c.key], c.format))
  );

  // Totais
  if (opts.totals) {
    const totalRow = opts.columns.map((c) => {
      if (c.key in (opts.totals ?? {})) return brl(opts.totals![c.key]);
      if (c === opts.columns[0]) return "TOTAL";
      return "";
    });
    body.push(totalRow);
  }

  autoTable(doc, {
    startY,
    head: [headers],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    didParseCell: (data: any) => {
      if (opts.totals && data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [230, 230, 240];
      }
    },
  });

  // Footer
  const pageCount = (doc as any).getNumberOfPages?.() ?? doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(
      `Gerado por NordiCash em ${new Date().toLocaleDateString("pt-BR")} — Página ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${opts.filename}.pdf`);
}

export async function exportExcel(opts: ExportOptions) {
  const XLSX = await import("xlsx");

  const headers = opts.columns.map((c) => c.header);
  const data = opts.rows.map((row) =>
    opts.columns.map((c) => {
      const val = row[c.key];
      if (c.format === "brl" && typeof val === "number") return val;
      return val ?? "";
    })
  );

  // Totais
  if (opts.totals) {
    const totalRow = opts.columns.map((c) => {
      if (c.key in (opts.totals ?? {})) return opts.totals![c.key];
      if (c === opts.columns[0]) return "TOTAL";
      return "";
    });
    data.push(totalRow);
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Ajustar largura de colunas
  ws["!cols"] = opts.columns.map((c) => ({
    wch: Math.max(c.header.length, c.format === "brl" ? 15 : 20),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, opts.title.slice(0, 31));
  XLSX.writeFile(wb, `${opts.filename}.xlsx`);
}
