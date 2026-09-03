"use client";
/**
 * Vertical evaluation bar next to the board, fed by the built-in Stockfish, with a
 * popover that explains the number, judges the human's last move and offers a
 * ready-made question for the coach. Hidden while a puzzle is being solved so it can
 * never give the answer away.
 */
import { useState } from "react";
import { useApp } from "@/lib/useApp";
import { formatScore } from "@/lib/engine";

function verdict(scoreWhite: number, playerColor: "w" | "b"): string {
  const a = Math.abs(scoreWhite);
  if (a < 30) return "The position is about even";
  const playerIsAhead = (scoreWhite > 0 ? "w" : "b") === playerColor;
  const who = playerIsAhead ? "You" : "Your opponent";
  if (a >= 9000) return `${who} ${playerIsAhead ? "have" : "has"} a forced checkmate`;
  if (a < 100) return `${who} ${playerIsAhead ? "are" : "is"} slightly ahead`;
  if (a < 300) return `${who} ${playerIsAhead ? "have" : "has"} a clear advantage`;
  return `${who} ${playerIsAhead ? "are" : "is"} winning`;
}

/** Thin vertical evaluation bar next to the board, fed by the built-in Stockfish, with an explanatory popover. */
export function EvalBar() {
  const st = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Never leak the answer: no evaluation while the human is solving a puzzle or drill.
  if (st.puzzle && st.puzzle.status === "active") return <div className="w-9 shrink-0" aria-hidden />;

  const ev = st.lastEval && st.lastEval.fen === st.fen ? st.lastEval : null;
  const score = ev?.scoreWhite ?? 0;
  const white = ev ? Math.max(5, Math.min(95, 50 + 50 * Math.tanh(score / 400))) : 50;
  const flipped = st.settings.playerColor === "b";
  const label = ev ? formatScore(score) : st.engineStatus === "error" ? "—" : "…";
  const review = st.lastReview;
  const reviewIsMistake = !!review && review.cpLoss >= 100;
  const severity = !review ? "" : review.cpLoss >= 300 ? "blunder" : review.cpLoss >= 150 ? "mistake" : review.cpLoss >= 100 ? "inaccuracy" : "fine";
  const scoreSide = Math.abs(score) < 30 ? null : score > 0 ? "White" : "Black";
  const positionVerdict = verdict(score, st.settings.playerColor);

  const question = review
    ? reviewIsMistake
      ? `Why was ${review.san} a ${severity}? Show me on the board what I should have played instead and what the idea is.`
      : `Was ${review.san} the right idea? What should I be planning in this position?`
    : "Look at the position and tell me who is better and why.";

  function copyQuestion() {
    navigator.clipboard?.writeText(question).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="relative flex w-9 shrink-0 flex-col items-center select-none"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        title="Position score — click for an explanation"
        className="group relative flex h-full min-h-[200px] w-full cursor-help flex-1 flex-col items-center gap-1"
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="evaluation-popover"
        aria-label={ev ? `Position score ${formatScore(score)}, ${positionVerdict}. Open explanation.` : "Position score is being calculated"}
      >
        <span className="relative min-h-[200px] w-2.5 flex-1 overflow-hidden rounded-full bg-stone-800 ring-1 ring-white/10" style={{ transform: flipped ? "rotate(180deg)" : undefined }}>
          <span className="absolute bottom-0 left-0 right-0 bg-stone-100 transition-[height] duration-500 ease-out" style={{ height: `${white}%` }} />
        </span>
        {reviewIsMistake && (
          <span className="absolute -right-0.5 top-0 h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-[#0b0d0c] animate-pulse" aria-hidden />
        )}
        <span className={`block w-full overflow-hidden whitespace-nowrap rounded px-0.5 py-0.5 text-center text-[10px] font-mono tabular-nums transition-colors group-hover:bg-white/[0.07] ${score >= 0 ? "text-stone-200" : "text-stone-400"}`}>{label}</span>
      </button>

      {open && (
        <div id="evaluation-popover" className="absolute left-5 top-0 z-30 w-64 rounded-2xl border border-white/10 bg-[#141a26] p-3.5 text-left shadow-2xl" role="dialog" aria-label="Position evaluation">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Position</div>
          {st.engineStatus === "ready" && ev ? (
            <>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-xl font-semibold text-stone-100">{formatScore(score)}</span>
                {scoreSide && <span className="text-xs text-slate-400">for {scoreSide}</span>}
              </div>
              <div className="text-sm font-medium text-slate-200">{positionVerdict}</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                + favors White, − favors Black. One point is roughly one pawn.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">{st.engineStatus === "loading" ? "Loading Stockfish (7 MB)…" : st.engineStatus === "error" ? "Engine unavailable in this browser." : "Evaluating…"}</p>
          )}

          {review && (
            <div className={`mt-3 rounded-xl border px-3 py-2 ${reviewIsMistake ? "border-rose-400/30 bg-rose-400/[0.08]" : "border-emerald-400/20 bg-emerald-400/[0.06]"}`}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">Your move</span>
                <span className={`ml-auto text-[10px] font-medium capitalize ${reviewIsMistake ? "text-rose-200" : "text-emerald-200"}`}>{severity}</span>
              </div>
              <div className="mt-1 font-mono text-base font-semibold text-slate-100">{review.san}</div>
              <div className={`mt-0.5 text-xs ${reviewIsMistake ? "text-rose-200" : "text-emerald-200"}`}>
                {reviewIsMistake ? `This move gave up about ${(review.cpLoss / 100).toFixed(1)} points.` : "No meaningful drop in the engine score."}
              </div>
              {review.bestMove && review.bestMove !== review.san && (
                <div className="mt-1 text-xs text-slate-300">Better: <span className="font-mono font-semibold text-stone-100">{review.bestMove}</span></div>
              )}
            </div>
          )}

          <div className="mt-3">
            <div className="text-[11px] text-slate-400">Want to understand the idea, not just the score?</div>
            <button
              onClick={copyQuestion}
              className="mt-2 flex w-full justify-center rounded-lg border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2 text-xs font-medium text-amber-100 transition-colors hover:border-amber-300/40 hover:bg-amber-300/[0.12]"
            >
              {copied ? "Copied — paste in chat ✓" : "Copy a question for your coach"}
            </button>
            <p className="mt-1.5 text-[10px] text-slate-500">{st.agentConnected ? "Paste it into the chat beside the board." : "Open the board in ChatGPT, then paste it into chat."}</p>
          </div>
          <p className="mt-2 border-t border-white/[0.06] pt-2 text-[10px] text-slate-600">Evaluation pauses while you solve a puzzle.</p>
        </div>
      )}
    </div>
  );
}
