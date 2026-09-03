"use client";
/**
 * Side-panel entry point. Without an agent it explains how to open the board in ChatGPT;
 * with an agent it offers one-click prompts to copy into the chat, and collapses to a
 * single line once the coach has made its first tool call.
 */
import { useState } from "react";
import { Panel } from "./Panel";
import { useApp } from "@/lib/useApp";
import { QUICK_PROMPTS, chatgptDeeplink } from "@/lib/prompts";
import { openOnboarding } from "./Onboarding";

const REVIEW_PROMPT = {
  id: "review-game",
  emoji: "🔎",
  title: "Ask for a review",
  blurb: "See the key moment marked on the board.",
  prompt: "Review the game so far. Mark the most important moment on the board, show me the better move and tell me what I should think about next.",
};

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  return {
    copied,
    copy: (id: string, text: string) => {
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    },
  };
}

export function StartPanel() {
  const st = useApp();
  const { copied, copy } = useCopy();
  const [expanded, setExpanded] = useState(false);
  const agentActive = st.toolLog.some((t) => t.source === "agent");
  const latestMoveWasAMistake = (st.lastReview?.cpLoss ?? 0) >= 100;
  const needsMoreMoves = st.moves.length < 4 && !latestMoveWasAMistake;
  const primaryPrompt = latestMoveWasAMistake ? QUICK_PROMPTS[0] : REVIEW_PROMPT;
  const url = typeof window !== "undefined" ? window.location.origin + "/" : "https://chessup-gamma.vercel.app/";

  if (!st.hydrated) return null;

  if (!st.agentConnected) {
    return (
      <Panel
        title="Connect a coach"
        badge={<span className="h-1.5 w-1.5 rounded-full bg-slate-500" />}
        action={
          <button onClick={openOnboarding} className="text-[11px] text-slate-400 hover:text-amber-200">
            How it works
          </button>
        }
      >
        <p className="text-sm leading-relaxed text-slate-300">
          The board works solo. Open it in ChatGPT to add a coach that can see your moves, mark mistakes and build drills from them.
        </p>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <a href={chatgptDeeplink(url)} className="btn btn-primary py-2.5 text-center text-sm">
            Open with a coach ↗
          </a>
          <button onClick={() => copy("url", url)} className="btn py-2.5" title="Copy the link to paste into any agent browser">
            {copied === "url" ? "Copied ✓" : "Copy link"}
          </button>
        </div>
      </Panel>
    );
  }

  if (agentActive && !expanded) {
    return (
      <div className="panel-surface flex items-center gap-3 rounded-2xl px-4 py-3 text-xs text-slate-400">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">✓</span>
        <span><b className="font-medium text-slate-200">Coach ready.</b> Ask for a review, lesson or drill in chat.</span>
        <button onClick={() => setExpanded(true)} className="ml-auto shrink-0 text-slate-500 transition-colors hover:text-amber-200">Show prompts</button>
      </div>
    );
  }

  return (
    <Panel
      title="Coach"
      badge={<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      action={
        <span className="flex gap-3">
          {agentActive && <button onClick={() => setExpanded(false)} className="text-[11px] text-slate-500 hover:text-slate-300">hide</button>}
          <button onClick={openOnboarding} className="text-[11px] text-slate-400 hover:text-amber-200">How it works</button>
        </span>
      }
    >
      <p className="text-sm leading-relaxed text-slate-300">The bot plays instantly. Your coach reviews the game when you ask in chat.</p>
      {needsMoreMoves ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-300 text-xs font-semibold text-stone-950">1</span>
          <span>
            <span className="block text-sm font-medium text-stone-100">Play a few moves</span>
            <span className="block text-[11px] text-slate-500">Start on the board. Your coach will follow the game.</span>
          </span>
        </div>
      ) : (
        <button
          onClick={() => copy(primaryPrompt.id, primaryPrompt.prompt)}
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-left transition-colors hover:border-amber-300/35 hover:bg-amber-300/[0.09] active:scale-[0.985]"
        >
          <span className="text-base">{primaryPrompt.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-stone-100">{primaryPrompt.title}</span>
            <span className="block text-[11px] text-slate-500">{primaryPrompt.blurb}</span>
          </span>
          <span className={`text-[10px] font-medium ${copied === primaryPrompt.id ? "text-emerald-300" : "text-amber-200/70"}`}>
            {copied === primaryPrompt.id ? "Copied ✓" : "Copy"}
          </span>
        </button>
      )}
      <details className="group mt-2">
        <summary className="cursor-pointer list-none py-1 text-[11px] text-slate-500 transition-colors hover:text-slate-300">More ideas <span className="inline-block transition-transform group-open:rotate-180">↓</span></summary>
        <ul className="mt-1 divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {QUICK_PROMPTS.slice(1).map((q) => (
            <li key={q.id}>
              <button
                onClick={() => copy(q.id, q.prompt)}
                className="flex w-full items-center gap-2 py-2.5 text-left text-xs text-slate-400 transition-colors hover:text-slate-200"
                title={q.prompt}
              >
                <span>{q.emoji}</span><span>{q.title}</span><span className="ml-auto text-slate-600">{copied === q.id ? "Copied ✓" : "Copy"}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}
