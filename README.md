# ♞ ChessUp

**Your worst move becomes your next lesson.**

ChessUp is a local-first chess board that an agent can coach through WebMCP. You play every move. The agent reads the exact game state, explains mistakes directly on the board, and turns your own positions into interactive practice.

[Live demo](https://chessup-gamma.vercel.app/) · [Open in ChatGPT](https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fchessup-gamma.vercel.app%2F&openaicom_referred=true) · [Source](https://github.com/michalchovanak/chessup) · [Submission copy](docs/DEVPOST.md)

Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/).

## The moment

1. You make a mistake in a real game.
2. The agent reads the position and recent events through WebMCP.
3. It marks the mistake with an arrow, highlights the better move, and explains it.
4. It creates a short drill on the same pattern, starting with your own position.
5. The page validates, serves, and grades the puzzles; the agent adapts after seeing the results.

This is the core of ChessUp: **mistake → explanation → deliberate practice → progress**.

## Why WebMCP

On an ordinary chess site, a browser agent would have to infer the position from pixels or reverse-engineer the DOM. It could talk about chess, but it could not reliably share control of the live board.

ChessUp exposes the board as structured capabilities instead:

- **Exact context:** FEN, move history, legal moves, game status, mistakes, lesson progress, and events since the agent's last visit.
- **Visible teaching:** arrows, highlights, and one-sentence coaching notes appear on the same board the person is using.
- **Safe delegation:** agent-created puzzle lines are validated before the student sees them.
- **Continuity:** a local player profile keeps mistakes, puzzle results, XP, badges, and weak areas across sessions.
- **Pull-aware design:** the built-in bot responds instantly and the page records events, so the game never waits for the agent to wake up.

The person supplies intent and plays the moves. The agent supplies judgement and adaptation. The page owns deterministic rules, validation, and grading.

## Try the winning flow

1. Open the [live app in ChatGPT](https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fchessup-gamma.vercel.app%2F&openaicom_referred=true).
2. Confirm that the header says **WebMCP live**.
3. Play a few moves against the built-in bot.
4. Ask:

   > Turn my mistakes into a lesson: show the biggest one on the board with an arrow and the better move, then set up a drill of 3 puzzles on that type of mistake, starting with my own position.

The board also works without an agent. In solo mode you can play the built-in bot at three levels or use both sides for analysis.

## What people and agents do together

| Person | Agent | ChessUp page |
| --- | --- | --- |
| Plays and decides when help is useful | Reads the exact position and identifies the teaching moment | Records the game and exposes structured state |
| Reviews arrows and explanations | Annotates the board and proposes a better move | Renders those annotations in context |
| Solves the exercises | Builds a drill for the player's weakest pattern | Validates, serves, and grades every puzzle |
| Chooses what to work on next | Adapts the lesson from results | Persists progress locally |

## WebMCP capabilities

ChessUp registers 19 tools from [`src/lib/tools.ts`](src/lib/tools.ts):

- **Orient:** `read_coach_instructions`
- **Observe:** `get_game_state`, `get_legal_moves`, `get_player_profile`
- **Play:** `new_game`, `make_move`, `undo_move`, `wait_for_player_move`
- **Teach:** `highlight_squares`, `draw_arrows`, `clear_annotations`, `coach_note`
- **Practise:** `set_position`, `set_puzzle_queue`
- **Plan and reward:** `set_lesson_plan`, `update_lesson_step`, `record_mistake`, `add_xp`, `award_badge`

Read operations carry `readOnlyHint`. Tool inputs are constrained by JSON Schema, illegal moves return legal alternatives, and invalid puzzle solutions are rejected before they reach the board.

## Implementation

- Tools are registered at the top-level page through the imperative `modelContext.registerTool()` API, supporting both `document.modelContext` and `navigator.modelContext` hosts.
- A small external store coordinates React, the chess rules, local persistence, puzzle execution, and WebMCP calls.
- `chess.js` handles legal move validation. Lightweight heuristics detect hanging pieces, missed captures, and mate-in-one patterns.
- The event queue tells the agent what happened since its previous call instead of asking it to diff game histories.
- Everything runs in the browser. There is no backend, API key, account, or model bundled into the app.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · chess.js · react-chessboard · Vercel

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`. WebMCP is available in ChatGPT's in-app browser or a compatible browser with WebMCP enabled.

```bash
npm run lint
npm run build
```

## Project map

```text
src/app/                   page, layout, and global styles
src/components/            board and visible interaction states
src/lib/tools.ts           19 WebMCP schemas and handlers
src/lib/webmcp.ts          browser registration adapter
src/lib/store.ts           game state, persistence, drills, and events
src/lib/chessLogic.ts      bot and lightweight mistake detection
docs/DEVPOST.md            copy-ready submission answers and demo script
```

## License

[MIT](LICENSE)
