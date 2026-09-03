# Graph Report - chessup  (2026-09-03)

## Corpus Check
- Corpus is ~17,259 words - fits in a single context window. You may not need a graph.

## Summary
- 309 nodes · 594 edges · 21 communities (18 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Game State Store
- Player Interface
- Shared Types and Mutations
- Chess Analysis Heuristics
- Runtime Dependencies
- Onboarding and Header
- TypeScript Configuration
- WebMCP Bridge and Debugging
- Product and Deployment
- WebMCP State and Events
- Adaptive Coaching System
- Next.js Agent Guidance
- Core Coaching Tools
- Roadmap and Demo
- Deterministic Safety Layer
- Human-Agent Game Loop
- App Shell
- Personalized Puzzle System
- Lint Configuration
- Next.js Configuration
- PostCSS Configuration

## God Nodes (most connected - your core abstractions)
1. `Store` - 57 edges
2. `useApp()` - 25 edges
3. `compilerOptions` - 16 edges
4. `ChessUp` - 14 edges
5. `analyseHumanMove()` - 10 edges
6. `gameStatus()` - 9 edges
7. `uid()` - 9 edges
8. `Panel()` - 8 edges
9. `Adaptive Browser Coach` - 8 edges
10. `ChessUp Devpost Submission` - 8 edges

## Surprising Connections (you probably didn't know these)
- `ChessUp Devpost Submission` --semantically_similar_to--> `ChessUp`  [INFERRED] [semantically similar]
  docs/DEVPOST.md → README.md
- `Globe Icon` --conceptually_related_to--> `WebMCP`  [INFERRED]
  public/globe.svg → README.md
- `Human-Agent Chess Collaboration` --semantically_similar_to--> `Human-Controlled Chess`  [INFERRED] [semantically similar]
  docs/DEVPOST.md → README.md
- `Personalized Generated Puzzles` --semantically_similar_to--> `Puzzle Rush on Demand`  [INFERRED] [semantically similar]
  docs/DEVPOST.md → README.md
- `Browser Window Icon` --conceptually_related_to--> `ChatGPT Built-in Browser`  [INFERRED]
  public/window.svg → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Agent Play and Coach Loop** — readme_make_move, readme_wait_for_player_move, readme_get_game_state, readme_coach_note [EXTRACTED 1.00]
- **Adaptive Puzzle Feedback Loop** — readme_record_mistake, readme_get_player_profile, readme_set_position, readme_puzzle_contract [EXTRACTED 1.00]
- **Transparent WebMCP Tool Surface** — readme_tool_registration, readme_tool_definitions, readme_read_only_annotations, readme_agent_activity_panel [INFERRED 0.88]

## Communities (21 total, 3 thin omitted)

### Community 0 - "Game State Store"
Cohesion: 0.09
Nodes (10): uid(), validateFen(), defaultProfile(), defaultSettings(), initialState(), Store, AppState, GameSettings (+2 more)

### Community 1 - "Player Interface"
Cohesion: 0.12
Nodes (22): AgentActivity(), Board(), onSquareClick(), tryMove(), findKing(), CoachPanel(), STYLE, GameControls() (+14 more)

### Community 2 - "Shared Types and Mutations"
Cohesion: 0.08
Nodes (26): START_FEN, ANNO_COLORS, Listener, MoveInput, SetPositionInput, SQUARES_RE, AgentEvent, AnnoColor (+18 more)

### Community 3 - "Chess Analysis Heuristics"
Cohesion: 0.10
Nodes (28): analyseHumanMove(), AutoMistake, bestCapture(), captureNet(), findMateInOne(), flipTurn(), materialBalance(), other() (+20 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, chess.js, next, react, react-chessboard, react-dom, devDependencies, eslint (+16 more)

### Community 5 - "Onboarding and Header"
Cohesion: 0.15
Nodes (14): CoachProtocol(), Header(), getSnapshot(), listeners, notify(), Onboarding(), close(), openOnboarding() (+6 more)

### Community 6 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 7 - "WebMCP Bridge and Debugging"
Cohesion: 0.22
Nodes (11): DebugPanel(), run(), EXAMPLES, WebMcpBridge(), runTool(), tools, getModelContext(), ModelContextLike (+3 more)

### Community 8 - "Product and Deployment"
Cohesion: 0.18
Nodes (11): Vercel Triangle Logo, Browser Window Icon, ChatGPT Built-in Browser, ChessUp, Chrome WebMCP Testing, OpenAI WebMCP Challenge, React 19, react-chessboard (+3 more)

### Community 9 - "WebMCP State and Events"
Cohesion: 0.20
Nodes (10): File Document Icon, Globe Icon, Agent Activity Panel, Player Event Queue, get_game_state, Read-Only Tool Annotations, WebMCP Tool Definitions, WebMCP Tool Registration (+2 more)

### Community 10 - "Adaptive Coaching System"
Cohesion: 0.22
Nodes (10): Adaptive Browser Coach, add_xp, Agent-Driven Gamification, award_badge, clear_annotations, draw_arrows, highlight_squares, Persistent Local Player Profile (+2 more)

### Community 11 - "Next.js Agent Guidance"
Cohesion: 0.33
Nodes (6): Installed Next.js Documentation, Next Dev Agent File Generator, Next.js 16 Agent Rules, Claude Project Instructions, Next.js Logotype, Next.js 16

### Community 12 - "Core Coaching Tools"
Cohesion: 0.33
Nodes (6): Agent Coaching Protocol, get_legal_moves, get_player_profile, make_move, read_coach_instructions, record_mistake

### Community 13 - "Roadmap and Demo"
Cohesion: 0.40
Nodes (5): ChessUp Devpost Submission, ChessUp Demo Video Script, Opening Repertoire Tracking, Puzzle Spaced Repetition, Stockfish WASM Evaluation

### Community 14 - "Deterministic Safety Layer"
Cohesion: 0.40
Nodes (5): Deterministic App and Agent Judgement Split, Informative Tool Errors, WebMCP Integration, chess.js, Engine-Free Auto-Analysis

### Community 15 - "Human-Agent Game Loop"
Cohesion: 0.40
Nodes (5): Human-Agent Chess Collaboration, coach_note, Human-Controlled Chess, new_game, undo_move

### Community 16 - "App Shell"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 17 - "Personalized Puzzle System"
Cohesion: 0.83
Nodes (4): Personalized Generated Puzzles, Validated Puzzle Contract, Puzzle Rush on Demand, set_position

## Knowledge Gaps
- **98 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Game State Store` to `Player Interface`, `Shared Types and Mutations`, `Chess Analysis Heuristics`, `WebMCP Bridge and Debugging`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `ChessUp` connect `Product and Deployment` to `WebMCP State and Events`, `Adaptive Coaching System`, `Next.js Agent Guidance`, `Roadmap and Demo`, `Deterministic Safety Layer`, `Human-Agent Game Loop`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Adaptive Browser Coach` connect `Adaptive Coaching System` to `Product and Deployment`, `Personalized Puzzle System`, `Human-Agent Game Loop`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Game State Store` be split into smaller, more focused modules?**
  _Cohesion score 0.09178743961352658 - nodes in this community are weakly interconnected._
- **Should `Player Interface` be split into smaller, more focused modules?**
  _Cohesion score 0.12427409988385599 - nodes in this community are weakly interconnected._
- **Should `Shared Types and Mutations` be split into smaller, more focused modules?**
  _Cohesion score 0.08253968253968254 - nodes in this community are weakly interconnected._