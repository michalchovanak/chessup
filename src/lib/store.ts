"use client";
import { Chess, type Move, type Square } from "chess.js";
import {
  START_FEN,
  analyseHumanMove,
  gameStatus,
  pickBotMove,
  uid,
  validateFen,
} from "./chessLogic";
import type {
  AgentEvent,
  AnnoColor,
  AppState,
  ArrowAnno,
  Badge,
  CoachNote,
  Color,
  GameSettings,
  Highlight,
  LessonStep,
  Mistake,
  MistakeCategory,
  MoveRecord,
  NoteKind,
  Profile,
  Puzzle,
  Severity,
  ToolCallRecord,
} from "./types";

const STORAGE_KEY = "chessup:v1";
const MAX_MISTAKES = 60;
const MAX_NOTES = 40;
const MAX_TOOL_LOG = 80;

function defaultProfile(): Profile {
  const now = Date.now();
  return {
    name: "Player",
    xp: 0,
    badges: [],
    mistakes: [],
    puzzles: { attempted: 0, solved: 0, failed: 0, byTheme: {} },
    games: { played: 0, won: 0, lost: 0, drawn: 0 },
    sessions: 0,
    createdAt: now,
    lastSeenAt: now,
    xpLog: [],
  };
}

function defaultSettings(): GameSettings {
  return { playerColor: "w", opponent: "bot", botLevel: 2 };
}

export function initialState(): AppState {
  return {
    hydrated: false,
    agentConnected: false,
    fen: START_FEN,
    startFen: START_FEN,
    moves: [],
    settings: defaultSettings(),
    gameRecorded: false,
    highlights: [],
    arrows: [],
    lesson: { title: "Lesson plan", steps: [] },
    puzzle: null,
    notes: [],
    profile: defaultProfile(),
    events: [],
    toolLog: [],
    thinking: false,
  };
}

type Listener = () => void;

export interface MoveInput {
  san?: string;
  from?: string;
  to?: string;
  promotion?: string;
}

export interface SetPositionInput {
  fen: string;
  title?: string;
  goal?: string;
  hint?: string;
  theme?: string;
  solution?: string[];
  playerColor?: Color;
}

class Store {
  private state: AppState = initialState();
  private serverState: AppState = initialState();
  private listeners = new Set<Listener>();
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private botTimer: ReturnType<typeof setTimeout> | null = null;

  getState = (): AppState => this.state;
  getServerState = (): AppState => this.serverState;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private set(patch: Partial<AppState>) {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l();
    this.schedulePersist();
  }

