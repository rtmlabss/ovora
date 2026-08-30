export interface LeaderboardEntry {
  id: number;
  name: string;
  phone: string;
  monthPoints: number;
  rank: number;
  reward: string | null;
  isWinner: boolean;
}

export interface Period {
  key: string;
  label: string;
  timespanLabel: string;
  deadline?: string;
  closed: boolean;
}

export const PERIODS: Period[] = [
  {
    key: "2026-08",
    label: "Agustus 2026",
    timespanLabel: "Reward Agustus 2026",
    deadline: "31 Agustus 2026",
    closed: false,
  },
  {
    key: "2026-07",
    label: "Juli 2026",
    timespanLabel: "Reward Juli 2026",
    deadline: "31 Juli 2026",
    closed: true,
  },
  {
    key: "2026-06",
    label: "Juni 2026",
    timespanLabel: "Reward Juni 2026",
    deadline: "30 Juni 2026",
    closed: true,
  },
];

const byPeriod = (
  entries: Omit<LeaderboardEntry, "reward" | "isWinner">[],
  winCount: number,
  rewards: string[]
): LeaderboardEntry[] =>
  entries.map((m, i) => ({
    ...m,
    reward: i < winCount ? rewards[i] ?? null : null,
    isWinner: i < winCount,
  }));

const AUGUST: Omit<LeaderboardEntry, "reward" | "isWinner">[] = [
  { id: 1, name: "John Doe", phone: "081234567890", monthPoints: 420, rank: 1 },
  { id: 4, name: "Siti Rahayu", phone: "081299988877", monthPoints: 305, rank: 2 },
  { id: 2, name: "Budi Santoso", phone: "081377700011", monthPoints: 260, rank: 3 },
  { id: 3, name: "Jane Smith", phone: "081298765432", monthPoints: 185, rank: 4 },
  { id: 5, name: "Agus Wijaya", phone: "081311122233", monthPoints: 120, rank: 5 },
];

const JULY: Omit<LeaderboardEntry, "reward" | "isWinner">[] = [
  { id: 5, name: "Agus Wijaya", phone: "081311122233", monthPoints: 510, rank: 1 },
  { id: 1, name: "John Doe", phone: "081234567890", monthPoints: 460, rank: 2 },
  { id: 4, name: "Siti Rahayu", phone: "081299988877", monthPoints: 340, rank: 3 },
  { id: 2, name: "Budi Santoso", phone: "081377700011", monthPoints: 210, rank: 4 },
  { id: 6, name: "Dewi Lestari", phone: "081266655544", monthPoints: 90, rank: 5 },
];

const JUNE: Omit<LeaderboardEntry, "reward" | "isWinner">[] = [
  { id: 6, name: "Dewi Lestari", phone: "081266655544", monthPoints: 380, rank: 1 },
  { id: 5, name: "Agus Wijaya", phone: "081311122233", monthPoints: 290, rank: 2 },
  { id: 4, name: "Siti Rahayu", phone: "081299988877", monthPoints: 150, rank: 3 },
  { id: 7, name: "Rina Marlina", phone: "081244433322", monthPoints: 110, rank: 4 },
  { id: 3, name: "Jane Smith", phone: "081298765432", monthPoints: 70, rank: 5 },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = byPeriod(AUGUST, 3, [
  "1 kg Telur Ayam Negeri Gratis",
  "Voucher Rp30.000",
  "5 papan Telur Puyuh",
]);

export const MOCK_LEADERBOARD_BY_PERIOD: Record<string, LeaderboardEntry[]> = {
  "2026-08": MOCK_LEADERBOARD,
  "2026-07": byPeriod(JULY, 3, [
    "1 kg Telur Ayam Negeri Gratis",
    "Voucher Rp30.000",
    "5 papan Telur Puyuh",
  ]),
  "2026-06": byPeriod(JUNE, 3, [
    "1 kg Telur Ayam Negeri Gratis",
    "Voucher Rp30.000",
    "5 papan Telur Puyuh",
  ]),
};

export const DEFAULT_PERIOD_KEY = "2026-08";
export const TOP_WINNERS = 3;