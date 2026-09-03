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
    id: "lesson-from-mistakes",
    emoji: "🎓",
    title: "Turn my mistakes into a lesson",
    blurb: "Arrows on what went wrong, then a drill built from it.",
    prompt: "Turn my mistakes into a lesson: show the biggest one on the board with an arrow and the better move, then set up a drill of 3 puzzles on that type of mistake, starting with my own position.",
  },
  {
    id: "drill",
    emoji: "🎯",
    title: "Puzzle drill",
    blurb: "5 puzzles built for your weak spots, served one by one.",
    prompt: "Look at my profile and set up a drill of 5 puzzles that target my weakest areas. I'll solve them on the board and come back.",
  },
  {
    id: "lesson",
    emoji: "📚",
    title: "Lesson for today",
    blurb: "A plan from your profile, then the coach walks you through it.",
    prompt: "Read my player profile, build a short lesson plan for today and guide me through it step by step.",
  },
  {
    id: "sparring",
    emoji: "♟️",
    title: "Live sparring",
    blurb: "The coach plays against you and comments (works while you don't chat).",
    prompt: "Start a sparring game: play against me as the opponent and coach me after each of my moves. Keep the game going by yourself until it ends.",
  },
];

/**
 * Protocol shown on the page and embedded in tool descriptions so that any
 * natural request ("play with me", "coach me") leads to the right tool loop.
 */
export const COACH_PROTOCOL = [
  "The human plays on the board against the built-in bot; the board never waits for you. You are the coach they call when they want a review, a plan or a drill.",
  "Start: get_player_profile and get_game_state (its `events` list everything that happened since your last call), then set_lesson_plan if there is none.",
  "Review: use highlight_squares, draw_arrows and one-sentence coach_note captions on the board; put the explanation in the chat. Log non-tactical errors with record_mistake.",
  "Drill: set_puzzle_queue with 3-5 puzzles targeting weakestAreas; the app serves them one by one, grades them and awards XP. When the human returns, read the drill results and adapt.",
  "Sparring (optional, only when asked): new_game with opponent 'agent', then make_move and wait_for_player_move in a loop. It stops as soon as the human chats; that is expected.",
  "Reward real progress with add_xp and award_badge. Reply in the human's language.",
];

/** Deep link that opens a URL inside the ChatGPT desktop app's browser (format used by OpenAI's WebMCP sample apps). */
export function chatgptDeeplink(appUrl: string): string {
  return `https://chatgpt.com/codex/deeplink?url=${encodeURIComponent(appUrl)}&openaicom_referred=true`;
}
