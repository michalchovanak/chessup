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
        <p className="text-sm text-slate-300 leading-relaxed">
          No AI agent is talking to this page yet. You can play against the built-in bot right away, or open this page inside an agent browser so it can coach you:
        </p>
        <ol className="mt-3 space-y-2 text-sm text-slate-300">
          <li className="flex gap-2.5">
            <Step n={1} />
            <span>
              In the <b className="text-slate-100">ChatGPT app</b>, open a new browser tab (the + next to your tabs) and paste this URL. Chrome works too with{" "}
              <code className="text-[11px] text-amber-200/90">chrome://flags/#enable-webmcp-testing</code>.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Step n={2} />
            <span>Wait for the header pill to turn green: <b className="text-emerald-300">Agent connected</b>.</span>
          </li>
          <li className="flex gap-2.5">
            <Step n={3} />
            <span>Tell the agent what you want, in any language. It plays and coaches through the board.</span>
          </li>
        </ol>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <a href={chatgptDeeplink(url)} className="btn btn-primary text-center py-2">
            Open in ChatGPT ↗
          </a>
          <button onClick={() => copy("url", url)} className="btn py-2" title="Copy the link to paste into any agent browser">
            {copied === "url" ? "Copied ✓" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Requires the ChatGPT desktop app with site tools (GPT-5.6 Sol or Terra).</p>
      </Panel>
    );
  }

  return (
    <Panel
      title="Start"
      badge={<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      action={
        <button onClick={openOnboarding} className="text-[11px] text-slate-400 hover:text-amber-200">
          How it works
        </button>
      }
    >
      <p className="text-sm text-slate-300 leading-relaxed">
        Your coach is connected. Say anything in the chat, or copy one of these to get going:
      </p>
      <ul className="mt-3 grid gap-2">
        {QUICK_PROMPTS.map((q) => (
          <li key={q.id} className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-amber-400/30 transition">
            <span className="text-lg leading-6">{q.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-100">{q.title}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{q.blurb}</div>
            </div>
            <button
              onClick={() => copy(q.id, q.prompt)}
              className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
              title={q.prompt}
            >
              {copied === q.id ? "Copied ✓" : "Copy"}
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function Step({ n }: { n: number }) {
  return <span className="mt-0.5 h-5 w-5 shrink-0 grid place-items-center rounded-full bg-amber-400/15 text-[11px] font-bold text-amber-200">{n}</span>;
}
