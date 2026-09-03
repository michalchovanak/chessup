# Devpost submission text (ChessUp)

## Tagline
A chess coach that lives in your browser agent: it watches you play, builds puzzles for your exact weaknesses, and rewards progress — all through WebMCP.

## Inspiration
Chess sites give everyone the same puzzles. A real coach watches *you*: they notice you keep hanging knights on the rim and set up three positions that punish exactly that. With WebMCP, the agent already in your browser can be that coach — if the web page gives it the right eyes and hands.

## What it does
ChessUp is a normal chess board (click or drag) with **no AI of its own**. It registers **19 WebMCP tools** so the browser agent can:

- **See**: `get_game_state` returns FEN, PGN, status, material, the active puzzle's progress, the player's recent mistakes and an **event queue** of everything the human did since the last call.
- **Teach**: highlight squares, draw arrows, post coaching notes (tips, praise, warnings, questions), keep a live lesson plan.
- **Adapt**: `get_player_profile` exposes mistakes by category and per-theme puzzle stats. The agent composes a FEN + solution line and hands it to `set_position`; the app validates the line, auto-plays the opponent's replies and grades the human's moves. That is **"puzzle rush on demand"**, built for one person.
- **Drill**: `set_puzzle_queue` hands the page 3-5 validated puzzles; the app serves, grades and rewards them and reports results per theme. The agent plans, the page executes, the agent adapts.
- **Play**: the human plays the built-in bot instantly; the board never waits for the agent. `make_move` and the long-running `wait_for_player_move` enable optional live sparring; `undo_move` lets the student retry.
- **Reward**: `add_xp` and `award_badge` are tools, so gamification is the coach's judgement, not a fixed rule set. The profile persists across sessions.

The human plays and decides; the agent observes, explains and adapts. The design embraces WebMCP's pull model: the page cannot wake the agent, so it records everything and delegates long work (drills) to itself, and the agent catches up from an event queue whenever the human speaks.

## How WebMCP is used
- Tools are registered with `navigator.modelContext.registerTool()` (and `document.modelContext` as a fallback) with full JSON schemas, `readOnlyHint` annotations and descriptive guidance so the agent knows *when* to use each one.
- The app does the deterministic work (legality, puzzle validation, cheap tactical heuristics: hanging pieces, missed/allowed mate in one, missed captures) and returns structured results; the agent does the judgement.
- Errors are informative: an illegal `make_move` returns the legal moves, an illegal puzzle solution returns where it breaks, so hallucinated lines are caught before the student sees them.
- Every tool call is shown in the *Agent activity* panel, so the human always sees what the coach did.

## Human–agent collaboration
The student keeps full control of the board. The agent never moves the student's pieces in a puzzle; it hints, annotates, and lets them retry. The lesson plan, notes and rewards are the agent's channel back to the human, updated as the session unfolds.

## Built with
Next.js 16, React 19, TypeScript, Tailwind 4, chess.js, react-chessboard, Vercel. No backend, no API keys.

## What's next
Engine-backed evaluation (Stockfish WASM) exposed as a tool, opening repertoire tracking, spaced-repetition scheduling of the puzzles the coach generated.

---

# Demo video script (≤ 3 min)

**0:00–0:20 — Hook.** Screen: ChessUp open in ChatGPT's browser, "Agent connected" pill. Voice: "This is ChessUp. It's a chess board with no AI inside. The coach is the agent in my browser, talking to the page through WebMCP tools."

**0:20–0:50 — Profile → plan.** Type: *"Look at my profile and build a lesson plan for today."* Show the agent calling `get_player_profile`, then the Lesson plan panel filling in. Point at the Agent activity log.

**0:50–1:30 — Play + review.** Play a few quick moves against the bot, deliberately hang a piece. Type: *"Review my game so far."* Show the agent reading `events`, the red highlight and arrow, the one-line caption under the board, and the mistake landing in the Player panel.

**1:30–2:20 — Drill on demand.** Type: *"Set up a drill of 3 puzzles for my weak spots."* Show `set_puzzle_queue` arriving, the Drill 1/3 card, solve them by dragging, XP going up, the Drill complete card, then *"I'm done"* and the agent reading the results and awarding a badge.

**2:20–2:50 — Why it matters.** Voice over the tool table in the README: 18 tools, read_coach_instructions, wait_for_player_move, event queue, validation, persistence. "The human plays and decides. The agent observes, teaches and adapts."

**2:50–3:00 — Close.** URL + GitHub link on screen.
