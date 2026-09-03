"use client";
import { Panel, Empty } from "./Panel";
import { useApp } from "@/lib/useApp";
import type { LessonStatus } from "@/lib/types";

const ICON: Record<LessonStatus, string> = { todo: "○", active: "◉", done: "✓", skipped: "–" };

export function LessonPlan() {
  const st = useApp();
  const { title, steps } = st.lesson;
  const doneCount = steps.filter((s) => s.status === "done").length;
  return (
    <Panel title="Lesson plan" badge={steps.length ? <span className="text-[10px] text-slate-500">{doneCount}/{steps.length}</span> : null}>
      {steps.length === 0 ? (
        <Empty>The coach will build a plan here from your profile and update it as you progress.</Empty>
      ) : (
        <>
          {title && <div className="text-sm font-semibold text-slate-100 mb-2">{title}</div>}
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li
                key={i}
                className={`flex gap-3 rounded-xl px-3 py-2 ${
                  s.status === "active" ? "bg-amber-400/10 border border-amber-400/25" : "border border-transparent"
                }`}
              >
                <span
                  className={`mt-0.5 h-5 w-5 shrink-0 grid place-items-center rounded-full text-[11px] font-bold ${
                    s.status === "done"
                      ? "bg-emerald-400 text-slate-950"
                      : s.status === "active"
                        ? "bg-amber-400 text-slate-950"
                        : s.status === "skipped"
                          ? "bg-white/5 text-slate-600"
                          : "bg-white/10 text-slate-400"
                  }`}
                >
                  {ICON[s.status]}
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${s.status === "done" ? "text-slate-500 line-through" : s.status === "skipped" ? "text-slate-600" : "text-slate-100"}`}>
                    {s.title}
                  </div>
                  {s.description && <div className="text-xs text-slate-400 leading-relaxed mt-0.5">{s.description}</div>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  );
}
