export interface Member {
  id: number;
  name: string;
  phone: string;
  email: string;
  points: number;
  joinedAt: string;
}

export const MOCK_MEMBERS: Member[] = [
  {
    id: 1,
    name: "John Doe",
    phone: "081234567890",
    email: "john@example.com",
    points: 184,
    joinedAt: "2026-02-14",
  },
  {
    id: 2,
    name: "Jane Smith",
    phone: "081298765432",
    email: "jane@example.com",
    points: 85,
    joinedAt: "2026-01-03",
  },
  {
    id: 3,
    name: "Budi Santoso",
    phone: "081377700011",
    email: "budi@example.com",
    points: 320,
    joinedAt: "2026-04-22",
  },
  {
    id: 4,
    name: "Siti Rahayu",
    phone: "081299988877",
    email: "siti@example.com",
    points: 45,
    joinedAt: "2026-06-30",
  },
];

export const EARN_RATE = 1000;

export function memberTier(points: number): { label: string; className: string } {
  if (points >= 300) return { label: "Gold", className: "bg-warning/15 text-warning" };
  if (points >= 100) return { label: "Silver", className: "bg-muted text-muted-foreground" };
  return { label: "Regular", className: "bg-primary/10 text-primary" };
}

export interface PointHistoryEntry {
  id: number;
  memberId: number;
  kind: "perolehan" | "penukaran";
  points: number;
  note: string;
  createdAt: string;
}

export const MOCK_POINT_HISTORY: PointHistoryEntry[] = [
  {
    id: 1,
    memberId: 1,
    kind: "perolehan",
    points: 54,
    note: "Transaksi INV-20260830-042",
    createdAt: "2026-08-30T08:30:00.000Z",
  },
  {
    id: 2,
    memberId: 1,
    kind: "penukaran",
    points: -20,
    note: "Tukar poin untuk potongan Rp2.000",
    createdAt: "2026-08-30T08:00:00.000Z",
  },
  {
    id: 3,
    memberId: 1,
    kind: "perolehan",
    points: 36,
    note: "Transaksi INV-20260828-011",
    createdAt: "2026-08-28T10:15:00.000Z",
  },
  {
    id: 4,
    memberId: 2,
    kind: "perolehan",
    points: 20,
    note: "Transaksi INV-20260829-018",
    createdAt: "2026-08-29T09:05:00.000Z",
  },
];