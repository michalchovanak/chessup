import { Board } from "@/components/Board";
import { Header } from "@/components/Header";
import { PuzzleCard } from "@/components/PuzzleCard";
import { LessonPlan } from "@/components/LessonPlan";
import { ProfilePanel } from "@/components/ProfilePanel";
import { GameControls } from "@/components/GameControls";
import { MoveLog } from "@/components/MoveLog";
import { AgentActivity } from "@/components/AgentActivity";
import { DebugPanel } from "@/components/DebugPanel";
import { WebMcpBridge } from "@/components/WebMcpBridge";
import { StartPanel } from "@/components/StartPanel";
import { Onboarding } from "@/components/Onboarding";
import { CoachProtocol } from "@/components/CoachProtocol";
import { GameOverModal } from "@/components/GameOverModal";

export default function Home() {
  return (
    <main className="min-h-screen">
      <WebMcpBridge />
      <Onboarding />
      <GameOverModal />
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
          <div className="mt-4 space-y-4 opacity-80">
            <DebugPanel />
            <CoachProtocol />
          </div>
        </div>
        <aside className="space-y-4 min-w-0">
          <StartPanel />
          <PuzzleCard />
          <LessonPlan />
          <ProfilePanel />
        </aside>
      </div>
      <footer className="px-8 pb-8 text-center text-[11px] text-slate-600">
        ChessUp · built for the WebMCP Challenge · you play every move, the agent (ChatGPT) coaches through 19 WebMCP tools.
      </footer>
    </main>
  );
}
