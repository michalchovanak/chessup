# ♞ ChessUp

**Your worst move becomes your next lesson.**

ChessUp is a chess board shared with your browser agent through WebMCP. Play against the built-in bot, ask for a review, and the agent marks the mistake on the board and builds a drill from your own position. ChessUp validates the puzzles, grades every move, and remembers your progress locally.

[Try ChessUp](https://chessup-gamma.vercel.app/) · [Open in ChatGPT](https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fchessup-gamma.vercel.app%2F&openaicom_referred=true) · [Submission copy](docs/DEVPOST.md) · [WebMCP Challenge](https://openai.com/webmcp-challenge/)

## Try the core loop

1. Open ChessUp in a browser with WebMCP support.
2. Play a few moves against the built-in bot.
3. Ask your agent:

   > Turn my mistakes into a lesson. Show the biggest one on the board, then create a three-puzzle drill starting from my position.

4. Solve the drill on the same board.

No PGN export, FEN copy, screenshot, account, backend, or API key is required. The board also remains fully playable without an agent.

## Why WebMCP

A useful chess coach needs exact, changing state—not a screenshot. WebMCP lets ChessUp give the agent three things:

- **Context:** the position, legal moves, recent events, mistakes, and player profile.
- **Actions:** arrows, highlights, coaching notes, lessons, and puzzle queues on the live board.
- **Safe execution:** ChessUp checks legality and Stockfish quality, serves the drill, grades it, and stores the result.

The agent owns judgement and personalization. The page owns chess rules, validation, grading, and memory. The player makes every decision.

## WebMCP tools

ChessUp defines 20 imperative tools. Nineteen are active during normal play; live agent sparring enables the twentieth.

| Purpose | Tools |
| --- | --- |
| Read | game state, legal moves, profile, Stockfish analysis |
| Teach | arrows, highlights, notes |
| Practise | positions and validated puzzle queues |
| Plan | lesson steps, mistakes, XP, badges |
| Play | new game, move, undo, wait for the player |

The live tool set follows the app state, every state response guides the next action, and agent-created chess content is checked before the player sees it. A declarative WebMCP form handles player renaming.

Tool definitions live in [`src/lib/tools.ts`](src/lib/tools.ts); registration lives in [`src/lib/webmcp.ts`](src/lib/webmcp.ts).

## Run locally

Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, chess.js, react-chessboard, and Stockfish 18 Lite running in a Web Worker.

```bash
npm install
npm run dev
```

Game state and progress are stored in `localStorage`.

## License

The app is [MIT licensed](LICENSE). The bundled Stockfish engine is GPLv3; see [`public/engine/COPYING.txt`](public/engine/COPYING.txt).
