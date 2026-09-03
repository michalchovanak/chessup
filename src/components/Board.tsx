"use client";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";
import { store, ANNO_COLORS } from "@/lib/store";
import { useApp } from "@/lib/useApp";

const LIGHT = "#e6e9f0";
const DARK = "#6b7f9e";

export function Board() {
  const st = useApp();
  const [selected, setSelectedState] = useState<Square | null>(null);
  const selectedRef = useRef<Square | null>(null);
  const setSelected = (sq: Square | null) => {
    selectedRef.current = sq;
    setSelectedState(sq);
  };

  const chess = useMemo(() => new Chess(st.fen), [st.fen]);
  const humanTurn = st.settings.opponent === "human" || chess.turn() === st.settings.playerColor;
  const puzzleLocked = st.puzzle?.status === "solved" || st.puzzle?.status === "failed";
  const canInteract = humanTurn && !chess.isGameOver() && !puzzleLocked && !st.thinking;

  const legalTargets = useMemo(() => {
    if (!selected) return [] as { to: Square; capture: boolean }[];
    return chess.moves({ square: selected, verbose: true }).map((m) => ({ to: m.to as Square, capture: Boolean(m.captured) }));
  }, [chess, selected]);

  const lastMove = st.moves[st.moves.length - 1];

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: "rgba(245, 185, 66, 0.35)" };
      styles[lastMove.to] = { backgroundColor: "rgba(245, 185, 66, 0.45)" };
    }
    if (chess.isCheck()) {
      const king = findKing(chess, chess.turn());
      if (king) styles[king] = { ...styles[king], background: "radial-gradient(circle, rgba(248,113,113,0.9) 0%, rgba(248,113,113,0.5) 55%, transparent 75%)" };
    }
    for (const h of st.highlights) {
      styles[h.square] = { ...styles[h.square], boxShadow: `inset 0 0 0 4px ${ANNO_COLORS[h.color]}`, backgroundColor: ANNO_COLORS[h.color].replace("0.85", "0.28") };
    }
    if (selected) {
      styles[selected] = { ...styles[selected], backgroundColor: "rgba(245, 185, 66, 0.6)" };
      for (const t of legalTargets) {
        styles[t.to] = {
          ...styles[t.to],
          background: t.capture
            ? "radial-gradient(circle, transparent 58%, rgba(15, 23, 42, 0.45) 60%)"
            : "radial-gradient(circle, rgba(15, 23, 42, 0.45) 22%, transparent 24%)",
        };
      }
    }
    return styles;
  }, [chess, lastMove, st.highlights, selected, legalTargets]);

  const arrows = useMemo(
    () => st.arrows.map((a) => ({ startSquare: a.from, endSquare: a.to, color: ANNO_COLORS[a.color] })),
    [st.arrows]
  );

  function tryMove(from: Square, to: Square): boolean {
    if (!canInteract) return false;
    const r = store.makeMove({ from, to, promotion: "q" }, "player");
    setSelected(null);
    return r.ok;
  }

  const lastClick = useRef<{ sq: string; at: number }>({ sq: "", at: 0 });

  function onSquareClick({ square, piece }: { square: string; piece: { pieceType: string } | null }) {
    if (!canInteract) return;
    const sq = square as Square;
    // A click on a piece can reach us twice (piece + square handler); handle it once.
    const now = performance.now();
    if (lastClick.current.sq === sq && now - lastClick.current.at < 80) return;
    lastClick.current = { sq, at: now };
    // Read live state: several clicks can land before React re-renders.
    const live = new Chess(store.getState().fen);
    const cur = selectedRef.current;
    if (cur) {
      if (sq === cur) {
        setSelected(null);
        return;
      }
      const legal = live.moves({ square: cur, verbose: true }).some((m) => m.to === sq);
      if (legal) {
        tryMove(cur, sq);
        return;
      }
    }
    if (piece && piece.pieceType[0] === live.turn()) setSelected(sq);
    else setSelected(null);
  }

  return (
    <div className="relative">
      <div
        className="rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
        style={{ opacity: canInteract || !humanTurn ? 1 : 0.92 }}
      >
        <Chessboard
          options={{
            id: "chessup-board",
            position: st.fen,
            boardOrientation: st.settings.playerColor === "w" ? "white" : "black",
            lightSquareStyle: { backgroundColor: LIGHT },
            darkSquareStyle: { backgroundColor: DARK },
            squareStyles,
            arrows,
            allowDrawingArrows: true,
            animationDurationInMs: 180,
            showNotation: true,
            darkSquareNotationStyle: { color: LIGHT, fontSize: 11, fontWeight: 600 },
            lightSquareNotationStyle: { color: DARK, fontSize: 11, fontWeight: 600 },
            allowDragging: canInteract,
            canDragPiece: ({ piece }) => canInteract && piece.pieceType[0] === chess.turn(),
            onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare ? tryMove(sourceSquare as Square, targetSquare as Square) : false),
            onSquareClick,
            onPieceClick: ({ square, piece }) => square && onSquareClick({ square, piece }),
            dropSquareStyle: { boxShadow: "inset 0 0 0 3px rgba(245,185,66,0.9)" },
          }}
        />
      </div>
      {st.thinking && (
        <div className="absolute -bottom-7 left-0 text-xs text-slate-400 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          {st.puzzle ? "Opponent replies…" : "Bot is thinking…"}
        </div>
      )}
    </div>
  );
}

function findKing(chess: Chess, color: "w" | "b"): Square | null {
  const files = "abcdefgh";
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (p && p.type === "k" && p.color === color) return `${files[f]}${8 - r}` as Square;
    }
  }
  return null;
}
