"use client";
import { levelFor, xpForLevel } from "@/lib/store";
import { useApp } from "@/lib/useApp";

export function Header() {
  const st = useApp();
  const level = levelFor(st.profile.xp);
  const cur = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const pct = Math.min(100, Math.round(((st.profile.xp - cur) / (next - cur)) * 100));

  return (
    <header className="flex flex-wrap items-center gap-4 md:gap-8 px-5 md:px-8 py-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 grid place-items-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
          ♞
        </div>
        <div>
          <div className="font-semibold tracking-tight text-lg leading-none">ChessUp</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mt-1">WebMCP chess coach</div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:ml-auto">
        <div className="hidden sm:flex flex-col items-end min-w-[180px]">
          <div className="flex items-baseline gap-2 text-sm">
            <span className="text-slate-400">Level</span>
            <span className="font-semibold text-amber-300 text-base">{level}</span>
            <span className="text-slate-500 text-xs">{st.profile.xp} XP</span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <AgentPill connected={st.agentConnected} hydrated={st.hydrated} />
      </div>
    </header>
  );
}

function AgentPill({ connected, hydrated }: { connected: boolean; hydrated: boolean }) {
  const label = !hydrated ? "…" : connected ? "Agent connected" : "No agent detected";
  return (
    <div
      title={connected ? "navigator.modelContext found: 16 tools registered via WebMCP" : "Open this page in ChatGPT's browser or Chrome with chrome://flags/#enable-webmcp-testing to let an agent coach you."}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
        connected ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-400"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)] animate-pulse" : "bg-slate-500"}`} />
      {label}
    </div>
  );
}
