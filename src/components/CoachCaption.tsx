"use client";
/** The latest one-sentence note from the coach, shown right under the board. */
import { useApp } from "@/lib/useApp";
import type { NoteKind } from "@/lib/types";

const ICON: Record<NoteKind, string> = { tip: "💡", praise: "🎉", warning: "⚠️", question: "❓", info: "♟" };
const TONE: Record<NoteKind, string> = {
  tip: "border-sky-400/25 bg-sky-400/[0.07] text-sky-50",
  praise: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-50",
  warning: "border-amber-400/30 bg-amber-400/[0.08] text-amber-50",
  question: "border-violet-400/25 bg-violet-400/[0.08] text-violet-50",
  info: "border-white/10 bg-white/[0.03] text-slate-200",
};

/** The single latest coach caption, shown right under the board. */
export function CoachCaption() {
  const st = useApp();
  const n = st.notes[0];
  if (!n) return null;
  return (
    <div key={n.id} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm leading-relaxed animate-[fadein_300ms_ease] ${TONE[n.kind] ?? TONE.info}`}>
      <span className="shrink-0">{ICON[n.kind] ?? "♟"}</span>
      <span className="line-clamp-2">{n.text}</span>
      <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wider opacity-50">coach</span>
    </div>
  );
}
