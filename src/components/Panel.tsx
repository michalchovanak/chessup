import type { ReactNode } from "react";

export function Panel({ title, badge, children, action, className = "" }: { title: string; badge?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/[0.06] bg-[var(--panel)] ${className}`}>
      <header className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</h2>
        {badge}
        <div className="ml-auto">{action}</div>
      </header>
      <div className="px-4 pb-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500 leading-relaxed">{children}</p>;
}
