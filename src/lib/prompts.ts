export interface QuickPrompt {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  prompt: string;
}

/** Ready-made prompts for the human to paste into the agent chat. Any wording works; these just show what the coach can do. */
export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "play",
    emoji: "♟️",
    title: "Play & coach me",
    blurb: "The coach plays the other side and comments after your moves.",
    prompt: "Play a game against me on this board and coach me after each of my moves. Keep the game going by yourself until it ends.",
  },
  {
    id: "drill",
    emoji: "🎯",
    title: "Puzzle drill",
    blurb: "Puzzles built for your recorded weak spots, one after another.",
    prompt: "Look at my profile and give me a series of 5 puzzles that target my weakest areas, one at a time. Grade me and award XP.",
  },
  {
    id: "lesson",
    emoji: "📚",
    title: "Lesson from my profile",
    blurb: "A plan for today, then the coach walks you through it.",
    prompt: "Read my player profile, build a short lesson plan for today and guide me through it step by step on the board.",
  },
  {
    id: "review",
    emoji: "🔍",
    title: "Review my last game",
    blurb: "Arrows, highlights and notes on what went wrong.",
    prompt: "Review the game on the board: point out my mistakes with arrows and highlights, record them in my profile and tell me one thing to practise.",
  },
];

/**
 * Protocol shown on the page and embedded in tool descriptions so that any
 * natural request ("play with me", "coach me") leads to the right tool loop.
 */
export const COACH_PROTOCOL = [
  "Start: call get_player_profile and get_game_state, then set_lesson_plan (3-5 steps) based on the weakest areas.",
  "Playing: use new_game (opponent 'agent'), reply with make_move, then IMMEDIATELY call wait_for_player_move and continue this loop until the game ends. Never end your turn waiting for the human to type: the board is the conversation.",
  "Coaching: after every human move react with coach_note, highlight_squares or draw_arrows; log non-tactical errors with record_mistake.",
  "Drills: build puzzles with set_position (fen + title + goal + theme + solution), then wait_for_player_move and grade with add_xp / award_badge.",
  "Keep notes short, encouraging and specific. The human plays every move; you never move the human's pieces in a puzzle.",
];
