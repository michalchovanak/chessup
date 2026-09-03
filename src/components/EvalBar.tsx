"use client";
import { useApp } from "@/lib/useApp";
import { formatScore } from "@/lib/engine";

/** Thin vertical evaluation bar next to the board, fed by the built-in Stockfish. */
export function EvalBar() {
  const st = useApp();
  const ev = st.lastEval && st.lastEval.fen === st.fen ? st.lastEval : null;
  const score = ev?.scoreWhite ?? 0;
  // Map centipawns to a 5..95% white share with a soft curve.
  const white = ev ? Math.max(5, Math.min(95, 50 + 50 * Math.tanh(score / 400))) : 50;
  const flipped = st.settings.playerColor === "b";
  const label = ev ? formatScore(score) : st.engineStatus === "loading" ? "…" : "";
  const title =
    st.engineStatus === "ready"
      ? ev
        ? `Stockfish depth ${ev.depth}: ${formatScore(score)}${ev.bestMove ? `, best ${ev.bestMove}` : ""}`
        : "Stockfish: evaluating…"
      : st.engineStatus === "loading"
        ? "Loading Stockfish (7 MB)…"
        : st.engineStatus === "error"
          ? "Engine unavailable in this browser"
          : "Engine off";

  return (
    <div className="flex flex-col items-center gap-1 select-none" title={title} aria-label={title}>
      <div className="relative h-full min-h-[200px] w-2.5 flex-1 overflow-hidden rounded-full bg-stone-800 ring-1 ring-white/10" style={{ transform: flipped ? "rotate(180deg)" : undefined }}>
        <div className="absolute bottom-0 left-0 right-0 bg-stone-100 transition-[height] duration-500 ease-out" style={{ height: `${white}%` }} />
      </div>
      <span className={`text-[10px] font-mono tabular-nums ${score >= 0 ? "text-stone-200" : "text-stone-400"}`}>{label}</span>
    </div>
  );
}
