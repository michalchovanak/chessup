# ♞ ChessUp — a chess coach that lives in your browser agent

**ChessUp** is a chess board with no AI of its own. Instead it exposes **19 [WebMCP](https://github.com/webmachinelearning/webmcp) tools** so that the agent already in your browser (ChatGPT's built-in browser, or Chrome with WebMCP enabled) can *see* the board, *annotate* it, *set up puzzles built for your weaknesses*, *run a lesson plan* and *reward you* with XP and badges — while **you** play every move.

> Built for the [OpenAI WebMCP Challenge](https://webmcp.devpost.com).

## Why

Chess sites give everyone the same puzzles. A human coach watches *you*, notices that you keep hanging knights on the rim, and sets up three positions that punish exactly that. ChessUp gives the browser agent the eyes and hands of that coach, and respects how WebMCP actually works: the page cannot wake the agent, so **the board never waits for it.**

- **You play, instantly.** Click or drag pieces against the built-in bot (three levels). The app records every move, auto-detects simple tactical mistakes, keeps a persistent profile in `localStorage`, and works fully without an agent.
- **The coach comes when you call it.** Talk to it in the chat whenever you like. `get_game_state` hands it an **event queue** of everything that happened since its last call, plus your mistake history. It reviews with arrows and highlights, keeps a lesson plan, and logs the errors the app cannot see.
- **Drills are delegated to the page.** With `set_puzzle_queue` the agent composes 3-5 puzzles for your weakest themes; the app validates the lines, serves them one by one, auto-plays the replies, grades you and awards XP. When you come back, the agent reads the results and adapts.
- **Gamification is the coach's judgement.** XP, levels and badges are tools, so rewards follow real progress, and the profile survives sessions.
- **Live sparring is optional.** The agent can play against you through `make_move` + the long-running `wait_for_player_move`. It works as long as you are not chatting, which is exactly the limit of a pull-based protocol, and the UI says so.

## Getting started (2 minutes)

**Live app:** https://chessup-gamma.vercel.app
**Open directly in ChatGPT:** [chatgpt.com/codex/deeplink?url=https://chessup-gamma.vercel.app/](https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fchessup-gamma.vercel.app%2F&openaicom_referred=true) (ChatGPT desktop app with site tools, GPT-5.6 Sol or Terra)

1. **Open it inside an agent browser.**
   - **ChatGPT app:** click the deep link above, or open a new browser tab (the `+` next to your tabs), paste the link, and use the chat panel next to it.
   - **Chrome:** enable `chrome://flags/#enable-webmcp-testing`, restart, open the link, and use an agent that supports WebMCP.
2. **Check the header pill.** It turns green, **Agent connected**, when the page's 19 tools are registered with the agent.
3. **Play on the board, and talk to the coach whenever you want it.** Agents only act when you message them, so the page never waits for the coach. No special wording is needed; the tools carry the protocol and every result says what to do next. The tools carry a coaching protocol (start from the profile, play with `make_move` + `wait_for_player_move`, coach after every move), and every tool result tells the agent what to do next. Examples:

```
Turn my mistakes into a lesson.
I keep hanging pieces. Set up a drill of 5 puzzles that punish that.
Read my profile, build a lesson for today and walk me through it.
Start a sparring game: play against me and coach me after each move.
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
| `wait_for_player_move` | Sparring only. **Long-running call** that returns when the human moves (or a puzzle resolves, or after a timeout), so the agent can play a game move → wait → coach → move within one turn. |
| `make_move` | Play a move as the opponent or to demonstrate a line (SAN or from/to, optional comment). |
| `undo_move` | Take back N half-moves; un-fails a puzzle so the student can retry. |
| `new_game` | Start a game; choose the human's colour and opponent: `agent`, built-in `bot` (3 levels) or `human`. |
| `set_puzzle_queue` | **Drill**: 3-8 validated puzzles served one by one by the app, graded, rewarded and reported back per theme. The agent plans, the page executes. |
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
| `get_player_profile` | XP, level, badges, game/puzzle stats per theme, mistakes by category, weakest areas, lesson plan, and **`candidatePuzzles`**: validated puzzles built from the human's own mistakes (the position before a missed tactic, or the position after a blunder with the punishing move). |

### Human ↔ agent collaboration details

- **Designed for a pull-based protocol.** The page cannot push events to the agent, so the default flow never depends on it: the bot plays instantly, the app records, and the agent catches up from `events` when the human speaks. Long-running work (drills) is delegated to the page in one call. `wait_for_player_move` (with the WebMCP `AbortSignal`) exists for optional live sparring.
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
