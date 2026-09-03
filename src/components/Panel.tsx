import type { ReactNode } from "react";

export function Panel({ title, badge, children, action, className = "" }: { title: string; badge?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel-surface rounded-[20px] ${className}`}>
      <header className="flex items-center gap-2 px-4 pt-4 pb-2.5">
        <h2 className="text-[11px] font-medium text-slate-400">{title}</h2>
        {badge}
        <div className="ml-auto">{action}</div>
      </header>
      <div className="px-4 pb-4.5">{children}</div>
    </section>
  );
}
