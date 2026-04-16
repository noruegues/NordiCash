"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  decimal?: boolean;
  allowNegative?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  id?: string;
  name?: string;
};

export default function NumberInput({
  value, onChange, decimal = false, allowNegative = false, required, placeholder, className = "", min, max, id, name,
}: Props) {
  const format = (n: number | undefined) => {
    if (n === undefined || n === null || Number.isNaN(n)) return "";
    return decimal ? String(n).replace(".", ",") : String(n);
  };
  const [text, setText] = useState(format(value));

  useEffect(() => {
    setText(format(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      className={`input ${className}`}
      required={required}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        let raw = e.target.value;
        const neg = allowNegative && raw.trim().startsWith("-");
        if (decimal) {
          raw = raw.replace(/[^\d,.]/g, "").replace(/\./g, ",");
          const first = raw.indexOf(",");
          if (first !== -1) raw = raw.slice(0, first + 1) + raw.slice(first + 1).replace(/,/g, "");
          const display = (neg ? "-" : "") + raw;
          setText(display);
          if (raw === "" || raw === ",") {
            onChange(neg ? undefined : undefined);
            return;
          }
          const parsed = parseFloat(raw.replace(",", ".")) * (neg ? -1 : 1);
          if (Number.isNaN(parsed)) {
            onChange(undefined);
            return;
          }
          let v = parsed;
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        } else {
          raw = raw.replace(/\D/g, "");
          const display = (neg ? "-" : "") + raw;
          setText(display);
          if (raw === "") {
            onChange(undefined);
            return;
          }
          let v = parseInt(raw, 10) * (neg ? -1 : 1);
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }
      }}
    />
  );
}
