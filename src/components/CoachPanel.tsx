"use client";
import { Panel, Empty } from "./Panel";
import { useApp } from "@/lib/useApp";
import { store } from "@/lib/store";
import type { NoteKind } from "@/lib/types";

const STYLE: Record<NoteKind, { icon: string; cls: string }> = {
  tip: { icon: "💡", cls: "border-sky-400/20 bg-sky-400/[0.07]" },
  praise: { icon: "🎉", cls: "border-emerald-400/20 bg-emerald-400/[0.08]" },
  warning: { icon: "⚠️", cls: "border-amber-400/25 bg-amber-400/[0.08]" },
  question: { icon: "❓", cls: "border-violet-400/20 bg-violet-400/[0.08]" },
  info: { icon: "♟", cls: "border-white/10 bg-white/[0.03]" },
};

export function CoachPanel() {
  const st = useApp();
  return (
    <Panel
      title="Coach"
      badge={st.notes.length ? <span className="text-[10px] text-slate-500">{st.notes.length}</span> : null}
      action={st.notes.length ? <button onClick={() => store.clearNotes()} className="text-[11px] text-slate-500 hover:text-slate-300">clear</button> : null}
    >
      {st.notes.length === 0 ? (
        <Empty>
          {st.agentConnected
            ? "Your coach is connected. Ask it to look at the board, set up a puzzle for you, or start a lesson."
            : "No agent yet. Open this page in ChatGPT’s browser (or Chrome with WebMCP enabled) and say: “Coach me – look at my profile and build a lesson.”"}
        </Empty>
      ) : (
        <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {st.notes.map((n) => {
            const s = STYLE[n.kind] ?? STYLE.info;
            return (
              <li key={n.id} className={`flex gap-2.5 rounded-xl border px-3 py-2.5 text-sm leading-relaxed ${s.cls}`}>
                <span className="shrink-0 text-base leading-5">{s.icon}</span>
                <span className="text-slate-200">{n.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
