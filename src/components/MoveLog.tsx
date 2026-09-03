"use client";
import { useEffect, useRef } from "react";
import { useApp } from "@/lib/useApp";

export function MoveLog() {
  const st = useApp();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [st.moves.length]);

  const rows: { n: number; w?: (typeof st.moves)[number]; b?: (typeof st.moves)[number] }[] = [];
  const startsBlack = st.startFen.split(" ")[1] === "b";
  const base = Number(st.startFen.split(" ")[5] ?? 1);
  st.moves.forEach((m, i) => {
    const idx = startsBlack ? i + 1 : i;
    const n = base + Math.floor(idx / 2);
    if (idx % 2 === 0) rows.push({ n, w: m });
    else {
      const last = rows[rows.length - 1];
      if (last && last.n === n && !last.b) last.b = m;
      else rows.push({ n, b: m });
    }
  });

  if (rows.length === 0) return null;

  return (
    <details className="panel-surface group rounded-xl">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs text-slate-400 transition-colors hover:text-slate-200">
        <span>Move history</span>
        <span className="text-slate-600">{st.moves.length}</span>
        <span className="ml-auto text-[9px] text-slate-600 transition-transform group-open:rotate-180">↓</span>
      </summary>
      <div ref={ref} className="max-h-48 overflow-y-auto border-t border-white/[0.06] px-4 py-3 font-mono text-sm">
        <table className="w-full">
          <tbody>
            {rows.map((r) => (
              <tr key={r.n} className="border-b border-white/[0.04] last:border-0">
                <td className="w-9 py-1 text-slate-600">{r.n}.</td>
                <td className="py-1"><MoveCell m={r.w} /></td>
                <td className="py-1"><MoveCell m={r.b} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function MoveCell({ m }: { m?: { san: string; by: string; flags: string[] } }) {
  if (!m) return <span className="text-slate-700">…</span>;
  const tone = m.by === "player" ? "text-slate-100" : m.by === "agent" ? "text-emerald-300" : "text-sky-300";
  return (
    <span className={tone} title={`by ${m.by}`}>
      {m.san}
    </span>
  );
}
