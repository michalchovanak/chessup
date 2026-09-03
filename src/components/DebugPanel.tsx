"use client";
import { useState } from "react";
import { tools, runTool } from "@/lib/tools";

const EXAMPLES: Record<string, unknown> = {
  make_move: { san: "e4" },
  get_legal_moves: { square: "e2" },
  new_game: { playerColor: "white", opponent: "bot", botLevel: 2 },
  set_position: {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    title: "Scholar's mate",
    goal: "White to play and mate in 1",
    hint: "The f7 pawn is only defended by the king.",
    theme: "mate_in_1",
    solution: ["Qxf7#"],
  },
  highlight_squares: { squares: ["f7", "h5", "c4"], color: "red" },
  draw_arrows: { arrows: [{ from: "h5", to: "f7", color: "red" }, { from: "c4", to: "f7", color: "orange" }] },
  coach_note: { text: "Look at f7. How many of your pieces attack it, and how many defend it?", kind: "question" },
  set_lesson_plan: {
    title: "Today: stop hanging pieces",
    steps: [
      { title: "Warm-up game", description: "Play 10 moves, I watch for loose pieces.", status: "active" },
      { title: "Drill: undefended pieces", description: "3 custom puzzles", status: "todo" },
      { title: "Review", status: "todo" },
    ],
  },
  update_lesson_step: { index: 0, status: "done" },
  award_badge: { name: "First blood", description: "Won your first piece", emoji: "🗡️" },
  add_xp: { amount: 25, reason: "Great fork!" },
  record_mistake: { category: "king_safety", severity: "mistake", description: "Delayed castling while the centre was opening.", movePlayed: "a6", betterMove: "O-O" },
  undo_move: { count: 1 },
};

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tools[0].name);
  const [input, setInput] = useState("{}");
  const [output, setOutput] = useState<string>("");
  const [err, setErr] = useState<string>("");

  function choose(n: string) {
    setName(n);
    setInput(JSON.stringify(EXAMPLES[n] ?? {}, null, 2));
    setOutput("");
    setErr("");
  }

  async function run() {
    setErr("");
    let parsed: Record<string, unknown> = {};
    try {
      parsed = input.trim() ? JSON.parse(input) : {};
    } catch (e) {
      setErr(`Invalid JSON: ${e instanceof Error ? e.message : e}`);
      return;
    }
    const out = await runTool(name, parsed, "debug");
    setOutput(JSON.stringify(out, null, 2));
  }

  const tool = tools.find((t) => t.name === name)!;

  return (
    <section className="rounded-2xl border border-dashed border-white/10">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 px-4 py-3 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Dev tools · call a tool manually</span>
        <span className="ml-auto text-slate-600 text-xs">{open ? "hide" : "show"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-3 md:grid-cols-[220px_1fr]">
          <div className="flex md:flex-col gap-1 flex-wrap">
            {tools.map((t) => (
              <button
                key={t.name}
                onClick={() => choose(t.name)}
                className={`text-left font-mono text-xs px-2.5 py-1.5 rounded-lg ${t.name === name ? "bg-amber-400/15 text-amber-200" : "text-slate-400 hover:bg-white/5"}`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 leading-relaxed mb-2">{tool.description}</p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              rows={6}
              className="w-full font-mono text-xs bg-black/40 border border-white/10 rounded-lg p-2 text-slate-200 outline-none focus:border-amber-400/40"
            />
            <div className="flex items-center gap-3 mt-2">
              <button onClick={run} className="btn btn-primary">Run {name}</button>
              {err && <span className="text-xs text-rose-300">{err}</span>}
            </div>
            {output && <pre className="mt-2 max-h-64 overflow-auto text-[11px] font-mono bg-black/40 border border-white/10 rounded-lg p-2 text-emerald-200/90 whitespace-pre-wrap break-all">{output}</pre>}
          </div>
        </div>
      )}
    </section>
  );
}
