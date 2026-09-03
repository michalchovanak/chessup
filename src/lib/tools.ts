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
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
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

function summariseState(nextOverride?: string) {
  const st = store.getState();
  const chess = new Chess(st.fen);
  const status = gameStatus(chess);
  const turn = chess.turn() as Color;
  const { playerColor, opponent } = st.settings;
  const humanTurn = opponent === "human" || turn === playerColor;
  const recentMistakes = st.profile.mistakes.slice(0, 3).map((m) => ({
    category: m.category,
    severity: m.severity,
    description: m.description,
    movePlayed: m.movePlayed,
    betterMove: m.betterMove,
  }));
  const p = st.puzzle;
  const lastMove = st.moves[st.moves.length - 1];
  const yourTurn = opponent === "agent" && !humanTurn && !status.over;
  const next =
    nextOverride ??
    (status.over
      ? "Game over: summarise, record_mistake / add_xp / award_badge, then offer new_game or a puzzle."
      : yourTurn
        ? "Your move: coach the last human move briefly, then make_move and wait_for_player_move."
        : "Human to move: call wait_for_player_move (do not end your turn waiting for chat).");
  return {
    next,
    fen: st.fen,
    turn: colorName(turn),
    playerColor: colorName(playerColor),
    opponent,
    isPlayerTurn: humanTurn,
    yourTurn,
    status: status.reason,
    gameOver: status.over,
    result: status.result,
    inCheck: chess.isCheck(),
    materialBalance: materialBalance(chess),
    moveNumber: chess.moveNumber(),
    moveCount: st.moves.length,
    recentMoves: buildPgn(st.moves, 20),
    lastMove: lastMove ? { san: lastMove.san, by: lastMove.by, flags: lastMove.flags } : null,
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
    events: store.drainEvents().slice(-8).map((e) => ({ type: e.type, message: e.message })),
  };
}

function buildPgn(moves: { san: string }[], last = Infinity): string {
  const parts: string[] = [];
  const start = Math.max(0, moves.length - last);
  if (start > 0) parts.push("…");
  for (let i = start; i < moves.length; i++) {
    if (i % 2 === 0) parts.push(`${i / 2 + 1}.`);
    else if (i === start) parts.push(`${Math.floor(i / 2) + 1}...`);
    parts.push(moves[i].san);
  }
  return parts.join(" ");
}

