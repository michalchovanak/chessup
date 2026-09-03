"use client";
import { useState } from "react";
import { useApp } from "@/lib/useApp";
import { formatScore } from "@/lib/engine";

function verdict(scoreWhite: number): string {
  const a = Math.abs(scoreWhite);
  const side = scoreWhite > 0 ? "White" : "Black";
  if (a >= 9000) return `${side} has a forced mate`;
  if (a < 30) return "Equal position";
  if (a < 100) return `${side} is slightly better`;
  if (a < 300) return `${side} is clearly better`;
  return `${side} is winning`;
}

/** Thin vertical evaluation bar next to the board, fed by the built-in Stockfish, with an explanatory popover. */
export function EvalBar() {
  const st = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Never leak the answer: no evaluation while the human is solving a puzzle or drill.
  if (st.puzzle && st.puzzle.status === "active") return null;

  const ev = st.lastEval && st.lastEval.fen === st.fen ? st.lastEval : null;
  const score = ev?.scoreWhite ?? 0;
  const white = ev ? Math.max(5, Math.min(95, 50 + 50 * Math.tanh(score / 400))) : 50;
  const flipped = st.settings.playerColor === "b";
  const label = ev ? formatScore(score) : st.engineStatus === "loading" ? "…" : "";
  const review = st.lastReview;
  const reviewIsMistake = !!review && review.cpLoss >= 100;
  const severity = !review ? "" : review.cpLoss >= 300 ? "blunder" : review.cpLoss >= 150 ? "mistake" : review.cpLoss >= 100 ? "inaccuracy" : "fine";
  const you = st.settings.playerColor === "w" ? 1 : -1;
  const yours = score * you;

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
      className="relative flex flex-col items-center gap-1 select-none"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      tabIndex={0}
      aria-label={ev ? `Engine evaluation ${formatScore(score)}, ${verdict(score)}` : "Engine evaluation"}
    >
      <div className="relative h-full min-h-[200px] w-2.5 flex-1 overflow-hidden rounded-full bg-stone-800 ring-1 ring-white/10" style={{ transform: flipped ? "rotate(180deg)" : undefined }}>
        <div className="absolute bottom-0 left-0 right-0 bg-stone-100 transition-[height] duration-500 ease-out" style={{ height: `${white}%` }} />
      </div>
      {reviewIsMistake && (
        <span className="absolute -right-1 top-0 h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-[#0b0d0c] animate-pulse" aria-hidden />
      )}
      <span className={`text-[10px] font-mono tabular-nums ${score >= 0 ? "text-stone-200" : "text-stone-400"}`}>{label}</span>

      {open && (
        <div className="absolute left-5 top-0 z-30 w-64 rounded-2xl border border-white/10 bg-[#141a26] p-3.5 text-left shadow-2xl" role="tooltip">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Engine evaluation</div>
          {st.engineStatus === "ready" && ev ? (
            <>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-xl font-semibold text-stone-100">{formatScore(score)}</span>
                <span className="text-xs text-slate-400">depth {ev.depth}</span>
              </div>
              <div className="text-sm text-slate-200">{verdict(score)}{Math.abs(score) < 9000 && Math.abs(score) >= 30 ? (yours > 0 ? " (that's you)" : " (not you)") : ""}</div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Stockfish runs in your browser. The number is the advantage in pawns from White&apos;s point of view; the bar fills towards whoever is better.
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-400">{st.engineStatus === "loading" ? "Loading Stockfish (7 MB)…" : st.engineStatus === "error" ? "Engine unavailable in this browser." : "Evaluating…"}</p>
          )}

          {review && (
            <div className={`mt-3 rounded-xl border px-3 py-2 ${reviewIsMistake ? "border-rose-400/30 bg-rose-400/[0.08]" : "border-emerald-400/20 bg-emerald-400/[0.06]"}`}>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Your last move</div>
              <div className="mt-0.5 text-sm text-slate-100">
                <span className="font-mono font-semibold">{review.san}</span>{" "}
                {reviewIsMistake ? (
                  <span className="text-rose-200">
                    {severity}, lost {(review.cpLoss / 100).toFixed(1)} pawns{review.bestMove ? <> · better: <span className="font-mono">{review.bestMove}</span></> : null}
                  </span>
                ) : (
                  <span className="text-emerald-200">fine{review.bestMove && review.bestMove !== review.san ? <> · engine liked <span className="font-mono">{review.bestMove}</span> too</> : null}</span>
                )}
              </div>
            </div>
          )}

          <div className="mt-3">
            <div className="text-[11px] text-slate-400">
              {reviewIsMistake ? "This is worth a conversation. Ask your coach:" : "Want to understand the position? Ask your coach:"}
            </div>
            <div className="mt-1 rounded-lg bg-black/30 px-2.5 py-1.5 text-[11px] italic text-slate-300">&ldquo;{question}&rdquo;</div>
            <button onClick={copyQuestion} className="btn btn-primary mt-2 w-full justify-center text-xs">
              {copied ? "Copied ✓ — paste it in the chat" : st.agentConnected ? "Copy question for the coach" : "Copy question (open in ChatGPT to ask)"}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-600">Hidden during puzzles so it never gives the answer away.</p>
        </div>
      )}
    </div>
  );
}
