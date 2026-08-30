export type CashType = "pemasukan" | "pengeluaran";

export interface CategoryOption {
  value: string;
  label: string;
}

export const INCOME_CATEGORIES: CategoryOption[] = [
  { value: "Penjualan", label: "Penjualan" },
  { value: "Investasi", label: "Investasi" },
  { value: "Lain-lain", label: "Lain-lain" },
];

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: "Belanja Stok", label: "Belanja Stok" },
  { value: "Gaji Karyawan", label: "Gaji Karyawan" },
  { value: "Lain-lain", label: "Lain-lain" },
];

export const CATEGORIES_BY_TYPE: Record<CashType, CategoryOption[]> = {
  pemasukan: INCOME_CATEGORIES,
  pengeluaran: EXPENSE_CATEGORIES,
};

export interface CashEntry {
  id: number;
  type: CashType;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
}

export const MOCK_CASH_ENTRIES: CashEntry[] = [
  {
    id: 1,
    type: "pemasukan",
    category: "Penjualan",
    amount: 1_120_000,
    note: "Penjualan kasir 30 Agustus",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    type: "pemasukan",
    category: "Investasi",
    amount: 5_000_000,
    note: "Setoran modal tambahan",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

export const MOCK_EXPENSE_ENTRIES: CashEntry[] = [
  {
    id: 101,
    type: "pengeluaran",
    category: "Belanja Stok",
    amount: 1_200_000,
    note: "Belanja telur dari peternak",
    createdAt: new Date().toISOString(),
  },
  {
    id: 102,
    type: "pengeluaran",
    category: "Lain-lain",
    amount: 50_000,
    note: "Kebersihan toko",
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

export const ALL_CATEGORIES: string[] = Array.from(
  new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((c) => c.value))
);