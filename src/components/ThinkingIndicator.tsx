"use client";
/**
 * Status card shown in sparring mode while it is the coach's move. Counts the seconds
 * since the last move and, if the agent stays quiet, explains that agents only act when
 * spoken to and offers a nudge to copy.
 */
import { useEffect, useState } from "react";
import { useApp } from "@/lib/useApp";

const NUDGE = "your move";

/** Shown while it is the coach's move. Elapsed time, then a nudge if the agent stays quiet. */
export function ThinkingIndicator() {
  const st = useApp();
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const since = st.lastMoveAt ? Math.max(0, Math.floor((now - st.lastMoveAt) / 1000)) : 0;
  const slow = since >= 40;
  const noAgent = !st.agentConnected;

  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs ${slow || noAgent ? "border-amber-400/25 bg-amber-400/[0.06] text-amber-100/90" : "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-100/90"}`}>
      <div className="flex items-center gap-3">
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-white/5 text-base">
          <span className="animate-[spin_6s_linear_infinite] inline-block">♞</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{noAgent ? "Sparring needs a connected coach" : slow ? "The coach is quiet" : "Sparring: coach is thinking"}</span>
            <Dots />
            <span className="ml-auto tabular-nums text-[11px] opacity-70">{since}s</span>
          </div>
          <div className="mt-0.5 opacity-80">
            {noAgent
              ? "Switch the opponent back to a bot to keep playing."
              : slow
                ? "Sparring stops whenever you chat. Nudge it, or switch the opponent to a bot:"
                : "It replies on the board through WebMCP."}
          </div>
        </div>
        {!noAgent && slow && (
          <button
            onClick={() => {
              navigator.clipboard?.writeText(NUDGE).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn btn-primary shrink-0"
          >
            {copied ? "Copied ✓" : `Copy “${NUDGE}”`}
          </button>
        )}
      </div>
    </div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1 w-1 rounded-full bg-current opacity-70 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}
