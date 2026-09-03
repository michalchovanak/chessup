# ♞ ChessUp — a chess coach that lives in your browser agent

**ChessUp** is a chess board with no AI of its own. Instead it exposes **16 [WebMCP](https://github.com/webmachinelearning/webmcp) tools** so that the agent already in your browser (ChatGPT's built-in browser, or Chrome with WebMCP enabled) can *see* the board, *annotate* it, *set up puzzles built for your weaknesses*, *run a lesson plan* and *reward you* with XP and badges — while **you** play every move.

> Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com).

## Why

Chess sites give everyone the same puzzles. A human coach watches *you*, notices that you keep hanging knights on the rim, and sets up three positions that punish exactly that. ChessUp gives the browser agent the eyes and hands of that coach:

- **The human plays.** Click or drag pieces on a normal board. Works fully without an agent (built-in bot, puzzles, stats persist in `localStorage`).
- **The agent observes, teaches and adapts.** Through WebMCP it reads the position and the player's mistake history, highlights squares, draws arrows, posts coaching notes, builds a lesson plan, and — the original part — **generates "puzzle rush on demand"**: it composes FEN positions targeting the player's recorded weak spots, hands them to the app with a solution line, and the app validates the human's moves against it.
- **Gamification is agent-driven.** XP, levels and badges are tools, so the coach decides what deserves a reward. The profile survives reloads and sessions, so the next session starts from what the coach learned last time.

## Try it

Live: **https://chessup.vercel.app** (replace with your deployment)

1. Open the URL in **ChatGPT's browser**, or in **Chrome** with `chrome://flags/#enable-webmcp-testing` enabled.
2. The header shows **"Agent connected"** when `modelContext` is detected and the tools are registered.
3. Talk to the agent. Some prompts that work well:

```
Look at my profile and build me a 4-step lesson plan for today.
Play a game against me as Black and coach me after every move.
I keep hanging pieces. Give me three puzzles that punish that, one at a time.
Set up a back-rank mate puzzle for me, White to move.
Show me with arrows why my last move was bad, then let me take it back.
Award me a badge if I finish this puzzle without a hint.
```

No agent? The **Dev tools** panel at the bottom lets you call any tool by hand with JSON input, so every feature can be exercised in a normal browser.

## The tools

All tools are registered from [`src/lib/webmcp.ts`](src/lib/webmcp.ts) via `navigator.modelContext.registerTool()` (`document.modelContext` is supported as well). Definitions with full JSON schemas live in [`src/lib/tools.ts`](src/lib/tools.ts).

| Tool | Purpose |
| --- | --- |
| `get_game_state` | FEN, turn, history/PGN, status, material, active puzzle progress, recent mistakes and **`eventsSinceLastCall`** (player moves with auto-analysis, puzzle solved/failed, game over, level-ups). |
| `get_legal_moves` | Legal moves (optionally for one square), best capture, mate-in-one. |
| `make_move` | Play a move as the opponent or to demonstrate a line (SAN or from/to, optional comment). |
| `undo_move` | Take back N half-moves; un-fails a puzzle so the student can retry. |
| `new_game` | Start a game; choose the human's colour and opponent: `agent`, built-in `bot` (3 levels) or `human`. |
| `set_position` | Put any FEN on the board. With `title`, `goal`, `hint`, `theme` and a SAN `solution` line it becomes a **puzzle**: the app validates the line, auto-plays the opponent's replies and reports solved/failed. |
| `highlight_squares` | Colour squares (green/red/yellow/blue/orange), replace or append. |
| `draw_arrows` | Draw arrows for plans and threats. |
| `clear_annotations` | Remove highlights and arrows. |
| `coach_note` | Post a tip / praise / warning / question in the Coach panel. |
| `set_lesson_plan` | Replace the lesson plan (title + steps with status). |
| `update_lesson_step` | Change one step's status/title/description. |
| `award_badge` | Give a named, unique badge with an emoji. |
| `add_xp` | Add (or remove) XP with a reason; returns level and level-up. |
| `record_mistake` | Log a categorised mistake the app cannot detect itself (opening, king safety, positional…). |
| `get_player_profile` | XP, level, badges, game/puzzle stats per theme, mistakes by category, weakest areas, lesson plan. |

### Human ↔ agent collaboration details

- **Event queue.** The app records what the human did between agent calls (moves, puzzle results, game over) and hands it over in `get_game_state.eventsSinceLastCall`, so the agent never has to diff histories.
- **Engine-free auto-analysis.** After every human move the app runs cheap chess.js heuristics (hanging piece, missed/allowed mate in one, missed winning capture) and files them as mistakes. The agent adds the judgement the heuristics cannot (openings, plans, king safety) with `record_mistake`. Both feed `get_player_profile.weakestAreas`, which drives puzzle selection.
- **Puzzle contract.** `set_position` validates the solution line against the FEN and returns the legal moves if the agent's line is illegal, so hallucinated puzzles are caught before the student sees them.
- **Read-only annotations.** Tools that only read carry `readOnlyHint`, so the agent can poll freely.
- **Transparency.** The *Agent activity* panel shows every tool call with input and output; the human always sees what the coach did.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · [chess.js](https://github.com/jhlywa/chess.js) · [react-chessboard](https://github.com/Clariity/react-chessboard) · no backend, no API keys · deployed on Vercel.

```bash
npm install
npm run dev
```

## Project layout

```
src/lib/types.ts       shared types
src/lib/chessLogic.ts  heuristics, built-in bot, helpers
src/lib/store.ts       app state, persistence, game/puzzle/gamification logic
src/lib/tools.ts       the 16 WebMCP tool definitions (schemas + execute)
src/lib/webmcp.ts      registration with navigator/document.modelContext
src/components/        board and panels
```

## License

MIT
