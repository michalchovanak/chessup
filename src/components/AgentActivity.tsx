"use client";
import { useState } from "react";
import { Panel, Empty } from "./Panel";
import { useApp } from "@/lib/useApp";

export function AgentActivity() {
  const st = useApp();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Panel title="Agent activity" badge={<span className="text-[10px] text-slate-500">{st.toolLog.length} tool calls</span>}>
      {st.toolLog.length === 0 ? (
        <Empty>Every WebMCP tool call the agent makes shows up here, with its input and output.</Empty>
      ) : (
        <ul className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {st.toolLog.map((t) => (
            <li key={t.id} className="rounded-lg bg-white/[0.02] border border-white/5">
              <button onClick={() => setOpen(open === t.id ? null : t.id)} className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs">
                <span className={`h-1.5 w-1.5 rounded-full ${t.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span className="font-mono text-slate-200">{t.tool}</span>
                <span className="text-slate-600">{t.source === "debug" ? "manual" : "agent"}</span>
                <span className="ml-auto text-slate-600">{t.durationMs}ms · {new Date(t.at).toLocaleTimeString()}</span>
              </button>
              {open === t.id && (
                <div className="px-3 pb-2 grid gap-1.5 text-[11px] font-mono">
                  <div>
                    <div className="text-slate-500">input</div>
                    <pre className="whitespace-pre-wrap break-all text-slate-300 bg-black/30 rounded p-2 max-h-32 overflow-auto">{JSON.stringify(t.input, null, 1)}</pre>
                  </div>
                  <div>
                    <div className="text-slate-500">output</div>
                    <pre className="whitespace-pre-wrap break-all text-slate-300 bg-black/30 rounded p-2 max-h-40 overflow-auto">{JSON.stringify(t.output, null, 1)}</pre>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
