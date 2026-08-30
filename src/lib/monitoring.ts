export interface BranchMonitoring {
  id: number;
  name: string;
  city: string;
  address: string;
  status: "aktif" | "libur";
  todayRevenue: number;
  monthRevenue: number;
  todayTransactions: number;
  lowStockItems: number;
  outItems: number;
  members: number;
  pointsAwarded: number;
}

export interface BranchSalesRow {
  branchId: number;
  branchName: string;
  revenue: number;
  transactions: number;
}

export interface BranchSalesComparison {
  period: string;
  branches: BranchSalesRow[];
}

export const MOCK_SALES_BY_PERIOD: Record<string, BranchSalesComparison> = {
  "2026-08": {
    period: "Agustus 2026",
    branches: [
      { branchId: 1, branchName: "Toko Utama", revenue: 24_800_000, transactions: 186 },
      { branchId: 2, branchName: "Toko Cabang Panciro", revenue: 13_400_000, transactions: 102 },
      { branchId: 3, branchName: "Toko Cabang Delta", revenue: 7_900_000, transactions: 61 },
    ],
  },
  "2026-07": {
    period: "Juli 2026",
    branches: [
      { branchId: 1, branchName: "Toko Utama", revenue: 21_300_000, transactions: 168 },
      { branchId: 2, branchName: "Toko Cabang Panciro", revenue: 11_800_000, transactions: 90 },
      { branchId: 3, branchName: "Toko Cabang Delta", revenue: 6_500_000, transactions: 52 },
    ],
  },
  "2026-06": {
    period: "Juni 2026",
    branches: [
      { branchId: 1, branchName: "Toko Utama", revenue: 19_900_000, transactions: 155 },
      { branchId: 2, branchName: "Toko Cabang Panciro", revenue: 10_200_000, transactions: 78 },
      { branchId: 3, branchName: "Toko Cabang Delta", revenue: 5_800_000, transactions: 44 },
    ],
  },
};

export const SALES_PERIOD_KEYS = ["2026-08", "2026-07", "2026-06"];

export interface BranchStockRow {
  branchId: number;
  branchName: string;
  productId: number;
  productName: string;
  unit: string;
  stockQty: number;
  minStock: number;
}

export const MOCK_BRANCH_STOCK: BranchStockRow[] = [
  { branchId: 1, branchName: "Toko Utama", productId: 1, productName: "Telur Ayam Negeri", unit: "kg", stockQty: 45, minStock: 10 },
  { branchId: 2, branchName: "Toko Cabang Panciro", productId: 1, productName: "Telur Ayam Negeri", unit: "kg", stockQty: 18, minStock: 10 },
  { branchId: 3, branchName: "Toko Cabang Delta", productId: 1, productName: "Telur Ayam Negeri", unit: "kg", stockQty: 6, minStock: 10 },
  { branchId: 1, branchName: "Toko Utama", productId: 2, productName: "Telur Ayam Kampung", unit: "kg", stockQty: 12, minStock: 8 },
  { branchId: 2, branchName: "Toko Cabang Panciro", productId: 2, productName: "Telur Ayam Kampung", unit: "kg", stockQty: 9, minStock: 8 },
  { branchId: 3, branchName: "Toko Cabang Delta", productId: 2, productName: "Telur Ayam Kampung", unit: "kg", stockQty: 3, minStock: 8 },
  { branchId: 1, branchName: "Toko Utama", productId: 3, productName: "Telur Itik", unit: "kg", stockQty: 20, minStock: 6 },
  { branchId: 2, branchName: "Toko Cabang Panciro", productId: 3, productName: "Telur Itik", unit: "kg", stockQty: 5, minStock: 6 },
  { branchId: 3, branchName: "Toko Cabang Delta", productId: 3, productName: "Telur Itik", unit: "kg", stockQty: 0, minStock: 6 },
  { branchId: 1, branchName: "Toko Utama", productId: 4, productName: "Telur Bebek", unit: "kg", stockQty: 8, minStock: 5 },
  { branchId: 2, branchName: "Toko Cabang Panciro", productId: 4, productName: "Telur Bebek", unit: "kg", stockQty: 6, minStock: 5 },
  { branchId: 3, branchName: "Toko Cabang Delta", productId: 4, productName: "Telur Bebek", unit: "kg", stockQty: 2, minStock: 5 },
  { branchId: 1, branchName: "Toko Utama", productId: 5, productName: "Telur Puyuh", unit: "papan", stockQty: 30, minStock: 15 },
  { branchId: 2, branchName: "Toko Cabang Panciro", productId: 5, productName: "Telur Puyuh", unit: "papan", stockQty: 12, minStock: 15 },
  { branchId: 3, branchName: "Toko Cabang Delta", productId: 5, productName: "Telur Puyuh", unit: "papan", stockQty: 20, minStock: 15 },
  { branchId: 1, branchName: "Toko Utama", productId: 6, productName: "Telur Ayam Omega-3", unit: "kg", stockQty: 6, minStock: 4 },
  { branchId: 2, branchName: "Toko Cabang Panciro", productId: 6, productName: "Telur Ayam Omega-3", unit: "kg", stockQty: 4, minStock: 4 },
  { branchId: 3, branchName: "Toko Cabang Delta", productId: 6, productName: "Telur Ayam Omega-3", unit: "kg", stockQty: 1, minStock: 4 },
];

export const MOCK_BRANCHES: BranchMonitoring[] = [
  {
    id: 1,
    name: "Toko Utama",
    city: "Kota",
    address: "Jl. Raya Telur No. 1",
    status: "aktif",
    todayRevenue: 1_250_000,
    monthRevenue: 24_800_000,
    todayTransactions: 8,
    lowStockItems: 2,
    outItems: 0,
    members: 320,
    pointsAwarded: 1540,
  },
  {
    id: 2,
    name: "Toko Cabang Panciro",
    city: "Kota A",
    address: "Jl. Merdeka No. 12",
    status: "aktif",
    todayRevenue: 620_000,
    monthRevenue: 13_400_000,
    todayTransactions: 5,
    lowStockItems: 1,
    outItems: 1,
    members: 128,
    pointsAwarded: 760,
  },
  {
    id: 3,
    name: "Toko Cabang Delta",
    city: "Kota B",
    address: "Jl. Pemuda No. 3",
    status: "libur",
    todayRevenue: 0,
    monthRevenue: 7_900_000,
    todayTransactions: 0,
    lowStockItems: 3,
    outItems: 2,
    members: 74,
    pointsAwarded: 410,
  },
];