export const tools: ToolDef[] = [
  {
    name: "read_coach_instructions",
    title: "Read coaching instructions",
    description:
      "Read this first. Explains how to coach on this board: the tool loop for playing a game (make_move, then wait_for_player_move), how to run puzzle drills with set_position, how mistakes and rewards work, and the tone to use. Cheap and read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: () => ({
      role: "You are a patient chess coach. The human plays every move on the board; you observe, explain, adapt and reward.",
      playLoop: ["new_game (opponent 'agent')", "wait_for_player_move (if the human moves first)", "coach_note / highlight_squares / draw_arrows", "make_move", "wait_for_player_move", "repeat until gameOver"],
      drillLoop: ["get_player_profile → pick a weak theme", "set_position with fen, title, goal, hint, theme, solution", "wait_for_player_move", "coach_note + add_xp / award_badge", "next puzzle or undo_move to retry"],
      rules: [
        "Never end your turn to wait for the human to type: use wait_for_player_move.",
        "Never move the human's pieces in a puzzle; hint instead.",
        "Keep coach notes to 1-3 sentences, specific and encouraging.",
        "Use record_mistake for errors the app cannot see (opening, king safety, positional, endgame).",
        "Reply in the human's language.",
      ],
      next: "Call get_player_profile and get_game_state, then set_lesson_plan or start playing.",
    }),
  },
  {
    name: "get_game_state",
    title: "Get game state",
    description:
      "Read the board: FEN, turn, the human's colour, status, material, recent moves, active puzzle progress, the human's recent mistakes, `events` since your last call (moves, puzzle results, game over) and `next` (what to do now). Coaching loop: make_move, then wait_for_player_move, then coach, repeat.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: () => summariseState(),
  },
  {
    name: "get_legal_moves",
    title: "Get legal moves",
    description:
      "List legal moves in SAN (optionally only for one square, then with from/to details), plus the best capture and any mate in one. Use it to check a move before make_move or to build hints.",
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
        moves: isSquare(square) ? verbose.map((m) => ({ san: m.san, from: m.from, to: m.to, captured: m.captured ?? null })) : verbose.map((m) => m.san),
        bestCapture: cap.move ? { san: cap.move.san, approxGain: cap.net } : null,
        mateInOne: mate ? mate.san : null,
      };
    },
  },
  {
    name: "wait_for_player_move",
    title: "Wait for the human's move",
    description:
      "Waits until the human acts on the board (move, puzzle solved or failed, undo, new game) or until timeoutSeconds passes (default 25, max 120). Call it after every make_move or set_position instead of ending your turn; on timeout (moved=false) call it again right away, as many times as needed. Returns the game state plus `moved` and `next`.",
    inputSchema: {
      type: "object",
      properties: {
        timeoutSeconds: { type: "integer", minimum: 5, maximum: 120, description: "How long to wait before giving up. Default 25." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input, options) => {
      const secs = Math.min(120, Math.max(5, Math.round(num(input.timeoutSeconds, 25))));
      const moved = await store.waitForPlayerAction(secs * 1000, options?.signal);
      const puzzle = store.getState().puzzle;
      const override = !moved
        ? "Nothing happened yet. Call wait_for_player_move again (optionally after a short coach_note)."
        : puzzle && puzzle.status !== "active"
          ? `Puzzle ${puzzle.status}: react with coach_note (add_xp / award_badge if solved), then set the next puzzle or wait_for_player_move after a retry.`
          : undefined;
      return { moved, ...summariseState(override) };
    },
  },
  {
    name: "make_move",
    title: "Make a move",
    description:
      "Play a move for the side to move: as the human's opponent, or to demonstrate a line. SAN ('Nf3', 'O-O', 'e8=Q') or from/to squares. Illegal moves are rejected with the legal list. Refused while it is the human's turn in an active puzzle. After your move call wait_for_player_move.",
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
        next: status.over ? "Game over: summarise and offer new_game or a puzzle." : isPlayerTurn ? "Call wait_for_player_move now." : "Comment, then continue.",
      };
    },
  },
  {
    name: "undo_move",
    title: "Undo moves",
    description:
      "Take back the last N half-moves (default 1) so the human can retry; also reactivates a failed puzzle.",
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
      "Reset to the starting position. Choose the human's colour and the opponent: 'agent' (you, via make_move + wait_for_player_move), 'bot' (built-in engine, level 1-3) or 'human' (they play both sides). Clears any puzzle.",
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
      "Put a FEN on the board. Add title, goal, hint, theme and a SAN `solution` (human's move first, alternating sides) to make a puzzle: the app validates the line, auto-plays the replies and reports solved/failed through wait_for_player_move. Build puzzles for the weakest areas from get_player_profile. Without title/goal/solution it only sets the position.",
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
      return {
        ok: true,
        ...summariseState(
          r.puzzle
            ? "Puzzle set. Call wait_for_player_move now; it returns when the human solves or fails it."
            : "Position set. Explain it with highlight_squares / draw_arrows / coach_note, or wait_for_player_move if the human should play."
        ),
        solutionLength: r.puzzle?.solution.length ?? 0,
      };
    },
  },
  {
    name: "highlight_squares",
    title: "Highlight squares",
    description:
      "Colour squares to draw attention: green good/safe, red danger, yellow key square, blue plan, orange warning. Replaces highlights unless append=true. Cleared automatically on the next move.",
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
      "Draw arrows for plans, threats or candidate moves. Replaces arrows unless append=true. Cleared automatically on the next move.",
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
    description:
      "Remove all highlights and arrows from the board.",
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
      "Show a short note (1-3 sentences) in the Coach panel: tip, praise, warning, question or info. Use it after every human move and whenever you explain something.",
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
      "Replace the lesson plan in the side panel: a title and 3-6 steps with status todo/active/done/skipped. Build it from get_player_profile at session start and keep it current with update_lesson_step.",
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
    description:
      "Update one lesson step by zero-based index: status (todo/active/done/skipped), title or description. Mark steps active when started and done when completed.",
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
      "Give a uniquely named badge with an emoji for a real milestone (first puzzle solved, a clean game, a new pattern learned). Badges are permanent in the profile.",
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
      "Add XP with a reason (negative allowed). Scale: 5-10 for a good move or answer, 20-40 for a puzzle, 50+ for a won game or a finished lesson step. Returns total, level and leveledUp.",
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
      "Log a mistake the app cannot detect itself (opening, king safety, positional, endgame) into the human's long-term profile with severity, FEN before the move, movePlayed and betterMove. Simple tactical errors are auto-recorded.",
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
      "Read the persistent profile: XP, level, badges, game and puzzle stats by theme, mistakes by category with recent examples, weakestAreas and the lesson plan. Call it at session start to personalise the plan and pick puzzle themes.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
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
        recentMistakes: profile.mistakes.slice(0, 4).map((m) => ({ category: m.category, severity: m.severity, description: m.description, fen: m.fen, movePlayed: m.movePlayed, betterMove: m.betterMove })),
        recentXp: profile.xpLog.slice(0, 3).map((x) => ({ amount: x.amount, reason: x.reason })),
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
