import { Board } from "@/components/Board";
import { Header } from "@/components/Header";
import { CoachPanel } from "@/components/CoachPanel";
import { PuzzleCard } from "@/components/PuzzleCard";
import { LessonPlan } from "@/components/LessonPlan";
import { ProfilePanel } from "@/components/ProfilePanel";
import { GameControls } from "@/components/GameControls";
import { MoveLog } from "@/components/MoveLog";
import { AgentActivity } from "@/components/AgentActivity";
import { DebugPanel } from "@/components/DebugPanel";
import { WebMcpBridge } from "@/components/WebMcpBridge";

export default function Home() {
  return (
    <main className="min-h-screen">
      <WebMcpBridge />
      <Header />
      <div className="mx-auto max-w-[1400px] px-5 md:px-8 py-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <div className="mx-auto w-full max-w-[640px]">
            <Board />
            <GameControls />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <MoveLog />
            <AgentActivity />
          </div>
          <div className="mt-4">
            <DebugPanel />
          </div>
        </div>
        <aside className="space-y-4 min-w-0">
          <CoachPanel />
          <PuzzleCard />
          <LessonPlan />
          <ProfilePanel />
        </aside>
      </div>
      <footer className="px-8 pb-8 text-center text-[11px] text-slate-600">
        ChessUp · built for the WebMCP Challenge · the agent (ChatGPT) coaches through 16 WebMCP tools, you play every move.
      </footer>
    </main>
  );
}
