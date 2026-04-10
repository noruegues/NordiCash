"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ComboboxCategoria({
  value,
  onChange,
  options,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const showNew = search.trim() && !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <input
          className="input pr-8"
          value={search}
          required={required}
          placeholder="Selecione ou digite..."
          onChange={(e) => { setSearch(e.target.value); setOpen(true); onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
          onClick={() => setOpen((v) => !v)}
          tabIndex={-1}
        >
          <ChevronDown size={14} />
        </button>
      </div>
      {open && (filtered.length > 0 || showNew) && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto bg-surface border border-border rounded shadow-lg">
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-surface2 transition ${o === value ? "text-primary font-medium" : "text-zinc-300"}`}
              onClick={() => { onChange(o); setSearch(o); setOpen(false); }}
            >
              {o}
            </button>
          ))}
          {showNew && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 transition border-t border-border"
              onClick={() => { onChange(search.trim()); setOpen(false); }}
            >
              + Criar &quot;{search.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
