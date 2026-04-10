"use client";
import { formatBRLNumber, parseBRLDigits } from "@/lib/format";
import { useEffect, useState } from "react";

export default function MoneyInput({
  value,
  onChange,
  required,
  className = "",
  placeholder = "R$ 0,00",
  id,
  name,
}: {
  value: number;
  onChange: (n: number) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  name?: string;
}) {
  const [text, setText] = useState<string>(value ? formatBRLNumber(value) : "");

  useEffect(() => {
    setText(value ? formatBRLNumber(value) : "");
  }, [value]);

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-medium pointer-events-none select-none">R$</span>
      <input
        id={id}
        name={name}
        inputMode="numeric"
        className="input !pl-9"
        placeholder={placeholder}
        required={required}
        value={text}
        onChange={(e) => {
          const n = parseBRLDigits(e.target.value);
          setText(n ? formatBRLNumber(n) : "");
          onChange(n);
        }}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}
