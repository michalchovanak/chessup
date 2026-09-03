export type Color = "w" | "b";
export type AnnoColor = "green" | "red" | "yellow" | "blue" | "orange";

export interface Highlight {
  square: string;
  color: AnnoColor;
}

export interface ArrowAnno {
  from: string;
  to: string;
  color: AnnoColor;
}

export type LessonStatus = "todo" | "active" | "done" | "skipped";

export interface LessonStep {
  title: string;
  description?: string;
  status: LessonStatus;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  earnedAt: number;
}

export type MistakeCategory =
  | "hanging_piece"
  | "missed_mate"
  | "allowed_mate"
  | "missed_capture"
  | "opening"
  | "endgame"
  | "tactics"
  | "positional"
  | "king_safety"
  | "other";

export type Severity = "inaccuracy" | "mistake" | "blunder";

export interface Mistake {
  id: string;
  at: number;
  category: MistakeCategory;
  severity: Severity;
  description: string;
  fen: string;
  movePlayed?: string;
  betterMove?: string;
  /** Position after the mistake (for "punish it" puzzles). */
  fenAfter?: string;
  /** The opponent's move that punishes the mistake, in SAN. */
  punishMove?: string;
  source: "auto" | "agent";
}

export type NoteKind = "tip" | "praise" | "warning" | "question" | "info";

export interface CoachNote {
  id: string;
  at: number;
  kind: NoteKind;
  text: string;
}

export type PuzzleStatus = "active" | "solved" | "failed";

export interface Puzzle {
  id: string;
  title: string;
  goal: string;
  fen: string;
  hint?: string;
  theme?: string;
  solution: string[];
  solutionIndex: number;
  status: PuzzleStatus;
  attempts: number;
  startedAt: number;
}

export interface PuzzleSpec {
  fen: string;
  title: string;
  goal: string;
  hint?: string;
  theme?: string;
  solution: string[];
}

export interface DrillResult {
  title: string;
  theme?: string;
  status: "solved" | "failed" | "skipped";
  attempts: number;
}

export interface Drill {
  id: string;
  title: string;
  puzzles: PuzzleSpec[];
  index: number;
  results: DrillResult[];
  status: "active" | "done";
  startedAt: number;
}

export interface DrillSummary {
  at: number;
  title: string;
  solved: number;
  total: number;
  themes: string[];
}

export interface PuzzleStats {
  attempted: number;
  solved: number;
  failed: number;
  byTheme: Record<string, { attempted: number; solved: number }>;
}

export interface XpEntry {
  at: number;
  amount: number;
  reason: string;
}

export interface Profile {
  name: string;
  xp: number;
  badges: Badge[];
  mistakes: Mistake[];
  puzzles: PuzzleStats;
  games: { played: number; won: number; lost: number; drawn: number };
  sessions: number;
  createdAt: number;
  lastSeenAt: number;
  xpLog: XpEntry[];
  drills: DrillSummary[];
}

export type Opponent = "agent" | "bot" | "human";

export interface GameSettings {
  playerColor: Color;
  opponent: Opponent;
  botLevel: 1 | 2 | 3;
}

export interface AgentEvent {
  id: string;
  at: number;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ToolCallRecord {
  id: string;
  at: number;
  tool: string;
  input: unknown;
  output: unknown;
  ok: boolean;
  durationMs: number;
  source: "agent" | "debug";
}

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  color: Color;
  by: "player" | "agent" | "bot" | "puzzle";
  fenBefore: string;
  fenAfter: string;
  flags: string[];
}

export interface AppState {
  hydrated: boolean;
  agentConnected: boolean;
  fen: string;
  startFen: string;
  moves: MoveRecord[];
  settings: GameSettings;
  gameRecorded: boolean;
  highlights: Highlight[];
  arrows: ArrowAnno[];
  lesson: { title: string; steps: LessonStep[] };
  puzzle: Puzzle | null;
  drill: Drill | null;
  notes: CoachNote[];
  profile: Profile;
  events: AgentEvent[];
  toolLog: ToolCallRecord[];
  thinking: boolean;
  agentWaiting: boolean;
  gameStartedAt: number;
  lastMoveAt: number;
}
