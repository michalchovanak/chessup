# ♞ ChessUp

**A learning tool should let the learner's agent see what they just did, and hand it back exercises it can trust.**

ChessUp is a chess board with no AI inside. Through WebMCP it exposes the game, the learner's mistakes and a way to run exercises to the agent already in the browser (ChatGPT's in-app browser, or Chrome with WebMCP enabled). The learner plays every move. The agent explains the mistake on the board and turns it into a drill. The page validates, grades and remembers.

[Live app](https://chessup-gamma.vercel.app/) · [Open in ChatGPT](https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fchessup-gamma.vercel.app%2F&openaicom_referred=true) · [Submission notes](docs/DEVPOST.md) · Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)

## The idea: five small changes to any learning platform

Most learning apps give everyone the same exercises. A good tutor watches one person, spots the pattern behind their mistakes and builds the next exercise from it. Learners now have such a tutor in their browser, but it sees pixels, not their learning.

WebMCP lets a page hand the agent structured capabilities. ChessUp shows that a learning tool needs only a handful of them:

1. **Expose the learner's state and what happened since the agent last looked** (position, moves, mistakes, results). `get_game_state` returns an event queue instead of asking the agent to diff histories.
2. **Accept exercises from the agent, but verify and run them yourself.** `set_puzzle_queue` checks every puzzle for legality and with Stockfish, then serves, grades and rewards it without the agent in the loop.
3. **Let the agent teach inside the learner's workspace.** Arrows, highlights and one-sentence captions land on the board the learner is looking at.
4. **Keep a profile the agent can read and add to.** Weak spots, verified candidate puzzles from the learner's own games, lesson plan, XP and badges, all local to the browser.
5. **Never wait for the agent.** Agents act only when spoken to, so the built-in bot plays instantly and the page records everything for the next conversation.

The split is the point: the page owns rules, validation, grading and memory; the agent owns judgement, explanation and personalisation; the learner owns every decision. The same pattern applies to grammar drills, maths steps, music practice or coding exercises. ChessUp is one concrete, working instance, not evidence of learning outcomes; that would need a study.

## Try it

1. Open the [live app in ChatGPT](https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fchessup-gamma.vercel.app%2F&openaicom_referred=true) (desktop app with site tools) or in Chrome with `chrome://flags/#enable-webmcp-testing`. The header shows **WebMCP live** with the number of registered tools.
2. Play a few moves against the built-in bot. Make a mistake; the board records it.
3. Say, in any language:

   > Turn my mistakes into a lesson.

The agent reads the game and your profile, marks the mistake with an arrow, builds a drill starting from your own position, and adapts the plan when you tell it you are done. Without an agent the board still works: play the bot at three levels, watch the evaluation bar, keep your profile.

## The tools

Twenty tools, defined in [`src/lib/tools.ts`](src/lib/tools.ts) and registered in [`src/lib/webmcp.ts`](src/lib/webmcp.ts).

| Group | Tools |
| --- | --- |
| Orient | `read_coach_instructions` |
| Observe | `get_game_state`, `get_legal_moves`, `get_player_profile`, `analyze_position` (Stockfish) |
| Teach | `highlight_squares`, `draw_arrows`, `clear_annotations`, `coach_note` |
| Practise | `set_puzzle_queue`, `set_position` |
| Plan and reward | `set_lesson_plan`, `update_lesson_step`, `record_mistake`, `add_xp`, `award_badge` |
| Play | `new_game`, `make_move`, `undo_move`, `wait_for_player_move` (live sparring) |

Details that matter for a learning tool:

- **Tool sets follow context.** Board-changing tools are unregistered while a drill runs; the sparring tool exists only when the learner asked the coach to play. Each group has its own `AbortController`.
- **Agent content is verified before the learner sees it.** Illegal lines return the legal moves; legal but wrong solutions are rejected by Stockfish with the reason.
- **Small, guided outputs.** Every state-returning tool includes a `next` sentence; read-only tools carry `readOnlyHint`; the profile carries `untrustedContentHint`.
- **Both halves of the proposal.** Imperative registration for the coaching tools, and a declarative HTML form (`toolname`, `tooldescription`) for renaming the player.

## How it is built

Next.js 16, React 19, TypeScript, Tailwind 4, chess.js, react-chessboard. Stockfish 18 lite (single-threaded WebAssembly, loaded lazily in a Web Worker) scores every move, verifies puzzles and feeds the evaluation bar. No backend, no account, no API key; the profile lives in `localStorage`.

```text
src/lib/store.ts        game, drills, profile, events, persistence
src/lib/tools.ts        the 20 WebMCP tools
src/lib/webmcp.ts       registration and dynamic tool sets
src/lib/engine.ts       Stockfish UCI client
src/lib/chessLogic.ts   bot and instant mistake heuristics
src/components/         board and panels
public/engine/          Stockfish build (GPLv3)
```

```bash
npm install
npm run dev
```

## License

App code: [MIT](LICENSE). The bundled Stockfish engine in `public/engine/` is GPLv3 (see `public/engine/COPYING.txt`) and runs as a separate WebAssembly worker.
