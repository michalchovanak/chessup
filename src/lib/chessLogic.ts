import { Chess, validateFen as cjsValidateFen, type Move, type Square, type PieceSymbol } from "chess.js";
import type { Color, Severity } from "./types";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function pieceValue(p: PieceSymbol | undefined): number {
  return p ? VALUES[p] : 0;
}

export function other(c: Color): Color {
  return c === "w" ? "b" : "w";
}

/** Rough net material gain of a capture, considering a single recapture. */
export function captureNet(chess: Chess, m: Move): number {
  if (!m.captured) return 0;
  const victim = pieceValue(m.captured);
  const attacker = pieceValue(m.piece);
  const defended = chess.isAttacked(m.to as Square, other(m.color as Color));
  return defended ? victim - attacker : victim;
}

export interface Threat {
  net: number;
  move: Move | null;
}

/** Best immediate material threat for the side to move. */
export function bestCapture(chess: Chess): Threat {
  let best: Threat = { net: 0, move: null };
  for (const m of chess.moves({ verbose: true })) {
    if (!m.captured) continue;
    const net = captureNet(chess, m);
    if (net > best.net) best = { net, move: m };
  }
  return best;
}

export function findMateInOne(chess: Chess): Move | null {
  for (const m of chess.moves({ verbose: true })) {
    const c = new Chess(chess.fen());
    c.move(m.san);
    if (c.isCheckmate()) return m;
  }
  return null;
}

export function severityFor(net: number): Severity {
  if (net >= 5) return "blunder";
  if (net >= 3) return "mistake";
  return "inaccuracy";
}

export interface AutoMistake {
  category: "hanging_piece" | "missed_mate" | "allowed_mate" | "missed_capture";
  severity: Severity;
  description: string;
  betterMove?: string;
  /** Opponent's reply that punishes the mistake (SAN). */
  punish?: string;
}

/**
 * Cheap, engine-free analysis of a move the human just played.
 * `before` is the position prior to the move, `after` the position after it.
 */
export function analyseHumanMove(before: Chess, after: Chess, played: Move): AutoMistake[] {
  const out: AutoMistake[] = [];
  const mover = played.color as Color;

  // Missed mate in one
  const mate = findMateInOne(before);
  if (mate && !after.isCheckmate()) {
    out.push({
      category: "missed_mate",
      severity: "blunder",
      description: `Missed checkmate in one: ${mate.san} was mate.`,
      betterMove: mate.san,
    });
  }

  // Allowed opponent mate in one
  if (!after.isGameOver()) {
    const oppMate = findMateInOne(after);
    if (oppMate) {
      out.push({
        category: "allowed_mate",
        severity: "blunder",
        description: `After ${played.san} the opponent has mate in one with ${oppMate.san}.`,
        punish: oppMate.san,
      });
    }
  }

  // Missed a free capture
  const beforeBest = bestCapture(before);
  const playedNet = played.captured ? captureNet(before, played) : 0;
  if (beforeBest.move && beforeBest.net >= 3 && playedNet < beforeBest.net && !mate) {
    out.push({
      category: "missed_capture",
      severity: severityFor(beforeBest.net),
      description: `Missed winning material: ${beforeBest.move.san} would win about ${beforeBest.net} point(s).`,
      betterMove: beforeBest.move.san,
    });
  }

  // Left or put a piece en prise
  if (!after.isGameOver()) {
    const threat = bestCapture(after);
    if (threat.move && threat.net >= 1) {
      const victimSq = threat.move.to;
      const victim = after.get(victimSq as Square);
      const wasAlreadyHanging = bestCapture(flipTurn(before, other(mover))).net >= threat.net;
      const verb = played.to === victimSq ? "moved to a square where it can be taken" : wasAlreadyHanging ? "is still hanging" : "was left hanging";
      out.push({
        category: "hanging_piece",
        severity: severityFor(threat.net),
        description: `${pieceName(victim?.type)} on ${victimSq} ${verb}: ${threat.move.san} wins about ${threat.net} point(s).`,
        punish: threat.move.san,
      });
    }
  }
  return out;
}

/** Returns a copy of the position with the side to move flipped (for "what if opponent moved now"). */
function flipTurn(chess: Chess, toMove: Color): Chess {
  const parts = chess.fen().split(" ");
  parts[1] = toMove;
  parts[3] = "-";
  try {
    return new Chess(parts.join(" "));
  } catch {
    return new Chess(chess.fen());
  }
}

export function pieceName(p?: PieceSymbol): string {
  switch (p) {
    case "p": return "Pawn";
    case "n": return "Knight";
    case "b": return "Bishop";
    case "r": return "Rook";
    case "q": return "Queen";
    case "k": return "King";
    default: return "Piece";
  }
}

export function materialBalance(chess: Chess): number {
  let sum = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq) continue;
      sum += (sq.color === "w" ? 1 : -1) * pieceValue(sq.type);
    }
  }
  return sum;
}

/** Simple built-in opponent so the app is playable without an agent. */
export function pickBotMove(chess: Chess, level: 1 | 2 | 3): Move | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;
  const me = chess.turn() as Color;
  const sign = me === "w" ? 1 : -1;

  if (level === 1 && Math.random() < 0.6) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let best: { score: number; moves: Move[] } = { score: -Infinity, moves: [] };
  for (const m of moves) {
    const c = new Chess(chess.fen());
    c.move(m.san);
    let score: number;
    if (c.isCheckmate()) score = 1000;
    else if (c.isDraw()) score = 0;
    else {
      score = materialBalance(c) * sign;
      if (level >= 2) {
        const reply = bestCapture(c);
        score -= reply.net;
        const theirMate = findMateInOne(c);
        if (theirMate) score -= 500;
      }
      if (level >= 3) {
        // mild centralisation / development bonus
        const centre = ["d4", "e4", "d5", "e5"];
        if (centre.includes(m.to)) score += 0.3;
        if (m.piece !== "p" && m.piece !== "k" && (m.from[1] === "1" || m.from[1] === "8")) score += 0.2;
        if (c.isCheck()) score += 0.1;
      }
      score += Math.random() * 0.05;
    }
    if (score > best.score + 1e-9) best = { score, moves: [m] };
    else if (Math.abs(score - best.score) < 1e-9) best.moves.push(m);
  }
  return best.moves[Math.floor(Math.random() * best.moves.length)] ?? moves[0];
}

export function gameStatus(chess: Chess): { over: boolean; result: "1-0" | "0-1" | "1/2-1/2" | "*"; reason: string } {
  if (chess.isCheckmate()) {
    return { over: true, result: chess.turn() === "w" ? "0-1" : "1-0", reason: "checkmate" };
  }
  if (chess.isStalemate()) return { over: true, result: "1/2-1/2", reason: "stalemate" };
  if (chess.isThreefoldRepetition()) return { over: true, result: "1/2-1/2", reason: "threefold repetition" };
  if (chess.isInsufficientMaterial()) return { over: true, result: "1/2-1/2", reason: "insufficient material" };
  if (chess.isDrawByFiftyMoves()) return { over: true, result: "1/2-1/2", reason: "fifty-move rule" };
  if (chess.isCheck()) return { over: false, result: "*", reason: "check" };
  return { over: false, result: "*", reason: "in progress" };
}

export function validateFen(fen: string): { ok: boolean; error?: string } {
  const r = cjsValidateFen(fen);
  if (!r.ok) return r;
  try {
    new Chess(fen);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
