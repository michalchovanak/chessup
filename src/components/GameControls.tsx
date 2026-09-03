"use client";
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
  const [copied, setCopied] = useState(false);

  const humanTurn = st.settings.opponent === "human" || chess.turn() === st.settings.playerColor;
  const coachTurn = st.settings.opponent === "agent" && !humanTurn && !status.over;
  const turnLabel = status.over
    ? `${status.result} · ${status.reason}`
    : `${chess.turn() === "w" ? "White" : "Black"} to move${status.reason === "check" ? " · check!" : ""}`;

  return (
    <div className="mt-8 space-y-3">
      <div className="flex items-center gap-3 text-sm">
        <span className={`h-3 w-3 rounded-full border ${chess.turn() === "w" ? "bg-slate-100 border-slate-300" : "bg-slate-900 border-slate-600"}`} />
        <span className="text-slate-200 font-medium">{turnLabel}</span>
        <span className="ml-auto text-xs text-slate-500">
          You play {st.settings.playerColor === "w" ? "White" : "Black"} vs{" "}
          {st.settings.opponent === "agent" ? "the coach" : st.settings.opponent === "bot" ? `the bot (${["easy", "normal", "hard"][st.settings.botLevel - 1]})` : "yourself"}
        </span>
      </div>

      <CoachCaption />
      {coachTurn && <ThinkingIndicator />}
      {st.agentWaiting && humanTurn && !status.over && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-100/90">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Your coach is waiting for your move.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => store.newGame({ playerColor: "w" })} className="btn">New game · White</button>
        <button onClick={() => store.newGame({ playerColor: "b" })} className="btn">New game · Black</button>
        <button onClick={() => store.undoMove(st.settings.opponent === "human" ? 1 : Math.min(2, st.moves.length))} disabled={!st.moves.length} className="btn">
          Undo
        </button>
        <OpponentPicker />
        <button
          onClick={() => {
            navigator.clipboard?.writeText(st.fen);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="btn ml-auto"
          title={st.fen}
        >
          {copied ? "Copied" : "Copy FEN"}
        </button>
      </div>
    </div>
  );
}

const LEVELS: { level: 1 | 2 | 3; label: string }[] = [
  { level: 1, label: "Easy" },
  { level: 2, label: "Normal" },
  { level: 3, label: "Hard" },
];

function OpponentPicker() {
  const st = useApp();
  const [more, setMore] = useState(false);
  const { opponent, botLevel } = st.settings;
  const special = opponent !== "bot";

  const setOpponent = (o: Opponent, level?: 1 | 2 | 3) => {
    store.setSettings({ opponent: o, ...(level ? { botLevel: level } : {}) });
    setMore(false);
  };

  return (
    <div className="relative flex items-center gap-1">
      <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
        <span className="px-2 text-[11px] text-slate-500">Bot</span>
        {LEVELS.map((l) => {
          const active = opponent === "bot" && botLevel === l.level;
          return (
            <button
              key={l.level}
              onClick={() => setOpponent("bot", l.level)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${active ? "bg-amber-400/20 text-amber-200" : "text-slate-400 hover:text-slate-200"}`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => setMore((v) => !v)}
        className={`btn px-2 ${special ? "border-emerald-400/40 text-emerald-200" : ""}`}
        title="More opponents"
      >
        {opponent === "agent" ? "Sparring" : opponent === "human" ? "Myself" : "⋯"}
      </button>
      {more && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-xl border border-white/10 bg-[#141a26] p-1.5 shadow-2xl">
          <MenuItem active={opponent === "agent"} onClick={() => setOpponent("agent")} title="Sparring with the coach" desc={st.agentConnected ? "The agent plays against you. Works while you are not chatting." : "Needs a connected coach."} />
          <MenuItem active={opponent === "human"} onClick={() => setOpponent("human")} title="Play myself" desc="Both sides by hand, for analysis." />
          {special && <MenuItem active={false} onClick={() => setOpponent("bot")} title="Back to the bot" desc="Instant replies." />}
        </div>
      )}
    </div>
  );
}

function MenuItem({ active, onClick, title, desc }: { active: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`w-full rounded-lg px-3 py-2 text-left hover:bg-white/5 ${active ? "bg-white/5" : ""}`}>
      <div className="text-sm text-slate-100">{title}</div>
      <div className="text-[11px] text-slate-500">{desc}</div>
    </button>
  );
}
