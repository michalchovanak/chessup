# ChessUp — submission copy

Copy-ready text for the OpenAI WebMCP Challenge. Add the final video URL before submitting.

## Project name

ChessUp

## Tagline

Your worst move becomes your next lesson.

## One-sentence pitch

ChessUp lets your browser agent explain a mistake on the live chess board and turn that exact position into a personalized puzzle drill.

## Short description

Play a normal game against the built-in bot, then ask your browser agent for help. Through WebMCP, the agent reads the exact game state, marks the key mistake on the board, and creates a targeted drill. ChessUp validates every puzzle, grades each move, and remembers the result locally. The player never has to export a game, copy chess notation, or leave the board.

## Why is this use case a strong fit for WebMCP?

Chess coaching depends on precise, changing context: the position, legal moves, recent mistakes, and the player's history. A screenshot cannot provide that reliably.

WebMCP turns the open board into a shared workspace. The agent can read structured chess state and teach through chess-aware actions instead of guessing from pixels or clicking UI controls. The agent handles explanation and personalization; ChessUp handles legality, validation, grading, and persistence.

## How does it create a better user experience?

The player simply plays and asks for help in natural language. There is no PGN export, FEN copy, screenshot upload, account, or separate analysis tool.

The answer appears where it matters: arrows and highlights on the board, a short coaching note, and a drill that can start from the player's own mistake. ChessUp then runs and grades the drill without waiting for more agent calls. The built-in bot also replies instantly, so normal play never depends on the agent.

## What can people and agents do together that was difficult or impossible before?

A player can turn a mistake from a live game into deliberate practice without translating the position between products.

The player supplies the game and makes every decision for their side. The agent finds the important pattern, explains it, and designs the next lesson. ChessUp safely executes that plan, records the results, and gives them back to the agent for the next conversation. Both work on one visible, stateful artifact instead of passing notation or screenshots back and forth.

## How did you implement WebMCP?

ChessUp defines 20 imperative tools with constrained JSON schemas and structured results. Nineteen are registered during normal play; the live-sparring tool appears only when the player asks for an agent opponent. Board-changing tools are removed while a drill is active. A declarative form exposes player renaming.

The handlers use the same browser-side store and chess logic as the UI. `get_game_state` returns the position, history, mistakes, exercises, and new events. Teaching tools add arrows, highlights, and notes. `set_puzzle_queue` validates FEN and SAN with chess.js and checks solution quality with Stockfish 18 Lite in a Web Worker. Everything persists in `localStorage`; there is no backend or API key.

## Inspiration

Most chess apps separate playing, analysis, and training. A human coach does not: they watch, explain the important mistake, and immediately create a related exercise. WebMCP makes that loop possible with the agent already beside the browser.

## What it does

- Plays a normal game against an instant built-in bot.
- Scores moves locally with Stockfish.
- Gives the agent exact game state and recent events.
- Shows agent explanations on the board.
- Builds, validates, serves, and grades personalized drills.
- Tracks mistakes, lesson progress, XP, and badges locally.
- Supports optional live agent sparring.

## How we built it

Next.js 16, React 19, TypeScript, Tailwind CSS 4, chess.js, and react-chessboard power the interface. Stockfish 18 Lite runs locally in a Web Worker. One browser-side store powers both the UI and WebMCP handlers, so agent actions appear immediately on the board.

## Challenges we ran into

- **Agents are pull-based.** The built-in bot responds immediately, while an event queue preserves context for the next conversation.
- **Generated chess lines can be wrong.** ChessUp validates legality with chess.js and checks move quality with Stockfish before starting a drill.
- **Too many capabilities can feel complex.** The UI centers on one action: turn a mistake into a lesson.

## Accomplishments we are proud of

- A drill can begin with the player's own position from moments earlier.
- The agent and player work on one visible board.
- Agent-created puzzles are verified before use.
- The app needs no backend, account, or API key.

## What we learned

Good WebMCP tools expose meaningful domain actions, not every button. Human-agent collaboration also works best when responsibilities are clear: the agent judges and explains, the page verifies and executes, and the human decides.

## What's next

- Spaced repetition for positions from the player's games.
- Session summaries and opening-pattern tracking.
- Import and export for games and training history.

## Two-minute demo

### 0:00–0:15 — Hook

Show the live board and **WebMCP live** status.

> "Most chess apps tell you that you made a mistake. ChessUp turns that mistake into your next lesson."

### 0:15–0:35 — Play

Make a prepared mistake against the built-in bot. Show the instant reply and move history.

### 0:35–1:05 — Review

Ask:

> "Turn my mistakes into a lesson. Show the biggest one on the board, then create a three-puzzle drill starting from my position."

Show the arrow, highlight, and coaching note appear on the board.

### 1:05–1:35 — Practise

Solve the first puzzle. Show automatic replies, grading, and progress.

> "The agent designed the lesson. ChessUp validates and runs it. I still make every move."

### 1:35–1:50 — Adapt

Ask the agent to read the results and update the lesson plan.

### 1:50–2:00 — Close

> "One board. One agent. A lesson built from how I actually play."

## Submission checklist

- [x] Written submission copy
- [x] Live app: https://chessup-gamma.vercel.app/
- [x] Public repository: https://github.com/michalchovanak/chessup
- [x] MIT license
- [ ] Add the public demo video URL
- [ ] Re-test the production demo in ChatGPT
- [ ] Confirm the final Devpost fields and eligibility rules
