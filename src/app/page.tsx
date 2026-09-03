import { Board } from "@/components/Board";
import { Header } from "@/components/Header";
import { PuzzleCard } from "@/components/PuzzleCard";
import { LessonPlan } from "@/components/LessonPlan";
import { ProfilePanel } from "@/components/ProfilePanel";
import { GameControls } from "@/components/GameControls";
import { MoveLog } from "@/components/MoveLog";
import { AgentActivity } from "@/components/AgentActivity";
import { WebMcpBridge } from "@/components/WebMcpBridge";
import { StartPanel } from "@/components/StartPanel";
import { Onboarding } from "@/components/Onboarding";
import { GameOverModal } from "@/components/GameOverModal";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <WebMcpBridge />
      <Onboarding />
      <GameOverModal />
      <Header />
      <div className="mx-auto grid max-w-[1380px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:gap-7">
        <div className="min-w-0">
          <div className="board-column mx-auto">
            <Board />
            <GameControls />
          </div>
          <div className="board-column mx-auto mt-3 space-y-2">
            <MoveLog />
            <AgentActivity />
          </div>
        </div>
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-[72px] lg:self-start">
          <StartPanel />
          <PuzzleCard />
          <LessonPlan />
          <ProfilePanel />
        </aside>
      </div>
    </main>
  );
}
