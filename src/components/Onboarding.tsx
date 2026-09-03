"use client";
import { useSyncExternalStore } from "react";
import { chatgptDeeplink } from "@/lib/prompts";

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
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md" onClick={close}>
      <div
        className="modal-card relative my-auto max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#111412] p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <button onClick={close} className="btn absolute right-4 top-4 h-8 min-h-8 w-8 px-0 text-slate-500" aria-label="Close guide">×</button>

        <div className="flex items-center gap-3 pr-10">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-300 text-xl text-stone-950">♞</div>
          <div>
            <h1 id="onboarding-title" className="text-xl font-semibold tracking-[-0.025em] text-stone-100">A board and a coach, together.</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Play normally. When you ask, the agent can read the game, explain mistakes on the board and turn them into a personal drill.
        </p>

        <ol className="mt-5 space-y-1 rounded-xl border border-white/[0.07] bg-black/10 p-2">
          <Row n={1} title="Play a game" description="The board keeps the full move history." />
          <Row n={2} title="Ask in chat" description="The coach reads the current position and your profile." />
          <Row n={3} title="Practise here" description="Arrows, lessons and puzzles appear on the board." />
        </ol>

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:justify-end">
          <a href={chatgptDeeplink(typeof window !== "undefined" ? window.location.origin + "/" : "https://chessup-gamma.vercel.app/")} className="btn text-sm">Open in ChatGPT ↗</a>
          <button onClick={close} className="btn btn-primary px-5 text-sm">Continue</button>
        </div>
      </div>
    </div>
  );
}

function Row({ n, title, description }: { n: number; title: string; description: string }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.05] text-[10px] font-medium text-slate-400">{n}</span>
      <div className="min-w-0">
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <span className="ml-2 text-xs text-slate-500">{description}</span>
      </div>
    </li>
  );
}
