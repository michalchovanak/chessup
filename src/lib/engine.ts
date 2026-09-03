"use client";
/**
 * Stockfish in the browser.
 *
 * Loads the single-threaded "lite" Stockfish 18 WebAssembly build from /public/engine
 * into a Web Worker and talks to it with the UCI protocol. Requests are queued so only
 * one search runs at a time. Results come back as SAN lines with scores from the side
 * to move (and from White's point of view for the evaluation bar).
 *
 * Used for: the evaluation bar, scoring every human move in centipawn loss, verifying
 * agent-written puzzles, and the `analyze_position` WebMCP tool.
 */
import { Chess } from "chess.js";

/** Stockfish 18 (lite, single-threaded WASM) driven over UCI in a Web Worker. */

export interface EngineLine {
  multipv: number;
  depth: number;
  /** Centipawns from the side to move's perspective (undefined when mate). */
  cp?: number;
  /** Mate in N (positive: side to move mates; negative: gets mated). */
  mate?: number;
  pvUci: string[];
  pv: string[];
}

export interface Analysis {
  fen: string;
  turn: "w" | "b";
  depth: number;
  lines: EngineLine[];
  best: EngineLine | null;
  bestMove: string | null;
  /** Score from the side to move's perspective, mate folded into ±(10000 - n). */
  score: number;
  /** Score from White's perspective, same folding. */
  scoreWhite: number;
}

export type EngineStatus = "off" | "loading" | "ready" | "error";

const MATE_SCORE = 10000;

export function foldScore(line: { cp?: number; mate?: number } | null | undefined): number {
  if (!line) return 0;
  if (line.mate !== undefined) return line.mate > 0 ? MATE_SCORE - line.mate : -MATE_SCORE - line.mate;
  return line.cp ?? 0;
}

export function formatScore(scoreWhite: number): string {
  if (Math.abs(scoreWhite) >= MATE_SCORE - 200) {
    const n = MATE_SCORE - Math.abs(scoreWhite);
    return `${scoreWhite > 0 ? "" : "-"}M${n}`;
  }
  const p = scoreWhite / 100;
  return `${p > 0 ? "+" : ""}${p.toFixed(1)}`;
}

type Job = { fen: string; depth: number; multipv: number; resolve: (a: Analysis) => void; reject: (e: Error) => void };

class Engine {
  status: EngineStatus = "off";
  private worker: Worker | null = null;
  private loadPromise: Promise<void> | null = null;
  private listeners = new Set<(line: string) => void>();
  private queue: Job[] = [];
  private busy = false;
  private statusListeners = new Set<(s: EngineStatus) => void>();

  onStatus(l: (s: EngineStatus) => void) {
    this.statusListeners.add(l);
    return () => this.statusListeners.delete(l);
  }

  private setStatus(s: EngineStatus) {
    this.status = s;
    this.statusListeners.forEach((l) => l(s));
  }

