"use client";
import { useSyncExternalStore } from "react";
import { QUICK_PROMPTS } from "@/lib/prompts";

const KEY = "chessup:onboarded";
let forced = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function openOnboarding() {
  forced = true;
  notify();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot(): boolean {
  if (forced) return true;
  try {
    return !localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function Onboarding() {
  const open = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function close() {
    forced = false;
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    notify();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4" onClick={close}>
      <div
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0f131c] p-6 md:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 grid place-items-center text-slate-950 text-2xl">♞</div>
          <div>
            <h1 id="onboarding-title" className="text-xl font-semibold tracking-tight">Welcome to ChessUp</h1>
            <p className="text-sm text-slate-400">A chess board your AI browser agent can coach you on.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Row n={1} title="Open this page inside an agent">
            In the <b className="text-slate-100">ChatGPT app</b>: open a new browser tab (the + next to your tabs), paste the link, and chat in the side panel.
            In <b className="text-slate-100">Chrome</b>: enable <code className="text-[11px] text-amber-200/90">chrome://flags/#enable-webmcp-testing</code> and use an agent that supports WebMCP.
            The header pill turns green when the agent is connected.
          </Row>
          <Row n={2} title="Say what you want, in any language">
            &ldquo;{QUICK_PROMPTS[0].prompt}&rdquo; — or ask for puzzles, a lesson, or a review. The coach sees the board and your history through 17 WebMCP tools.
          </Row>
          <Row n={3} title="You play, the coach adapts">
            Move by clicking or dragging. The coach replies on the board, draws arrows, builds puzzles for your weak spots and awards XP and badges. Everything is saved in this browser.
          </Row>
        </div>

        <p className="mt-5 text-xs text-slate-500 leading-relaxed">
          No agent? The board still works: play the built-in bot, and use the <b>Dev tools</b> panel at the bottom to call any coaching tool by hand.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={close} className="btn btn-primary px-4 py-2 text-sm">Let&apos;s go</button>
        </div>
      </div>
    </div>
  );
}

function Row({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <span className="h-7 w-7 shrink-0 grid place-items-center rounded-full bg-amber-400/15 text-sm font-bold text-amber-200">{n}</span>
      <div>
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <p className="mt-1 text-sm text-slate-400 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