  private schedulePersist() {
    if (typeof window === "undefined" || !this.state.hydrated) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      const { profile, lesson, fen, startFen, moves, settings, puzzle, notes, gameRecorded } = this.state;
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ profile, lesson, fen, startFen, moves, settings, puzzle, notes, gameRecorded })
        );
      } catch {
        /* ignore quota errors */
      }
    }, 150);
  }

  hydrate() {
    if (this.state.hydrated) return;
    let patch: Partial<AppState> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        patch = {
          profile: { ...defaultProfile(), ...(saved.profile ?? {}) },
          lesson: saved.lesson ?? this.state.lesson,
          fen: saved.fen && validateFen(saved.fen).ok ? saved.fen : START_FEN,
          startFen: saved.startFen ?? START_FEN,
          moves: saved.moves ?? [],
          settings: { ...defaultSettings(), ...(saved.settings ?? {}) },
          puzzle: saved.puzzle ?? null,
          notes: saved.notes ?? [],
          gameRecorded: saved.gameRecorded ?? false,
        };
      }
    } catch {
      /* corrupted storage: start fresh */
    }
    const profile = patch.profile ?? this.state.profile;
    profile.sessions += 1;
    profile.lastSeenAt = Date.now();
    this.set({ ...patch, profile, hydrated: true });
    this.maybeScheduleBot();
  }

  setAgentConnected(v: boolean) {
    if (this.state.agentConnected !== v) this.set({ agentConnected: v });
    if (v && this.state.settings.opponent === "bot" && this.state.moves.length === 0) {
      // A coach is here: let the agent play the other side unless the human changes it.
      this.set({ settings: { ...this.state.settings, opponent: "agent" } });
    }
  }

  // ---------- events ----------

  pushEvent(type: string, message: string, data?: Record<string, unknown>) {
    const ev: AgentEvent = { id: uid(), at: Date.now(), type, message, data };
    this.set({ events: [...this.state.events, ev].slice(-30) });
  }

  drainEvents(): AgentEvent[] {
    const evs = this.state.events;
    if (evs.length) this.set({ events: [] });
    return evs;
  }

  logToolCall(rec: Omit<ToolCallRecord, "id" | "at">) {
    const entry: ToolCallRecord = { id: uid(), at: Date.now(), ...rec };
    this.set({ toolLog: [entry, ...this.state.toolLog].slice(0, MAX_TOOL_LOG) });
  }

  // ---------- game ----------

  chess(): Chess {
    return new Chess(this.state.fen);
  }

  isHumanTurn(): boolean {
    const turn = this.chess().turn();
    const { playerColor, opponent } = this.state.settings;
    if (opponent === "human") return true;
    return turn === playerColor;
  }

  makeMove(input: MoveInput, by: MoveRecord["by"]): { ok: true; move: Move; record: MoveRecord } | { ok: false; error: string } {
    const before = new Chess(this.state.fen);
    let move: Move | null = null;
    try {
      if (input.san) {
        move = before.move(input.san.trim());
      } else if (input.from && input.to) {
        move = before.move({ from: input.from, to: input.to, promotion: input.promotion ?? "q" });
      } else {
        return { ok: false, error: "Provide either `san` or both `from` and `to`." };
      }
    } catch (e) {
      const legal = new Chess(this.state.fen).moves();
      return {
        ok: false,
        error: `Illegal move (${e instanceof Error ? e.message : String(e)}). Legal moves: ${legal.join(", ")}`,
      };
    }
    if (!move) return { ok: false, error: "Illegal move." };

    const fenBefore = this.state.fen;
    const after = before; // `before` has been mutated by move()
    const flags: string[] = [];
    if (move.captured) flags.push("capture");
    if (after.isCheck()) flags.push("check");
    if (after.isCheckmate()) flags.push("checkmate");
    if (move.promotion) flags.push("promotion");
    if (move.san.startsWith("O-O")) flags.push("castle");

    const record: MoveRecord = {
      san: move.san,
      from: move.from,
      to: move.to,
      color: move.color as Color,
      by,
      fenBefore,
      fenAfter: after.fen(),
      flags,
    };

    this.set({
      fen: after.fen(),
      moves: [...this.state.moves, record],
      highlights: [],
      arrows: [],
      thinking: false,
    });

    if (by === "player") {
      const analysis = analyseHumanMove(new Chess(fenBefore), new Chess(after.fen()), move);
      for (const a of analysis) {
        this.recordMistake({
          category: a.category,
          severity: a.severity,
          description: a.description,
          fen: fenBefore,
          movePlayed: move.san,
          betterMove: a.betterMove,
          source: "auto",
        });
      }
      this.pushEvent("player_move", `Player played ${move.san}${analysis.length ? " (" + analysis.map((a) => a.category).join(", ") + ")" : ""}`, {
        san: move.san,
        flags,
        autoAnalysis: analysis,
      });
      this.checkPuzzleProgress(move);
    } else if (by === "agent") {
      this.pushEvent("agent_move", `Agent played ${move.san}`, { san: move.san });
    }

    this.checkGameOver();
    this.maybeScheduleBot();
    return { ok: true, move, record };
  }

  private checkGameOver() {
    const c = this.chess();
    const status = gameStatus(c);
    if (!status.over || this.state.gameRecorded || this.state.puzzle) return;
    const { playerColor, opponent } = this.state.settings;
    const profile = structuredClone(this.state.profile);
    profile.games.played += 1;
    let outcome: "won" | "lost" | "drawn" = "drawn";
    if (status.result === "1/2-1/2" || opponent === "human") outcome = "drawn";
    else if ((status.result === "1-0" && playerColor === "w") || (status.result === "0-1" && playerColor === "b")) outcome = "won";
    else outcome = "lost";
    profile.games[outcome] += 1;
    this.set({ profile, gameRecorded: true });
    if (outcome === "won") this.addXp(50, "Won a game");
    else if (outcome === "drawn") this.addXp(15, "Drew a game");
    else this.addXp(5, "Finished a game");
    this.pushEvent("game_over", `Game over: ${status.result} by ${status.reason}. Player ${outcome}.`, { result: status.result, reason: status.reason, outcome });
  }

  private maybeScheduleBot() {
    if (this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = null;
    }
    const st = this.state;
    if (!st.hydrated) return;
    const c = this.chess();
    if (c.isGameOver()) return;

    // Puzzle: the app plays the scripted opponent reply.
    if (st.puzzle && st.puzzle.status === "active") {
      const idx = st.puzzle.solutionIndex;
      const sol = st.puzzle.solution;
      if (idx < sol.length && idx % 2 === 1) {
        this.set({ thinking: true });
        this.botTimer = setTimeout(() => {
          const p = this.state.puzzle;
          if (!p || p.status !== "active") return;
          const r = this.makeMove({ san: sol[idx] }, "puzzle");
          if (r.ok) this.set({ puzzle: { ...p, solutionIndex: idx + 1 } });
          this.checkPuzzleProgress(null);
        }, 450);
      }
      return;
    }

    if (st.settings.opponent === "bot" && c.turn() !== st.settings.playerColor) {
      this.set({ thinking: true });
      this.botTimer = setTimeout(() => {
        const cc = this.chess();
        if (cc.isGameOver() || this.state.settings.opponent !== "bot") {
          this.set({ thinking: false });
          return;
        }
        const m = pickBotMove(cc, this.state.settings.botLevel);
        if (m) this.makeMove({ san: m.san }, "bot");
      }, 350 + Math.random() * 400);
    }
  }

  undoMove(count = 1): { ok: boolean; undone: string[]; fen: string } {
    const moves = [...this.state.moves];
    const undone: string[] = [];
    for (let i = 0; i < count && moves.length; i++) {
      const m = moves.pop()!;
      undone.unshift(m.san);
    }
    const fen = moves.length ? moves[moves.length - 1].fenAfter : this.state.startFen;
    this.set({ fen, moves, highlights: [], arrows: [], gameRecorded: false, thinking: false });
    if (this.botTimer) clearTimeout(this.botTimer);
    const p = this.state.puzzle;
    if (p) {
      this.set({ puzzle: { ...p, solutionIndex: Math.max(0, p.solutionIndex - undone.length), status: p.status === "failed" ? "active" : p.status } });
    }
    this.pushEvent("undo", `Undid ${undone.length} move(s): ${undone.join(" ")}`);
    return { ok: true, undone, fen };
  }

  newGame(settings: Partial<GameSettings> = {}) {
    if (this.botTimer) clearTimeout(this.botTimer);
    const merged = { ...this.state.settings, ...settings };
    this.set({
      fen: START_FEN,
      startFen: START_FEN,
      moves: [],
      settings: merged,
      puzzle: null,
      highlights: [],
      arrows: [],
      gameRecorded: false,
      thinking: false,
    });
    this.pushEvent("new_game", `New game started. Player is ${merged.playerColor === "w" ? "White" : "Black"}, opponent: ${merged.opponent}.`);
    this.maybeScheduleBot();
  }

  setSettings(settings: Partial<GameSettings>) {
    this.set({ settings: { ...this.state.settings, ...settings } });
    this.maybeScheduleBot();
  }

  setPosition(input: SetPositionInput): { ok: true; puzzle: Puzzle | null } | { ok: false; error: string } {
    const v = validateFen(input.fen);
    if (!v.ok) return { ok: false, error: `Invalid FEN: ${v.error ?? "unknown error"}` };
    if (this.botTimer) clearTimeout(this.botTimer);

    // Validate the solution line against the position.
    const solution: string[] = [];
    if (input.solution?.length) {
      const c = new Chess(input.fen);
      for (const san of input.solution) {
        try {
          const m = c.move(san.trim());
          solution.push(m.san);
        } catch {
          return { ok: false, error: `Solution move "${san}" is illegal after ${solution.join(" ") || "the starting position"}. Legal moves here: ${c.moves().join(", ")}` };
        }
      }
    }

    const c = new Chess(input.fen);
    const playerColor: Color = input.playerColor ?? (c.turn() as Color);
    const isPuzzle = Boolean(input.title || input.goal || solution.length);
    let puzzle: Puzzle | null = null;
    const profile = structuredClone(this.state.profile);
    if (isPuzzle) {
      puzzle = {
        id: uid(),
        title: input.title ?? "Exercise",
        goal: input.goal ?? (solution.length ? "Find the best line." : "Study this position."),
        fen: input.fen,
        hint: input.hint,
        theme: input.theme,
        solution,
        solutionIndex: 0,
        status: "active",
        attempts: 0,
        startedAt: Date.now(),
      };
      profile.puzzles.attempted += 1;
      if (input.theme) {
        const t = (profile.puzzles.byTheme[input.theme] ??= { attempted: 0, solved: 0 });
        t.attempted += 1;
      }
    }
    this.set({
      fen: input.fen,
      startFen: input.fen,
      moves: [],
      puzzle,
      profile,
      highlights: [],
      arrows: [],
      gameRecorded: false,
      thinking: false,
      settings: { ...this.state.settings, playerColor, opponent: isPuzzle ? this.state.settings.opponent : this.state.settings.opponent },
    });
    this.pushEvent("position_set", isPuzzle ? `Puzzle "${puzzle!.title}" started.` : "Position set.");
    this.maybeScheduleBot();
    return { ok: true, puzzle };
  }

  private checkPuzzleProgress(playerMove: Move | null) {
    const p = this.state.puzzle;
    if (!p || p.status !== "active" || !p.solution.length) return;
    if (playerMove) {
      const expected = p.solution[p.solutionIndex];
      if (!expected) return;
      if (playerMove.san === expected) {
        const next = p.solutionIndex + 1;
        this.set({ puzzle: { ...p, solutionIndex: next } });
      } else {
        // Wrong move: also accept it if it delivers checkmate when the goal is mate.
        const c = this.chess();
        if (c.isCheckmate()) {
          this.set({ puzzle: { ...p, solutionIndex: p.solution.length } });
        } else {
          this.set({ puzzle: { ...p, status: "failed", attempts: p.attempts + 1 } });
          const profile = structuredClone(this.state.profile);
          profile.puzzles.failed += 1;
          this.set({ profile });
          this.pushEvent("puzzle_failed", `Puzzle "${p.title}" failed: player played ${playerMove.san}, expected ${expected}.`, { played: playerMove.san, expected });
          return;
        }
      }
    }
    const cur = this.state.puzzle!;
    if (cur.status === "active" && cur.solutionIndex >= cur.solution.length) {
      this.set({ puzzle: { ...cur, status: "solved" } });
      const profile = structuredClone(this.state.profile);
      profile.puzzles.solved += 1;
      if (cur.theme) {
        const t = (profile.puzzles.byTheme[cur.theme] ??= { attempted: 0, solved: 0 });
        t.solved += 1;
      }
      this.set({ profile });
      this.addXp(20, `Solved puzzle "${cur.title}"`);
      this.pushEvent("puzzle_solved", `Puzzle "${cur.title}" solved in ${cur.attempts + 1} attempt(s).`, { attempts: cur.attempts + 1, theme: cur.theme });
    }
  }

  retryPuzzle() {
    const p = this.state.puzzle;
    if (!p) return;
    if (this.botTimer) clearTimeout(this.botTimer);
    this.set({ fen: p.fen, moves: [], highlights: [], arrows: [], thinking: false, puzzle: { ...p, solutionIndex: 0, status: "active" } });
    this.pushEvent("puzzle_retry", `Player retries puzzle "${p.title}".`);
  }

  // ---------- annotations ----------

  setHighlights(hl: Highlight[], append: boolean) {
    this.set({ highlights: append ? [...this.state.highlights, ...hl] : hl });
  }

  setArrows(arrows: ArrowAnno[], append: boolean) {
    this.set({ arrows: append ? [...this.state.arrows, ...arrows] : arrows });
  }

  clearAnnotations() {
    this.set({ highlights: [], arrows: [] });
  }

  // ---------- coaching ----------

  addNote(kind: NoteKind, text: string): CoachNote {
    const note: CoachNote = { id: uid(), at: Date.now(), kind, text };
    this.set({ notes: [note, ...this.state.notes].slice(0, MAX_NOTES) });
    return note;
  }

  setLesson(title: string | undefined, steps: LessonStep[]) {
    this.set({ lesson: { title: title ?? this.state.lesson.title ?? "Lesson plan", steps } });
  }

  updateLessonStep(index: number, patch: Partial<LessonStep>): boolean {
    const steps = [...this.state.lesson.steps];
    if (index < 0 || index >= steps.length) return false;
    steps[index] = { ...steps[index], ...patch };
    this.set({ lesson: { ...this.state.lesson, steps } });
    return true;
  }

  // ---------- gamification ----------

  addXp(amount: number, reason: string): { xp: number; level: number; leveledUp: boolean } {
    const profile = structuredClone(this.state.profile);
    const before = levelFor(profile.xp);
    profile.xp = Math.max(0, profile.xp + amount);
    profile.xpLog = [{ at: Date.now(), amount, reason }, ...profile.xpLog].slice(0, 50);
    const after = levelFor(profile.xp);
    this.set({ profile });
    if (after > before) this.pushEvent("level_up", `Player reached level ${after}!`, { level: after });
    return { xp: profile.xp, level: after, leveledUp: after > before };
  }

  awardBadge(name: string, description: string, emoji: string): { badge: Badge; duplicate: boolean } {
    const existing = this.state.profile.badges.find((b) => b.name.toLowerCase() === name.toLowerCase());
    if (existing) return { badge: existing, duplicate: true };
    const badge: Badge = { id: uid(), name, description, emoji, earnedAt: Date.now() };
    const profile = structuredClone(this.state.profile);
    profile.badges.push(badge);
    this.set({ profile });
    return { badge, duplicate: false };
  }

  recordMistake(m: Omit<Mistake, "id" | "at">): Mistake {
    const entry: Mistake = { id: uid(), at: Date.now(), ...m };
    const profile = structuredClone(this.state.profile);
    profile.mistakes = [entry, ...profile.mistakes].slice(0, MAX_MISTAKES);
    this.set({ profile });
    return entry;
  }

  setPlayerName(name: string) {
    const profile = { ...this.state.profile, name };
    this.set({ profile });
  }

  resetProfile() {
    this.set({ profile: defaultProfile(), lesson: { title: "Lesson plan", steps: [] }, notes: [] });
  }
}

export function levelFor(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 40)) + 1;
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 40;
}

export const store = new Store();

export const ANNO_COLORS: Record<AnnoColor, string> = {
  green: "rgba(52, 211, 153, 0.85)",
  red: "rgba(248, 113, 113, 0.85)",
  yellow: "rgba(250, 204, 21, 0.85)",
  blue: "rgba(96, 165, 250, 0.85)",
  orange: "rgba(251, 146, 60, 0.85)",
};

export const SQUARES_RE = /^[a-h][1-8]$/;
export function isSquare(s: unknown): s is Square {
  return typeof s === "string" && SQUARES_RE.test(s);
}

export type { MistakeCategory, Severity };
