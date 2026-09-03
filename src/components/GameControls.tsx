"use client";
import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { store } from "@/lib/store";
import { useApp } from "@/lib/useApp";
import { gameStatus } from "@/lib/chessLogic";
import { WaitingMeme } from "./WaitingMeme";

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
          {st.settings.opponent === "agent" ? "agent" : st.settings.opponent === "bot" ? `bot L${st.settings.botLevel}` : "yourself"}
        </span>
      </div>

      {coachTurn && (
        <WaitingMeme label={st.agentConnected ? "Coach's move. It replies through WebMCP; if it stays quiet, say “your move” in the chat." : "Waiting for an agent to play this side. Switch the opponent to a bot if you want to play now."} />
      )}
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
        <select
          className="btn cursor-pointer"
          value={st.settings.opponent === "bot" ? `bot${st.settings.botLevel}` : st.settings.opponent}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith("bot")) store.setSettings({ opponent: "bot", botLevel: Number(v[3]) as 1 | 2 | 3 });
            else store.setSettings({ opponent: v as "agent" | "human" });
          }}
        >
          <option value="agent">Opponent: agent</option>
          <option value="bot1">Opponent: bot · easy</option>
          <option value="bot2">Opponent: bot · normal</option>
          <option value="bot3">Opponent: bot · hard</option>
          <option value="human">Opponent: myself</option>
        </select>
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
