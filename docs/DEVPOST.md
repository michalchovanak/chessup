# ChessUp — submission copy

Copy-ready answers for the OpenAI WebMCP Challenge. Replace the repository and video placeholders before submitting.

## Project name

ChessUp

## Tagline

Your worst move becomes your next lesson.

## One-sentence pitch

ChessUp is a chess board that lets your browser agent read your game, explain mistakes directly on the board, and turn your own positions into personalized puzzle drills through WebMCP.

## Short description

ChessUp turns an ordinary game of chess into a shared coaching workspace for a person and their browser agent. The person plays every move. The agent reads the exact position and mistake history, draws explanations on the live board, and creates targeted exercises. ChessUp validates and grades those exercises locally, then reports the results so the agent can adapt the next lesson.

## Why is this use case a strong fit for WebMCP?

Chess coaching depends on shared, precise, rapidly changing context. A useful coach needs more than a screenshot: it needs the exact position, legal moves, recent events, the player's recurring mistakes, and a reliable way to point at the same squares the student sees.

WebMCP turns the open chess page into that shared workspace. ChessUp exposes structured tools for reading the game, annotating the board, creating validated puzzles, updating a lesson, and tracking progress. The agent provides judgement and personalization; the page provides legality, validation, grading, and persistence.

This is meaningfully better than generic browser automation. The agent does not guess from pixels or click through UI controls. It operates through explicit chess-aware actions and receives structured results that tell it what happened and what should happen next.

## How does it create a better user experience?

The player never has to export a PGN, copy a FEN, upload a screenshot, or describe what happened. They simply play on the board and ask for help in natural language.

The response appears where it is useful: arrows and highlights on the position, a short coaching note below the board, and an interactive drill in the same interface. The first puzzle can be the player's own mistake from moments earlier. The page checks every move, auto-plays the reply, advances the queue, and records the result without another round trip to the agent.

ChessUp also works without an agent. A built-in bot responds immediately while the page records events for the next coaching conversation. The agent enhances the experience without becoming a dependency for basic play.

## What can people and agents do together that was difficult or impossible before?

A person can now turn a mistake from a live game into deliberate practice without leaving the board or translating the position between products.

The person contributes the game, their goals, and the final decisions. The agent notices patterns across sessions, explains the important moment, chooses what to practise, and composes a targeted drill. ChessUp safely executes that plan: it validates the chess line, serves the puzzles, grades the human's moves, and stores the results. When the person returns to chat, the agent can see what was solved, update the lesson, and choose the next step.

Before WebMCP, a general browser agent could discuss chess but could not reliably read and modify a stateful third-party board through a stable, domain-specific interface. With ChessUp, the person and agent share one live artifact and can alternate naturally between conversation and direct manipulation.

## How did you implement WebMCP?

ChessUp registers 19 imperative tools from the top-level page through the `modelContext.registerTool()` API, supporting both `document.modelContext` and `navigator.modelContext` hosts. Every tool has a clear description, a constrained JSON input schema, and structured output. Read operations use `readOnlyHint` annotations.

The tool handlers reuse the same local store and chess logic as the human interface. `get_game_state` returns FEN, move history, status, material, active exercises, recent mistakes, and a queue of events since the previous call. Teaching tools draw arrows, highlight squares, and post notes. `set_puzzle_queue` accepts an agent-created drill, validates every FEN and SAN solution with chess.js, and rejects invalid lines before displaying them.

Long-running work is delegated to the page. It serves and grades a drill without polling the agent, while `wait_for_player_move` supports optional live sparring with an `AbortSignal`. All state persists in `localStorage`; no backend or API key is required.

## Inspiration

Most chess products separate playing, analysis, and training. Their puzzle sets are usually generic, even when the player has just demonstrated exactly what they need to practise.

A human coach works differently: they watch the student, identify a recurring pattern, explain it in the current position, and immediately create a similar exercise. WebMCP made it possible to reproduce that loop with the agent already beside the browser instead of embedding another chatbot or model inside the site.

## What it does

- Plays a normal game against a built-in bot or in two-player analysis mode.
- Records moves and detects simple tactical mistakes locally.
- Gives the agent exact game state and an event queue through WebMCP.
- Lets the agent explain with board highlights, arrows, and coaching notes.
- Generates validated puzzle drills based on the player's weakest patterns.
- Serves, grades, and advances those puzzles locally.
- Maintains a lesson plan, XP, badges, and a persistent mistake profile.
- Supports optional live agent sparring.

