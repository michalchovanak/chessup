"use client";
import { useApp } from "@/lib/useApp";
import { openOnboarding } from "./Onboarding";

export function Header() {
  const st = useApp();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0b0d0c]/90 backdrop-blur-lg">
      <div className="mx-auto flex h-[56px] max-w-[1380px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none text-amber-300" aria-hidden>♞</span>
          <span className="text-[19px] font-semibold tracking-[-0.025em] text-stone-100">ChessUp</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <AgentPill connected={st.agentConnected} hydrated={st.hydrated} count={st.registeredTools.length} />
          <button onClick={openOnboarding} title="How ChessUp works" aria-label="Open guide" className="grid h-8 w-8 place-items-center rounded-lg text-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200">
            ?
          </button>
        </div>
      </div>
    </header>
  );
}

function AgentPill({ connected, hydrated, count }: { connected: boolean; hydrated: boolean; count: number }) {
  const label = !hydrated ? "…" : connected ? `WebMCP live · ${count} tools` : "Solo mode";
  return (
    <div
      title={connected ? `modelContext found: ${count} tools registered right now (the set changes with context)` : "Open this page in ChatGPT's browser or Chrome with chrome://flags/#enable-webmcp-testing to let an agent coach you."}
      className={`flex h-8 items-center gap-2 rounded-lg px-2 text-[11px] font-medium ${
        connected ? "text-emerald-300" : "text-slate-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-600"}`} />
      <span>{label}</span>
    </div>
  );
}
