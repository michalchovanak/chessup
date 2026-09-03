"use client";
import { useState } from "react";
import { Panel } from "./Panel";
import { useApp } from "@/lib/useApp";
import { QUICK_PROMPTS, chatgptDeeplink } from "@/lib/prompts";
import { openOnboarding } from "./Onboarding";

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
      <p className="text-sm leading-relaxed text-slate-300">Ask in the chat beside the board. The coach can review the game, mark the board and create practice.</p>
      <button
        onClick={() => copy(QUICK_PROMPTS[0].id, QUICK_PROMPTS[0].prompt)}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3 text-left transition-colors hover:border-amber-300/35 hover:bg-amber-300/[0.09] active:scale-[0.985]"
      >
        <span className="text-base">{QUICK_PROMPTS[0].emoji}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-stone-100">{QUICK_PROMPTS[0].title}</span>
          <span className="block text-[11px] text-slate-500">{QUICK_PROMPTS[0].blurb}</span>
        </span>
        <span className={`text-[10px] font-medium ${copied === QUICK_PROMPTS[0].id ? "text-emerald-300" : "text-amber-200/70"}`}>
          {copied === QUICK_PROMPTS[0].id ? "Copied ✓" : "Copy"}
        </span>
      </button>
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
