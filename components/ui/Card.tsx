import { ReactNode } from "react";

export function Card({
  children,
  title,
  action,
  className = "",
  bodyClassName = "",
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = !!(title || action);
  return (
    <section className={`card ${className}`}>
      {hasHeader && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {action}
        </div>
      )}
      <div className={`card-body ${bodyClassName}`}>{children}</div>
    </section>
  );
}
