import AppShell from "@/components/app-shell";
import { LeaderboardBoard } from "@/components/leaderboard/leaderboard-board";
import { RewardPanel } from "@/components/leaderboard/reward-panel";
import { WinnerHistory } from "@/components/leaderboard/winner-history";

export default function LeaderboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Leaderboard Reward</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Peringkat member berdasarkan poin bulan ini dan penerima reward
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LeaderboardBoard />
          </div>
          <RewardPanel />
        </div>

        <div className="mt-6">
          <WinnerHistory />
        </div>
      </div>
    </AppShell>
  );
}