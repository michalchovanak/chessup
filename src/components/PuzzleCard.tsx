"use client";
import { useState } from "react";
import { Panel } from "./Panel";
import { store } from "@/lib/store";
import { useApp } from "@/lib/useApp";

export function PuzzleCard() {
  const st = useApp();
  const [showHint, setShowHint] = useState(false);
  const p = st.puzzle;
  if (!p) return null;

  const status =
    p.status === "solved"
      ? { label: "Solved", cls: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30" }
      : p.status === "failed"
        ? { label: "Try again", cls: "bg-rose-400/15 text-rose-300 border-rose-400/30" }
        : { label: "Active", cls: "bg-amber-400/15 text-amber-300 border-amber-400/30" };

  const total = p.solution.length;
  const done = Math.min(p.solutionIndex, total);

  return (
    <Panel
      title="Exercise"
      badge={<span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.cls}`}>{status.label}</span>}
      action={
        p.status !== "active" ? (
          <button onClick={() => store.retryPuzzle()} className="text-xs text-amber-300 hover:text-amber-200 font-medium">
            Retry ↺
          </button>
        ) : null
      }
    >
      <div className="text-base font-semibold text-slate-100">{p.title}</div>
      <p className="mt-1 text-sm text-slate-300 leading-relaxed">{p.goal}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        {p.theme && <span className="rounded-md bg-white/5 px-2 py-0.5 text-slate-400">#{p.theme}</span>}
        {total > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`h-1.5 w-4 rounded-full ${i < done ? "bg-emerald-400" : "bg-white/10"}`} />
              ))}
            </span>
            {done}/{total}
          </span>
        )}
        {p.attempts > 0 && <span>{p.attempts} failed attempt{p.attempts === 1 ? "" : "s"}</span>}
      </div>
      {p.hint && (
        <div className="mt-3">
          {showHint ? (
            <p className="text-sm text-sky-200/90 border-l-2 border-sky-400/40 pl-3">{p.hint}</p>
          ) : (
            <button onClick={() => setShowHint(true)} className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4">
              Show hint
            </button>
          )}
        </div>
      )}
    </Panel>
  );
}
