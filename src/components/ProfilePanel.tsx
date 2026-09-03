"use client";
import { useState } from "react";
import { Panel } from "./Panel";
import { store, levelFor } from "@/lib/store";
import { useApp } from "@/lib/useApp";

const CATEGORY_LABEL: Record<string, string> = {
  hanging_piece: "Hanging pieces",
  missed_mate: "Missed mates",
  allowed_mate: "Allowed mates",
  missed_capture: "Missed captures",
  opening: "Opening",
  endgame: "Endgame",
  tactics: "Tactics",
  positional: "Positional",
  king_safety: "King safety",
  other: "Other",
};

export function ProfilePanel() {
  const st = useApp();
  const p = st.profile;
  const [editing, setEditing] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);

  const byCat = new Map<string, number>();
  for (const m of p.mistakes) byCat.set(m.category, (byCat.get(m.category) ?? 0) + 1);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxCat = cats[0]?.[1] ?? 1;

  return (
    <Panel
      title="Player"
      action={
        <button
          onClick={() => {
            if (confirm("Reset XP, badges, mistakes and lesson plan?")) store.resetProfile();
          }}
          className="text-[11px] text-slate-600 hover:text-rose-300"
        >
          reset
        </button>
      }
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 grid place-items-center text-lg">♔</div>
        <div className="min-w-0">
          {editing ? (
            <input
              autoFocus
              defaultValue={p.name}
              onBlur={(e) => {
                store.setPlayerName(e.target.value.trim() || "Player");
                setEditing(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="bg-white/5 rounded px-2 py-0.5 text-sm outline-none ring-1 ring-amber-400/40"
            />
          ) : (
            <button onClick={() => setEditing(true)} className="text-sm font-semibold text-slate-100 hover:text-amber-200" title="Rename">
              {p.name} <span className="text-slate-600 font-normal">✎</span>
            </button>
          )}
          <div className="text-xs text-slate-500">
            Level {levelFor(p.xp)} · {p.xp} XP · {p.sessions} session{p.sessions === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Games" value={`${p.games.won}-${p.games.lost}-${p.games.drawn}`} sub="W-L-D" />
        <Stat label="Puzzles" value={`${p.puzzles.solved}/${p.puzzles.attempted}`} sub="solved" />
        <Stat label="Badges" value={String(p.badges.length)} sub="earned" />
      </div>

      {p.badges.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">Badges</div>
          <div className="flex flex-wrap gap-1.5">
            {p.badges.map((b) => (
              <span key={b.id} title={b.description} className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-100">
                <span>{b.emoji}</span> {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Weak spots</div>
          {p.mistakes.length > 0 && (
            <button onClick={() => setShowMistakes((v) => !v)} className="ml-auto text-[11px] text-slate-500 hover:text-slate-300">
              {showMistakes ? "hide" : `${p.mistakes.length} recorded`}
            </button>
          )}
        </div>
        {cats.length === 0 ? (
          <p className="text-xs text-slate-600 mt-1">No mistakes recorded yet. Play a game and the app (and your coach) will track them.</p>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {cats.map(([c, n]) => (
              <li key={c} className="text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{CATEGORY_LABEL[c] ?? c}</span>
                  <span className="text-slate-500">{n}</span>
                </div>
                <div className="mt-0.5 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-rose-400/70 rounded-full" style={{ width: `${(n / maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {showMistakes && (
          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
            {p.mistakes.slice(0, 15).map((m) => (
              <li key={m.id} className="text-[11px] text-slate-400 leading-snug border-l border-white/10 pl-2">
                <span className={m.severity === "blunder" ? "text-rose-300" : m.severity === "mistake" ? "text-amber-300" : "text-slate-300"}>
                  {m.movePlayed ?? "?"}
                </span>{" "}
                {m.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-100 mt-0.5 tabular-nums">{value}</div>
      <div className="text-[10px] text-slate-600">{sub}</div>
    </div>
  );
}
