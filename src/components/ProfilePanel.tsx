"use client";
import { useState } from "react";
import { store, levelFor, xpForLevel } from "@/lib/store";
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

  const level = levelFor(p.xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const pct = Math.min(100, Math.round(((p.xp - cur) / (next - cur)) * 100));

  const byCat = new Map<string, number>();
  for (const m of p.mistakes) byCat.set(m.category, (byCat.get(m.category) ?? 0) + 1);
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxCat = cats[0]?.[1] ?? 1;

  return (
    <details className="panel-surface group rounded-xl">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs text-slate-400 transition-colors hover:text-slate-200">
        <span>Player progress</span>
        <span className="ml-auto tabular-nums text-slate-600">Level {level} · {p.xp} XP</span>
        <span className="text-[9px] text-slate-600 transition-transform group-open:rotate-180">↓</span>
      </summary>
      <div className="border-t border-white/[0.06] px-4 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-300 text-sm font-bold text-slate-950">{level}</div>
          <div className="min-w-0 flex-1">
            {editing ? (
            <form
              {...({ toolname: "set_player_name", tooldescription: "Change the player's display name shown in the profile." } as Record<string, string>)}
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                store.setPlayerName(String(data.get("name") ?? "").trim() || "Player");
                setEditing(false);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                autoFocus
                name="name"
                defaultValue={p.name}
                maxLength={32}
                required
                {...({ toolparamdescription: "New display name, 1-32 characters." } as Record<string, string>)}
                onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                className="w-40 rounded bg-white/5 px-2 py-0.5 text-sm outline-none ring-1 ring-amber-400/40"
              />
              <button type="submit" className="text-[11px] text-amber-200">save</button>
            </form>
          ) : (
            <button onClick={() => setEditing(true)} className="text-sm font-semibold text-slate-100 hover:text-amber-200" title="Rename">
              {p.name} <span className="text-slate-600 font-normal">✎</span>
            </button>
          )}
          <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {p.xp} XP · next level at {next} · games {p.games.won}-{p.games.lost}-{p.games.drawn} · puzzles {p.puzzles.solved}/{p.puzzles.attempted}
            </div>
          </div>
        </div>

        {p.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.badges.map((b) => (
              <span key={b.id} title={b.description} className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100">
                <span>{b.emoji}</span> {b.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3">
          <div className="flex items-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Weak spots</div>
            <button onClick={() => { if (confirm("Reset XP, badges, mistakes and lesson plan?")) store.resetProfile(); }} className="ml-auto text-[11px] text-slate-600 hover:text-rose-300">
              reset
            </button>
            {p.mistakes.length > 0 && (
              <button onClick={() => setShowMistakes((v) => !v)} className="ml-3 text-[11px] text-slate-500 hover:text-slate-300">
                {showMistakes ? "hide" : `${p.mistakes.length} recorded`}
              </button>
            )}
          </div>
          {cats.length === 0 ? (
            <p className="text-xs text-slate-600 mt-1">Nothing recorded yet. Play a game; the app and your coach track mistakes here.</p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {cats.map(([c, n]) => (
                <li key={c} className="text-xs">
                  <div className="flex justify-between text-slate-300"><span>{CATEGORY_LABEL[c] ?? c}</span><span className="text-slate-500">{n}</span></div>
                  <div className="mt-0.5 h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-rose-400/70 rounded-full" style={{ width: `${(n / maxCat) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
          {showMistakes && (
            <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
              {p.mistakes.slice(0, 15).map((m) => (
                <li key={m.id} className="text-[11px] text-slate-400 leading-snug border-l border-white/10 pl-2">
                  <span className={m.severity === "blunder" ? "text-rose-300" : m.severity === "mistake" ? "text-amber-300" : "text-slate-300"}>{m.movePlayed ?? "?"}</span> {m.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </details>
  );
}