## How we built it

The app uses Next.js 16, React 19, TypeScript, Tailwind CSS 4, chess.js, and react-chessboard. A small browser-side store is shared by the React interface and all WebMCP handlers. Tools are registered imperatively when the page loads and unregistered through an abort signal when the component unmounts.

The deterministic work stays in the app: move legality, puzzle validation, bot replies, scoring, event recording, and persistence. The agent handles the open-ended work: explanation, prioritization, lesson design, and personalization.

## Challenges we ran into

The biggest design challenge was WebMCP's pull-based lifecycle. The page cannot independently wake the agent after every human move. We solved that in two ways: normal games use an instant built-in bot plus an event queue the agent reads later, while optional sparring uses a bounded `wait_for_player_move` tool.

The second challenge was trusting agent-generated chess content. A fluent-looking puzzle can still contain an illegal move. ChessUp validates the entire proposed SAN line against its FEN before starting a puzzle and returns a precise rejection when the line breaks.

The third challenge was keeping the experience understandable with 19 capabilities. We grouped the visible UI around one primary action—turn a mistake into a lesson—and placed secondary history, prompts, and progress behind disclosures.

## Accomplishments we are proud of

- The first drill position can come directly from the player's own game.
- The agent and the human operate on one visible board instead of exchanging notation manually.
- Agent-generated puzzle lines are validated before use.
- The app remains fully playable without an agent, backend, account, or API key.
- The same store powers the UI and WebMCP tools, so agent actions are immediately visible and auditable.

## What we learned

The best WebMCP tools do not mirror every button. They expose meaningful domain actions and return enough structured state for the agent to verify the result.

We also learned that human-agent collaboration works best when each side owns different work. The agent should not replace the student's chess move or the app's deterministic validator. It should contribute context-sensitive judgement that neither side can provide alone.

Finally, an agent-aware page needs to be resilient to absence and interruption. Recording events and delegating drills to the browser made the experience faster and more reliable than waiting for an agent after every interaction.

## What's next

- Spaced repetition for positions generated from the player's own mistakes.
- Opening-pattern tracking across games.
- Optional Stockfish WASM evaluation for deeper analysis while keeping everything local.
- Import and export of games and training history.

## Demo video script — 2 minutes

### 0:00–0:12 — Hook

Show ChessUp open beside the agent with **WebMCP live** visible.

> "Most chess apps tell you that you made a mistake. ChessUp turns that exact mistake into your next lesson."

### 0:12–0:35 — Make a mistake

Play a short prepared sequence against the built-in bot and deliberately leave a piece hanging. Show that the board responds immediately and records the game without waiting for the agent.

### 0:35–1:00 — Review together

Ask:

> "Turn my mistakes into a lesson: show the biggest one on the board with an arrow and the better move, then set up a drill of 3 puzzles on that type of mistake, starting with my own position."

Show the agent reading the profile and game state. Keep the camera on the board as the arrow, highlight, and coaching note appear.

### 1:00–1:30 — Practise the mistake

Show the first puzzle using the position from the game. Solve it on the board. Show the automatic opponent reply, grading, and progression to the next puzzle.

> "The agent designed the lesson. The page validates and runs it. I still make every move."

### 1:30–1:50 — Adapt

Complete or skip to the drill summary, then tell the agent:

> "I'm done. Update my lesson from the results."

Show the lesson status and player progress update.

### 1:50–2:00 — Close

> "One board. One agent. A lesson built from how I actually play."

End on the live URL and repository URL.

## Submission checklist

- [x] Project name and tagline
- [x] Complete written description
- [x] Answers to the four WebMCP questions
- [x] Working live app: https://chessup-gamma.vercel.app/
- [x] Open-source license: MIT
- [x] Public repository URL: https://github.com/michalchovanak/chessup
- [ ] Public demo video URL: **ADD BEFORE SUBMITTING**
- [ ] Final video recorded against the production URL
- [ ] Production deployment re-tested in ChatGPT's in-app browser
- [ ] Confirm all submission fields and eligibility requirements on Devpost
