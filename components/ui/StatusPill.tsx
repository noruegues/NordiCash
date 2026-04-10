export type Status = "PAGO" | "PENDENTE" | "FUTURO";

const styles: Record<Status, string> = {
  PAGO: "bg-accent/15 text-accent border-accent/30",
  PENDENTE: "bg-warn/15 text-warn border-warn/30",
  FUTURO: "bg-zinc-700/30 text-zinc-400 border-zinc-700",
};

export default function StatusPill({
  value,
  onChange,
}: {
  value: Status;
  onChange?: (v: Status) => void;
}) {
  if (!onChange) {
    return <span className={`text-xs px-2.5 py-1 rounded-full border ${styles[value]}`}>{value}</span>;
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`text-xs px-2.5 py-1 rounded-full border bg-transparent outline-none cursor-pointer ${styles[value]}`}
    >
      <option value="PAGO">PAGO</option>
      <option value="PENDENTE">PENDENTE</option>
      <option value="FUTURO">FUTURO</option>
    </select>
  );
}
