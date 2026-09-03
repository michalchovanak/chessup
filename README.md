# ♞ ChessUp — a chess coach that lives in your browser agent

**ChessUp** is a chess board with no AI of its own. Instead it exposes **18 [WebMCP](https://github.com/webmachinelearning/webmcp) tools** so that the agent already in your browser (ChatGPT's built-in browser, or Chrome with WebMCP enabled) can *see* the board, *annotate* it, *set up puzzles built for your weaknesses*, *run a lesson plan* and *reward you* with XP and badges — while **you** play every move.

> Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com).

## Why

Chess sites give everyone the same puzzles. A human coach watches *you*, notices that you keep hanging knights on the rim, and sets up three positions that punish exactly that. ChessUp gives the browser agent the eyes and hands of that coach:

- **The human plays.** Click or drag pieces on a normal board. Works fully without an agent (built-in bot, puzzles, stats persist in `localStorage`).
- **The agent observes, teaches and adapts.** Through WebMCP it reads the position and the player's mistake history, highlights squares, draws arrows, posts coaching notes, builds a lesson plan, and — the original part — **generates "puzzle rush on demand"**: it composes FEN positions targeting the player's recorded weak spots, hands them to the app with a solution line, and the app validates the human's moves against it.
- **Gamification is agent-driven.** XP, levels and badges are tools, so the coach decides what deserves a reward. The profile survives reloads and sessions, so the next session starts from what the coach learned last time.

## Getting started (2 minutes)

**Live app:** https://chessup-gamma.vercel.app
**Open directly in ChatGPT:** [chatgpt.com/codex/deeplink?url=https://chessup-gamma.vercel.app/](https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fchessup-gamma.vercel.app%2F&openaicom_referred=true) (ChatGPT desktop app with site tools, GPT-5.6 Sol or Terra)

1. **Open it inside an agent browser.**
   - **ChatGPT app:** click the deep link above, or open a new browser tab (the `+` next to your tabs), paste the link, and use the chat panel next to it.
   - **Chrome:** enable `chrome://flags/#enable-webmcp-testing`, restart, open the link, and use an agent that supports WebMCP.
2. **Check the header pill.** It turns green, **Agent connected**, when the page's 18 tools are registered with the agent.
3. **Say what you want, in any language.** No special wording is needed. The tools carry a coaching protocol (start from the profile, play with `make_move` + `wait_for_player_move`, coach after every move), and every tool result tells the agent what to do next. Examples:

```
Play a game against me and coach me after each move.
I keep hanging pieces. Give me puzzles that punish that.
Read my profile, build a lesson for today and walk me through it.
Review this game with arrows and tell me one thing to practise.
```

The **Start** panel on the page has one-click copies of these prompts, and the **?** button in the header reopens the welcome guide.

**No agent?** The board still works: play the built-in bot (three levels), and the **Dev tools** panel at the bottom lets you call any tool by hand with JSON input.

## The tools

All tools are registered from [`src/lib/webmcp.ts`](src/lib/webmcp.ts) via `navigator.modelContext.registerTool()` (`document.modelContext` is supported as well). Definitions with full JSON schemas live in [`src/lib/tools.ts`](src/lib/tools.ts).

| Tool | Purpose |
| --- | --- |
| `read_coach_instructions` | "Read this first": role, the play loop, the drill loop and the rules. The same pattern OpenAI's Codex Modeling Studio uses (`readInstructionsForCodex`). |
| `get_game_state` | FEN, turn, history/PGN, status, material, active puzzle progress, recent mistakes and **`eventsSinceLastCall`** (player moves with auto-analysis, puzzle solved/failed, game over, level-ups). |
| `get_legal_moves` | Legal moves (optionally for one square), best capture, mate-in-one. |
| `wait_for_player_move` | **Long-running call** that returns when the human moves (or a puzzle resolves, or after a timeout). Lets the agent run a whole game or drill in one turn: move → wait → coach → move. |
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

- **Waiting instead of polling.** WebMCP is pull-based: the page cannot push events to the agent. `wait_for_player_move` keeps the tool call open (with the WebMCP `AbortSignal`) until the human acts, so the agent can play a full game without the human typing "your move" after every turn.
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
