"use client";
/**
 * The current exercise: a single puzzle set by the coach, or the progress of a drill
 * (a queue of puzzles served one by one). Shows goal, hint, progress and the retry /
 * skip actions; a summary card appears when a drill is complete.
 */
import { useState } from "react";
import { Panel } from "./Panel";
import { store } from "@/lib/store";
import { useApp } from "@/lib/useApp";

export function PuzzleCard() {
  const st = useApp();
  const [showHint, setShowHint] = useState(false);
  const p = st.puzzle;
  const d = st.drill;

  if (d && d.status === "done") {
    const solved = d.results.filter((r) => r.status === "solved").length;
    return (
      <Panel
        title="Drill complete"
        badge={<span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">{solved}/{d.puzzles.length}</span>}
        action={<button onClick={() => store.endDrill()} className="text-[11px] text-slate-500 hover:text-slate-300">close</button>}
      >
        <div className="text-base font-semibold text-slate-100">{d.title}</div>
        <ul className="mt-2 space-y-1 text-sm">
          {d.results.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={r.status === "solved" ? "text-emerald-400" : r.status === "failed" ? "text-rose-400" : "text-slate-500"}>{r.status === "solved" ? "✓" : r.status === "failed" ? "✗" : "–"}</span>
              <span className="text-slate-200">{r.title}</span>
              {r.theme && <span className="text-[10px] text-slate-500">#{r.theme}</span>}
              {r.attempts > 1 && <span className="ml-auto text-[11px] text-slate-500">{r.attempts} tries</span>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">Tell your coach you are done. It reads these results and builds the next drill.</p>
      </Panel>
    );
  }

  if (!p) return null;

  const status =
    p.status === "solved"
      ? { label: "Solved", cls: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30" }
      : p.status === "failed"
        ? { label: "Not yet", cls: "bg-rose-400/15 text-rose-300 border-rose-400/30" }
        : { label: "Your move", cls: "bg-amber-400/15 text-amber-300 border-amber-400/30" };

  const total = p.solution.length;
  const done = Math.min(p.solutionIndex, total);
  const inDrill = d && d.status === "active";

  return (
    <Panel
      title={inDrill ? `Drill · ${d.index + 1}/${d.puzzles.length}` : "Exercise"}
      badge={<span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.cls}`}>{status.label}</span>}
    >
      {inDrill && (
        <div className="mb-2 flex gap-1">
          {d.puzzles.map((_, i) => {
            const r = d.results[i];
            const cls = r ? (r.status === "solved" ? "bg-emerald-400" : r.status === "failed" ? "bg-rose-400" : "bg-slate-600") : i === d.index ? "bg-amber-400" : "bg-white/10";
            return <span key={i} className={`h-1.5 flex-1 rounded-full ${cls}`} />;
          })}
        </div>
      )}
      <div className="text-base font-semibold text-slate-100">{p.title}</div>
      <p className="mt-1 text-sm text-slate-300 leading-relaxed">{p.goal}</p>
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
        {p.theme && <span className="rounded-md bg-white/5 px-2 py-0.5 text-slate-400">#{p.theme}</span>}
        {total > 1 && <span>{done}/{total} moves</span>}
        {p.attempts > 0 && <span>{p.attempts} failed attempt{p.attempts === 1 ? "" : "s"}</span>}
      </div>
      {p.hint && p.status === "active" && (
        <div className="mt-2">
          {showHint ? (
            <p className="text-sm text-sky-200/90 border-l-2 border-sky-400/40 pl-3">{p.hint}</p>
          ) : (
            <button onClick={() => setShowHint(true)} className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4">Show hint</button>
          )}
        </div>
      )}
      {p.status !== "active" && (
        <div className="mt-3 flex gap-2">
          <button onClick={() => { setShowHint(false); store.retryPuzzle(); }} className="btn">Retry ↺</button>
          {inDrill && p.status === "failed" && (
            <button onClick={() => { setShowHint(false); store.skipDrillPuzzle(); }} className="btn">Skip →</button>
          )}
          {inDrill && p.status === "solved" && <span className="text-xs text-slate-500 self-center">Next puzzle loading…</span>}
        </div>
      )}
    </Panel>
  );
}
