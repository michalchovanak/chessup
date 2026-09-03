"use client";
/**
 * The row under the board: whose move it is, the coach's one-line caption, the
 * sparring indicator, and the game menu (new game, undo, opponent and bot level).
 */
import { useMemo, useState } from "react";
import type { Opponent } from "@/lib/types";
import { Chess } from "chess.js";
import { store } from "@/lib/store";
import { useApp } from "@/lib/useApp";
import { gameStatus } from "@/lib/chessLogic";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { CoachCaption } from "./CoachCaption";

export function GameControls() {
  const st = useApp();
  const chess = useMemo(() => new Chess(st.fen), [st.fen]);
  const status = gameStatus(chess);

  const humanTurn = st.settings.opponent === "human" || chess.turn() === st.settings.playerColor;
  const coachTurn = st.settings.opponent === "agent" && !humanTurn && !status.over;
  const turnLabel = status.over
    ? `${status.result} · ${status.reason}`
    : `${chess.turn() === "w" ? "White" : "Black"} to move${status.reason === "check" ? " · check!" : ""}`;

  return (
    <div className="mt-2.5 space-y-2.5">
      <div className="panel-surface flex min-h-12 flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-sm">
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${chess.turn() === "w" ? "border-stone-300/50 bg-stone-100" : "border-stone-600 bg-stone-950"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${chess.turn() === "w" ? "bg-stone-800" : "bg-stone-200"}`} />
        </span>
        <div className="min-w-0">
          <div className="font-medium text-stone-100">{turnLabel}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => store.undoMove(st.settings.opponent === "human" ? 1 : Math.min(2, st.moves.length))} disabled={!st.moves.length} className="btn border-transparent bg-transparent px-2.5 text-slate-400">
            Undo
          </button>
          <button onClick={() => store.newGame({ playerColor: st.settings.playerColor })} className="btn px-2.5">New game</button>
          <GameMenu />
        </div>
      </div>

      <CoachCaption />
      {coachTurn && <ThinkingIndicator />}
      {st.agentWaiting && humanTurn && !status.over && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-100/90">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Your coach is waiting for your move.
        </div>
      )}
    </div>
  );
}

const LEVELS: { level: 1 | 2 | 3; label: string }[] = [
  { level: 1, label: "Easy" },
  { level: 2, label: "Normal" },
  { level: 3, label: "Hard" },
];

function GameMenu() {
  const st = useApp();
  const [open, setOpen] = useState(false);
  const { opponent, botLevel } = st.settings;
  const opponentLabel = opponent === "agent" ? "Coach" : opponent === "human" ? "Myself" : LEVELS[botLevel - 1].label;

  const setOpponent = (o: Opponent, level?: 1 | 2 | 3) => {
    store.setSettings({ opponent: o, ...(level ? { botLevel: level } : {}) });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn gap-1.5 px-2.5 text-slate-300"
        aria-label="Game settings"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {st.settings.playerColor === "w" ? "White" : "Black"} · {opponentLabel}
        <span className="text-[9px] text-slate-600">▾</span>
      </button>
      {open && (
        <div className="popover-menu absolute bottom-full right-0 z-20 mb-1.5 w-64 rounded-xl border border-white/10 bg-[#161a17] p-2 shadow-2xl" role="menu">
          <div className="px-2 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">Play as</div>
          <div className="grid grid-cols-2 gap-1">
            <Choice active={st.settings.playerColor === "w"} onClick={() => { store.newGame({ playerColor: "w" }); setOpen(false); }}>White</Choice>
            <Choice active={st.settings.playerColor === "b"} onClick={() => { store.newGame({ playerColor: "b" }); setOpen(false); }}>Black</Choice>
          </div>
          <div className="mt-2 border-t border-white/[0.07] px-2 pb-1.5 pt-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">Opponent</div>
          <div className="grid grid-cols-3 gap-1">
            {LEVELS.map((l) => (
              <Choice key={l.level} active={opponent === "bot" && botLevel === l.level} onClick={() => setOpponent("bot", l.level)}>{l.label}</Choice>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-1">
            <Choice active={opponent === "agent"} onClick={() => setOpponent("agent")}>Coach</Choice>
            <Choice active={opponent === "human"} onClick={() => setOpponent("human")}>Myself</Choice>
          </div>
          {!st.agentConnected && opponent !== "agent" && <p className="px-2 pt-2 text-[10px] leading-relaxed text-slate-600">Coach mode needs WebMCP.</p>}
        </div>
      )}
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} role="menuitem" className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${active ? "bg-amber-300 text-stone-950" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}>
      {children}
    </button>
  );
}
