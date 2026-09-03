"use client";
/**
 * Dialog shown when a normal game ends (not for puzzles): result, XP earned, mistakes
 * made in this game and buttons to start the next one.
 */
import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { store } from "@/lib/store";
import { useApp } from "@/lib/useApp";
import { gameStatus } from "@/lib/chessLogic";

export function GameOverModal() {
  const st = useApp();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const chess = useMemo(() => new Chess(st.fen), [st.fen]);
  const status = gameStatus(chess);

  const key = `${st.startFen}|${st.moves.length}`;
  if (!st.hydrated || !status.over || st.puzzle || st.moves.length === 0 || dismissedKey === key) return null;

  const { playerColor } = st.settings;
  const outcome: "won" | "lost" | "drawn" =
    status.result === "1/2-1/2"
      ? "drawn"
      : (status.result === "1-0" && playerColor === "w") || (status.result === "0-1" && playerColor === "b")
        ? "won"
        : "lost";

  const gameMistakes = st.profile.mistakes.filter((m) => m.at >= st.gameStartedAt);
  const blunders = gameMistakes.filter((m) => m.severity === "blunder").length;
  const xpEntry = st.profile.xpLog[0];
  const xpGained = xpEntry && xpEntry.at >= st.gameStartedAt ? xpEntry.amount : 0;

  const headline = outcome === "won" ? "You won!" : outcome === "lost" ? "Checkmate. Nice fight." : "Draw.";
  const tone = outcome === "won" ? "from-emerald-300 to-emerald-600" : outcome === "lost" ? "from-rose-300 to-rose-600" : "from-slate-300 to-slate-600";
  const emoji = outcome === "won" ? "🏆" : outcome === "lost" ? "♚" : "🤝";

  const close = () => setDismissedKey(key);
  const other = playerColor === "w" ? "b" : "w";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={close}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f131c] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tone} grid place-items-center text-2xl`}>{emoji}</div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{headline}</h2>
            <p className="text-sm text-slate-400">
              {status.result} · {status.reason} · {st.moves.length} half-moves
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat label="XP earned" value={xpGained > 0 ? `+${xpGained}` : "0"} />
          <Stat label="Mistakes" value={String(gameMistakes.length)} sub={blunders ? `${blunders} blunder${blunders === 1 ? "" : "s"}` : undefined} />
          <Stat label="Record" value={`${st.profile.games.won}-${st.profile.games.lost}-${st.profile.games.drawn}`} sub="W-L-D" />
        </div>

        {gameMistakes.length > 0 && (
          <p className="mt-4 text-xs text-slate-400 leading-relaxed">
            Biggest lesson: <span className="text-slate-200">{gameMistakes[0].description}</span>
          </p>
        )}
        {st.agentConnected && (
          <p className="mt-2 text-xs text-emerald-200/80">Ask your coach for a review before starting the next game.</p>
        )}

        <div className="mt-6 grid gap-2">
          <button onClick={() => { store.newGame({ playerColor }); close(); }} className="btn btn-primary py-2.5 text-sm">
            New game as {playerColor === "w" ? "White" : "Black"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { store.newGame({ playerColor: other }); close(); }} className="btn py-2 text-sm">
              Switch to {other === "w" ? "White" : "Black"}
            </button>
            <button onClick={close} className="btn py-2 text-sm">Review the board</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-100 tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