  /** Loads the worker once. Resolves when the engine answered `uciok` and `readyok`. */
  load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    if (typeof window === "undefined" || typeof Worker === "undefined" || typeof WebAssembly === "undefined") {
      this.setStatus("error");
      return Promise.reject(new Error("Web Workers or WebAssembly are unavailable."));
    }
    this.setStatus("loading");
    this.loadPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.setStatus("error");
        reject(new Error("Engine load timed out."));
      }, 60000);
      try {
        const w = new Worker("/engine/stockfish.js");
        this.worker = w;
        w.onmessage = (e: MessageEvent) => {
          const line = typeof e.data === "string" ? e.data : String(e.data);
          for (const l of this.listeners) l(line);
        };
        w.onerror = (err) => {
          clearTimeout(timer);
          this.setStatus("error");
          reject(new Error(`Engine worker error: ${err.message}`));
        };
        const onLine = (line: string) => {
          if (line === "uciok") {
            this.send("setoption name UCI_AnalyseMode value true");
            this.send("isready");
          } else if (line === "readyok") {
            this.listeners.delete(onLine);
            clearTimeout(timer);
            this.setStatus("ready");
            resolve();
          }
        };
        this.listeners.add(onLine);
        this.send("uci");
      } catch (e) {
        clearTimeout(timer);
        this.setStatus("error");
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
    return this.loadPromise;
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  /** Analyse a position. Requests are serialised; each resolves on `bestmove`. */
  analyse(fen: string, opts: { depth?: number; multipv?: number } = {}): Promise<Analysis> {
    const depth = Math.max(1, Math.min(24, Math.round(opts.depth ?? 12)));
    const multipv = Math.max(1, Math.min(5, Math.round(opts.multipv ?? 1)));
    return new Promise<Analysis>((resolve, reject) => {
      this.queue.push({ fen, depth, multipv, resolve, reject });
      void this.pump();
    });
  }

  private async pump() {
    if (this.busy) return;
    const job = this.queue.shift();
    if (!job) return;
    this.busy = true;
    try {
      await this.load();
      const result = await this.run(job);
      job.resolve(result);
    } catch (e) {
      job.reject(e instanceof Error ? e : new Error(String(e)));
    } finally {
      this.busy = false;
      void this.pump();
    }
  }

  private run(job: Job): Promise<Analysis> {
    return new Promise<Analysis>((resolve, reject) => {
      const lines = new Map<number, EngineLine>();
      let finished = false;
      const timer = setTimeout(() => {
        if (finished) return;
        finished = true;
        this.listeners.delete(onLine);
        this.send("stop");
        reject(new Error("Engine analysis timed out."));
      }, 20000 + job.depth * 1500);

      const onLine = (line: string) => {
        if (line.startsWith("info ") && line.includes(" pv ")) {
          const parsed = parseInfo(line);
          if (parsed) lines.set(parsed.multipv, parsed);
        } else if (line.startsWith("bestmove")) {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          this.listeners.delete(onLine);
          resolve(buildAnalysis(job.fen, job.depth, [...lines.values()]));
        }
      };
      this.listeners.add(onLine);
      this.send("stop");
      this.send(`setoption name MultiPV value ${job.multipv}`);
      this.send("ucinewgame");
      this.send(`position fen ${job.fen}`);
      this.send(`go depth ${job.depth}`);
    });
  }
}

function parseInfo(line: string): EngineLine | null {
  const tok = line.split(" ");
  let depth = 0;
  let multipv = 1;
  let cp: number | undefined;
  let mate: number | undefined;
  let pvUci: string[] = [];
  for (let i = 0; i < tok.length; i++) {
    const t = tok[i];
    if (t === "depth") depth = Number(tok[i + 1]);
    else if (t === "multipv") multipv = Number(tok[i + 1]);
    else if (t === "score") {
      if (tok[i + 1] === "cp") cp = Number(tok[i + 2]);
      else if (tok[i + 1] === "mate") mate = Number(tok[i + 2]);
    } else if (t === "pv") {
      pvUci = tok.slice(i + 1);
      break;
    }
  }
  if (!pvUci.length || (cp === undefined && mate === undefined)) return null;
  return { multipv, depth, cp, mate, pvUci, pv: [] };
}

function buildAnalysis(fen: string, depth: number, raw: EngineLine[]): Analysis {
  const chess = new Chess(fen);
  const turn = chess.turn() as "w" | "b";
  const lines = raw
    .sort((a, b) => a.multipv - b.multipv)
    .map((l) => ({ ...l, pv: uciToSan(fen, l.pvUci.slice(0, 8)) }));
  const best = lines[0] ?? null;
  const score = foldScore(best);
  return {
    fen,
    turn,
    depth: best?.depth ?? depth,
    lines,
    best,
    bestMove: best?.pv[0] ?? null,
    score,
    scoreWhite: turn === "w" ? score : -score,
  };
}

export function uciToSan(fen: string, uci: string[]): string[] {
  const c = new Chess(fen);
  const out: string[] = [];
  for (const u of uci) {
    try {
      const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined });
      out.push(m.san);
    } catch {
      break;
    }
  }
  return out;
}

export const engine = new Engine();
