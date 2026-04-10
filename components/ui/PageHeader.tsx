import { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
      <div>
        {subtitle && <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{subtitle}</div>}
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-100 mt-1">{title}</h1>
      </div>
      {action}
    </div>
  );
}
