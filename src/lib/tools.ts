"use client";
import { Chess, type Square } from "chess.js";
import { store, isSquare, levelFor, xpForLevel } from "./store";
import { gameStatus, materialBalance, bestCapture, findMateInOne } from "./chessLogic";
import type { AnnoColor, Color, LessonStatus, LessonStep, MistakeCategory, NoteKind, Severity } from "./types";

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<unknown> | unknown;
}

const ANNO_COLORS: AnnoColor[] = ["green", "red", "yellow", "blue", "orange"];
const LESSON_STATUS: LessonStatus[] = ["todo", "active", "done", "skipped"];
const NOTE_KINDS: NoteKind[] = ["tip", "praise", "warning", "question", "info"];
const MISTAKE_CATEGORIES: MistakeCategory[] = [
  "hanging_piece", "missed_mate", "allowed_mate", "missed_capture",
  "opening", "endgame", "tactics", "positional", "king_safety", "other",
];
const SEVERITIES: Severity[] = ["inaccuracy", "mistake", "blunder"];

function colorName(c: Color) {
  return c === "w" ? "white" : "black";
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function pickColor(v: unknown, fallback: AnnoColor = "green"): AnnoColor {
  return typeof v === "string" && (ANNO_COLORS as string[]).includes(v) ? (v as AnnoColor) : fallback;
}

function summariseState() {
  const st = store.getState();
  const chess = new Chess(st.fen);
  const status = gameStatus(chess);
  const turn = chess.turn() as Color;
  const { playerColor, opponent } = st.settings;
  const humanTurn = opponent === "human" || turn === playerColor;
  const recentMistakes = st.profile.mistakes.slice(0, 5).map((m) => ({
    category: m.category,
    severity: m.severity,
    description: m.description,
    movePlayed: m.movePlayed,
    betterMove: m.betterMove,
    source: m.source,
  }));
  const p = st.puzzle;
  return {
    fen: st.fen,
    turn: colorName(turn),
    playerColor: colorName(playerColor),
    opponent,
    isPlayerTurn: humanTurn,
    yourTurn: opponent === "agent" && !humanTurn && !status.over,
    status: status.reason,
    gameOver: status.over,
    result: status.result,
    inCheck: chess.isCheck(),
    materialBalance: materialBalance(chess),
    moveNumber: chess.moveNumber(),
    history: st.moves.map((m) => m.san),
    pgn: buildPgn(st.moves),
    lastMove: st.moves.length ? { san: st.moves[st.moves.length - 1].san, by: st.moves[st.moves.length - 1].by, flags: st.moves[st.moves.length - 1].flags } : null,
    puzzle: p
      ? {
          title: p.title,
          goal: p.goal,
          theme: p.theme,
          status: p.status,
          attempts: p.attempts,
          progress: `${p.solutionIndex}/${p.solution.length}`,
          nextExpectedMove: p.status === "active" ? p.solution[p.solutionIndex] ?? null : null,
        }
      : null,
    recentPlayerMistakes: recentMistakes,
    eventsSinceLastCall: store.drainEvents().map((e) => ({ type: e.type, message: e.message, data: e.data })),
  };
}

function buildPgn(moves: { san: string }[]): string {
  const parts: string[] = [];
  for (let i = 0; i < moves.length; i++) {
    if (i % 2 === 0) parts.push(`${i / 2 + 1}.`);
    parts.push(moves[i].san);
  }
  return parts.join(" ");
}

export const tools: ToolDef[] = [
  {
    name: "get_game_state",
    title: "Get game state",
    description:
      "Read the current chess board. Returns FEN, whose turn it is, which colour the human plays, move history (SAN + PGN), game status, material balance, the active puzzle (if any) and its progress, the human's recent mistakes (auto-detected or recorded by you), and `eventsSinceLastCall`: everything that happened since you last looked (player moves with auto-analysis, puzzle solved/failed, game over, level-ups). Call this first and whenever you need a fresh look. If `yourTurn` is true you are expected to reply with make_move. To react to the human's next move without them typing anything, use wait_for_player_move instead of polling.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: () => summariseState(),
  },
  {
    name: "get_legal_moves",
    title: "Get legal moves",
    description:
      "List all legal moves in the current position in SAN, optionally only for one square. Also reports the best immediate capture and any mate-in-one for the side to move. Use it to verify a move before make_move, to build hints, or to explain what the human could have played.",
    inputSchema: {
      type: "object",
      properties: {
        square: { type: "string", description: "Optional square like 'e2' to list only moves of the piece on that square." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: (input) => {
      const chess = new Chess(store.getState().fen);
      const square = str(input.square);
      const verbose = chess.moves({ verbose: true, ...(isSquare(square) ? { square: square as Square } : {}) });
      const cap = bestCapture(chess);
      const mate = findMateInOne(chess);
      return {
        turn: colorName(chess.turn() as Color),
        count: verbose.length,
        moves: verbose.map((m) => ({ san: m.san, from: m.from, to: m.to, piece: m.piece, captured: m.captured ?? null })),
        bestCapture: cap.move ? { san: cap.move.san, approxGain: cap.net } : null,
        mateInOne: mate ? mate.san : null,
      };
    },
  },
  {
    name: "wait_for_player_move",
    title: "Wait for the human's move",
    description:
      "Long-running call that returns as soon as the human acts on the board (plays a move, solves or fails a puzzle, takes a move back, starts a new game) or when `timeoutSeconds` elapses (default 60, max 120). This is how you keep a game or drill flowing without the human typing anything: after make_move as the opponent, or after set_position for a puzzle, call wait_for_player_move, then coach and reply based on the returned state. Returns the same payload as get_game_state plus `moved` (false on timeout: just call it again, optionally after a short encouraging coach_note).",
    inputSchema: {
      type: "object",
      properties: {
        timeoutSeconds: { type: "integer", minimum: 5, maximum: 120, description: "How long to wait before giving up. Default 60." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input, options) => {
      const secs = Math.min(120, Math.max(5, Math.round(num(input.timeoutSeconds, 60))));
      const moved = await store.waitForPlayerAction(secs * 1000, options?.signal);
      return { moved, waitedSeconds: moved ? undefined : secs, ...summariseState() };
    },
  },
  {
    name: "make_move",
    title: "Make a move",
    description:
      "Play a move on the board for the side to move. Use it (a) to play as the human's opponent when get_game_state says `yourTurn` is true, or (b) to demonstrate a line to the student. Accepts SAN (e.g. 'Nf3', 'exd5', 'O-O', 'e8=Q') or from/to squares. Rejects illegal moves and returns the legal moves instead. Do not use it to move the human's pieces during a puzzle: the human must find the solution themselves. When you play as the opponent, follow up with wait_for_player_move so the game keeps flowing.",
    inputSchema: {
      type: "object",
      properties: {
        san: { type: "string", description: "Move in Standard Algebraic Notation, e.g. 'Nf3'." },
        from: { type: "string", description: "Origin square, e.g. 'e2' (use together with `to`)." },
        to: { type: "string", description: "Target square, e.g. 'e4'." },
        promotion: { type: "string", enum: ["q", "r", "b", "n"], description: "Promotion piece when a pawn reaches the last rank. Defaults to queen." },
        comment: { type: "string", description: "Optional short explanation shown to the human next to the move." },
      },
      additionalProperties: false,
    },
    execute: (input) => {
      const st = store.getState();
      if (st.puzzle?.status === "active" && store.isHumanTurn()) {
        return { ok: false, error: `It is the student's move in the active puzzle "${st.puzzle.title}". Let them find it (use coach_note or highlight_squares for hints), or call new_game / set_position to leave the puzzle.` };
      }
      const r = store.makeMove(
        { san: str(input.san) || undefined, from: str(input.from) || undefined, to: str(input.to) || undefined, promotion: str(input.promotion) || undefined },
        "agent"
      );
      if (!r.ok) return { ok: false, error: r.error };
      const comment = str(input.comment);
      if (comment) store.addNote("info", `${r.move.san}: ${comment}`);
      const chess = new Chess(store.getState().fen);
      const status = gameStatus(chess);
      const isPlayerTurn = store.isHumanTurn();
      return {
        ok: true,
        played: r.move.san,
        fen: chess.fen(),
        status: status.reason,
        gameOver: status.over,
        result: status.result,
        isPlayerTurn,
        ...(isPlayerTurn && !status.over ? { next: "Call wait_for_player_move now to wait for the human's reply, then coach and reply again." } : {}),
      };
    },
  },
  {
    name: "undo_move",
    title: "Undo moves",
    description: "Take back the last N half-moves (default 1). Useful to let the student retry after a mistake, or to reset a demonstration line. Also un-fails an active puzzle so the student can try again.",
    inputSchema: {
      type: "object",
      properties: { count: { type: "integer", minimum: 1, maximum: 200, description: "Number of half-moves to undo. Default 1." } },
      additionalProperties: false,
    },
    execute: (input) => store.undoMove(Math.max(1, Math.round(num(input.count, 1)))),
  },
  {
    name: "new_game",
    title: "Start a new game",
    description:
      "Reset the board to the starting position and start a game. Choose the human's colour and who plays the other side: 'agent' (you play via make_move and keep the game flowing with wait_for_player_move, recommended when coaching), 'bot' (the app's simple built-in engine, level 1-3), or 'human' (the human plays both sides for analysis). Clears any active puzzle.",
    inputSchema: {
      type: "object",
      properties: {
        playerColor: { type: "string", enum: ["white", "black"], description: "Colour the human plays. Default white." },
        opponent: { type: "string", enum: ["agent", "bot", "human"], description: "Who plays the other side. Default 'agent'." },
        botLevel: { type: "integer", enum: [1, 2, 3], description: "Strength of the built-in bot when opponent is 'bot'." },
      },
      additionalProperties: false,
    },
    execute: (input) => {
      const pc = str(input.playerColor, "white") === "black" ? "b" : "w";
      const opp = (["agent", "bot", "human"] as const).find((o) => o === input.opponent) ?? "agent";
      const lvl = ([1, 2, 3] as const).find((l) => l === input.botLevel);
      store.newGame({ playerColor: pc, opponent: opp, ...(lvl ? { botLevel: lvl } : {}) });
      return { ok: true, ...summariseState() };
    },
  },
  {
    name: "set_position",
    title: "Set position / start a puzzle",
    description:
      "Put any position on the board from a FEN string. This is how you create custom puzzles and drills: pass a `title`, a `goal` shown to the student (e.g. 'White to play and mate in 2'), an optional `hint`, a `theme` tag used for statistics (e.g. 'fork', 'back_rank', 'hanging_piece'), and the `solution` as a list of SAN moves starting with the student's move and alternating with the opponent's replies. The app validates the solution, auto-plays the opponent's replies, checks the student's moves against the line, and reports puzzle_solved / puzzle_failed in get_game_state events. Design puzzles that target the student's recorded weaknesses from get_player_profile. Omit title/goal/solution to just set up a position for free play or explanation.",
    inputSchema: {
      type: "object",
      properties: {
        fen: { type: "string", description: "Full FEN string, e.g. 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4'." },
        title: { type: "string", description: "Short puzzle title, e.g. 'Back-rank mate'." },
        goal: { type: "string", description: "What the student must achieve, e.g. 'White to play and win a piece'." },
        hint: { type: "string", description: "Optional hint the student can reveal." },
        theme: { type: "string", description: "Tactical/strategic theme tag for tracking, e.g. 'fork', 'pin', 'mate_in_1'." },
        solution: { type: "array", items: { type: "string" }, description: "Solution line in SAN, student's move first, alternating sides. e.g. ['Qxf7#'] or ['Nxe5','Nxe5','Qh5+','g6','Qxe5']." },
        playerColor: { type: "string", enum: ["white", "black"], description: "Which colour the student plays. Defaults to the side to move in the FEN." },
      },
      required: ["fen"],
      additionalProperties: false,
    },
    execute: (input) => {
      const solution = Array.isArray(input.solution) ? input.solution.filter((s): s is string => typeof s === "string") : undefined;
      const pc = input.playerColor === "black" ? "b" : input.playerColor === "white" ? "w" : undefined;
      const r = store.setPosition({
        fen: str(input.fen),
        title: str(input.title) || undefined,
        goal: str(input.goal) || undefined,
        hint: str(input.hint) || undefined,
        theme: str(input.theme) || undefined,
        solution,
        playerColor: pc,
      });
      if (!r.ok) return { ok: false, error: r.error };
      return { ok: true, ...summariseState(), puzzleId: r.puzzle?.id ?? null, solutionLength: r.puzzle?.solution.length ?? 0 };
    },
  },
  {
    name: "highlight_squares",
    title: "Highlight squares",
    description:
      "Colour squares on the board to draw the student's attention: green = good squares / safe, red = danger / attacked, yellow = key square, blue = plan, orange = warning. Replaces existing highlights unless `append` is true. Highlights are cleared automatically when a move is played.",
    inputSchema: {
      type: "object",
      properties: {
        squares: { type: "array", items: { type: "string" }, description: "Squares like ['e4','d5']." },
        color: { type: "string", enum: ["green", "red", "yellow", "blue", "orange"], description: "Highlight colour. Default green." },
        append: { type: "boolean", description: "Keep existing highlights and add these. Default false." },
      },
      required: ["squares"],
      additionalProperties: false,
    },
    execute: (input) => {
      const color = pickColor(input.color);
      const squares = (Array.isArray(input.squares) ? input.squares : []).filter(isSquare);
      const invalid = (Array.isArray(input.squares) ? input.squares : []).filter((s) => !isSquare(s));
      store.setHighlights(squares.map((square) => ({ square, color })), input.append === true);
      return { ok: true, highlighted: squares, color, ...(invalid.length ? { ignoredInvalid: invalid } : {}) };
    },
  },
  {
    name: "draw_arrows",
    title: "Draw arrows",
    description:
      "Draw one or more arrows on the board to show plans, threats or candidate moves, e.g. 'the knight can jump to f5' or 'watch the bishop on b5 pinning your knight'. Replaces existing arrows unless `append` is true. Arrows are cleared when a move is played.",
    inputSchema: {
      type: "object",
      properties: {
        arrows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "Start square, e.g. 'g1'." },
              to: { type: "string", description: "End square, e.g. 'f3'." },
              color: { type: "string", enum: ["green", "red", "yellow", "blue", "orange"], description: "Arrow colour. Default green." },
            },
            required: ["from", "to"],
          },
        },
        append: { type: "boolean", description: "Keep existing arrows and add these. Default false." },
      },
      required: ["arrows"],
      additionalProperties: false,
    },
    execute: (input) => {
      const raw = Array.isArray(input.arrows) ? input.arrows : [];
      const arrows = raw
        .filter((a): a is Record<string, unknown> => typeof a === "object" && a !== null)
        .filter((a) => isSquare(a.from) && isSquare(a.to))
        .map((a) => ({ from: a.from as string, to: a.to as string, color: pickColor(a.color) }));
      store.setArrows(arrows, input.append === true);
      return { ok: true, drawn: arrows.length };
    },
  },
  {
    name: "clear_annotations",
    title: "Clear annotations",
    description: "Remove all highlights and arrows from the board.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: () => {
      store.clearAnnotations();
      return { ok: true };
    },
  },
  {
    name: "coach_note",
    title: "Post a coaching note",
    description:
      "Show a short message in the Coach panel next to the board. Use it for explanations, praise, warnings and questions the student should think about ('Where is your king going to be safe?'). Keep notes concise (1-3 sentences). Kinds: tip, praise, warning, question, info.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The note text." },
        kind: { type: "string", enum: ["tip", "praise", "warning", "question", "info"], description: "Visual style of the note. Default 'tip'." },
      },
      required: ["text"],
      additionalProperties: false,
    },
    execute: (input) => {
      const text = str(input.text).trim();
      if (!text) return { ok: false, error: "text is required" };
      const kind = (NOTE_KINDS as string[]).includes(str(input.kind)) ? (input.kind as NoteKind) : "tip";
      const n = store.addNote(kind, text);
      return { ok: true, id: n.id };
    },
  },
  {
    name: "set_lesson_plan",
    title: "Set lesson plan",
    description:
      "Replace the lesson plan shown in the side panel. Create it at the start of a session based on the player's profile (weak spots, level), then keep it updated with update_lesson_step as the student progresses. Each step has a title, optional description and status: todo, active, done, skipped. Typically 3-6 steps.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Plan title, e.g. 'Today: stop hanging pieces'." },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              status: { type: "string", enum: ["todo", "active", "done", "skipped"] },
            },
            required: ["title"],
          },
        },
      },
      required: ["steps"],
      additionalProperties: false,
    },
    execute: (input) => {
      const raw = Array.isArray(input.steps) ? input.steps : [];
      const steps: LessonStep[] = raw
        .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null && typeof s.title === "string")
        .map((s) => ({
          title: s.title as string,
          description: str(s.description) || undefined,
          status: (LESSON_STATUS as string[]).includes(str(s.status)) ? (s.status as LessonStatus) : "todo",
        }));
      store.setLesson(str(input.title) || undefined, steps);
      return { ok: true, steps: steps.length };
    },
  },
  {
    name: "update_lesson_step",
    title: "Update a lesson step",
    description: "Change the status (and optionally title/description) of one lesson step by its zero-based index. Mark steps 'active' when you start them and 'done' when the student completes them.",
    inputSchema: {
      type: "object",
      properties: {
        index: { type: "integer", minimum: 0, description: "Zero-based index of the step." },
        status: { type: "string", enum: ["todo", "active", "done", "skipped"] },
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["index"],
      additionalProperties: false,
    },
    execute: (input) => {
      const patch: Partial<LessonStep> = {};
      if ((LESSON_STATUS as string[]).includes(str(input.status))) patch.status = input.status as LessonStatus;
      if (str(input.title)) patch.title = input.title as string;
      if (typeof input.description === "string") patch.description = input.description;
      const ok = store.updateLessonStep(Math.round(num(input.index, -1)), patch);
      return ok ? { ok: true, lesson: store.getState().lesson } : { ok: false, error: "No step at that index." };
    },
  },
  {
    name: "award_badge",
    title: "Award a badge",
    description:
      "Give the student a named achievement badge with an emoji, shown permanently in their profile. Award badges for real milestones (first puzzle solved, three puzzles in a row, a clean game without hanging pieces, learning a new pattern). Badges are unique by name.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Badge name, e.g. 'Fork Master'." },
        description: { type: "string", description: "Why it was earned." },
        emoji: { type: "string", description: "A single emoji, e.g. '🍴'." },
      },
      required: ["name", "description"],
      additionalProperties: false,
    },
    execute: (input) => {
      const name = str(input.name).trim();
      if (!name) return { ok: false, error: "name is required" };
      const r = store.awardBadge(name, str(input.description), str(input.emoji, "🏅") || "🏅");
      if (!r.duplicate) store.addNote("praise", `🏅 Badge earned: ${r.badge.emoji} ${r.badge.name}`);
      return { ok: true, duplicate: r.duplicate, badge: r.badge, totalBadges: store.getState().profile.badges.length };
    },
  },
  {
    name: "add_xp",
    title: "Add experience points",
    description:
      "Award (or, with a negative amount, remove) experience points with a reason. Suggested scale: 5-10 for a good move or answering a question, 20-40 for a solved puzzle, 50+ for a won game or completing a lesson step. Level = floor(sqrt(xp/40)) + 1. Returns the new total, level and whether the student levelled up.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "integer", description: "XP to add (can be negative)." },
        reason: { type: "string", description: "Short reason shown to the student." },
      },
      required: ["amount", "reason"],
      additionalProperties: false,
    },
    execute: (input) => {
      const amount = Math.round(num(input.amount, 0));
      if (!amount) return { ok: false, error: "amount must be a non-zero integer" };
      const r = store.addXp(amount, str(input.reason, "Coach award"));
      if (r.leveledUp) store.addNote("praise", `🎉 Level up! You are now level ${r.level}.`);
      return { ok: true, ...r, nextLevelAt: xpForLevel(r.level + 1) };
    },
  },
  {
    name: "record_mistake",
    title: "Record a mistake",
    description:
      "Log a mistake the student made so it becomes part of their long-term profile and future puzzle selection. The app auto-detects simple tactical errors (hanging pieces, missed/allowed mate in one, missed captures); use this tool for everything the app cannot see: opening principles, king safety, positional errors, endgame technique. Include the FEN before the move and the better move when known.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: MISTAKE_CATEGORIES },
        severity: { type: "string", enum: SEVERITIES, description: "Default 'mistake'." },
        description: { type: "string", description: "One sentence the student will read later." },
        fen: { type: "string", description: "Position before the mistake. Defaults to the position before the last move." },
        movePlayed: { type: "string", description: "The move the student played (SAN)." },
        betterMove: { type: "string", description: "What should have been played (SAN)." },
      },
      required: ["category", "description"],
      additionalProperties: false,
    },
    execute: (input) => {
      const st = store.getState();
      const last = st.moves[st.moves.length - 1];
      const category = (MISTAKE_CATEGORIES as string[]).includes(str(input.category)) ? (input.category as MistakeCategory) : "other";
      const severity = (SEVERITIES as string[]).includes(str(input.severity)) ? (input.severity as Severity) : "mistake";
      const m = store.recordMistake({
        category,
        severity,
        description: str(input.description),
        fen: str(input.fen) || last?.fenBefore || st.fen,
        movePlayed: str(input.movePlayed) || last?.san,
        betterMove: str(input.betterMove) || undefined,
        source: "agent",
      });
      return { ok: true, id: m.id, totalMistakes: store.getState().profile.mistakes.length };
    },
  },
  {
    name: "get_player_profile",
    title: "Get player profile",
    description:
      "Read the student's persistent profile: XP, level, badges, game and puzzle statistics (including per-theme puzzle results), session count, the current lesson plan, and a breakdown of recorded mistakes by category with the most recent examples. Use it at the start of a session to personalise the lesson plan and to choose puzzle themes that target the weakest areas.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: () => {
      const { profile, lesson } = store.getState();
      const byCategory: Record<string, { count: number; blunders: number; latest: string }> = {};
      for (const m of profile.mistakes) {
        const c = (byCategory[m.category] ??= { count: 0, blunders: 0, latest: m.description });
        c.count += 1;
        if (m.severity === "blunder") c.blunders += 1;
      }
      const weakest = Object.entries(byCategory).sort((a, b) => b[1].count - a[1].count).map(([k]) => k);
      const level = levelFor(profile.xp);
      return {
        name: profile.name,
        xp: profile.xp,
        level,
        nextLevelAt: xpForLevel(level + 1),
        badges: profile.badges.map((b) => ({ name: b.name, emoji: b.emoji, description: b.description })),
        games: profile.games,
        puzzles: profile.puzzles,
        sessions: profile.sessions,
        memberSince: new Date(profile.createdAt).toISOString().slice(0, 10),
        mistakesByCategory: byCategory,
        weakestAreas: weakest.slice(0, 3),
        recentMistakes: profile.mistakes.slice(0, 8).map((m) => ({ category: m.category, severity: m.severity, description: m.description, fen: m.fen, movePlayed: m.movePlayed, betterMove: m.betterMove })),
        recentXp: profile.xpLog.slice(0, 5),
        lessonPlan: lesson,
      };
    },
  },
];

export const toolByName = new Map(tools.map((t) => [t.name, t]));

export async function runTool(name: string, input: Record<string, unknown>, source: "agent" | "debug", signal?: AbortSignal): Promise<unknown> {
  const tool = toolByName.get(name);
  if (!tool) throw new Error(`Unknown tool ${name}`);
  const started = performance.now();
  try {
    const output = await tool.execute(input ?? {}, { signal });
    store.logToolCall({ tool: name, input, output, ok: true, durationMs: Math.round(performance.now() - started), source });
    return output;
  } catch (e) {
    const output = { ok: false, error: e instanceof Error ? e.message : String(e) };
    store.logToolCall({ tool: name, input, output, ok: false, durationMs: Math.round(performance.now() - started), source });
    return output;
  }
}
